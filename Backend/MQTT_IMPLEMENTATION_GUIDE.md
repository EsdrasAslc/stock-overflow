# Guia de Implementação MQTT — Stock Overflow (estoque-api)

> **Público-alvo:** Estudantes e desenvolvedores implementando a integração MQTT pela primeira vez.
> **Idioma:** Português brasileiro.
> **Restrição:** Este documento é apenas de referência — não modifique arquivos Java ao seguir este guia sem entender cada etapa.

---

## 1. VISÃO GERAL DO FLUXO COMPLETO

### Diagrama ASCII — Ponta a Ponta

```
┌─────────────┐        POST /api/movimentacoes         ┌────────────────────┐
│   Frontend  │ ─────────────────────────────────────► │   Spring Boot API  │
│  (Browser)  │                                         │  (Java / Maven)    │
└─────────────┘                                         └────────┬───────────┘
                                                                 │
                                                 Publica JSON em │ robo/comandos
                                                                 ▼
                                                        ┌────────────────┐
                                                        │  Broker MQTT   │
                                                        │  (Mosquitto)   │
                                                        └───────┬────────┘
                                                                │
                                              ESP32 subscreve  │  robo/comandos
                                                                ▼
                                                       ┌─────────────────┐
                                                       │  ESP32 (Robô)   │
                                                       │  - Move eixo X  │
                                                       │  - Move eixo Y  │
                                                       │  - Aciona garra │
                                                       └───────┬─────────┘
                                                               │
                                             Publica JSON em   │  robo/status
                                                               ▼
                                                      ┌────────────────────┐
                                                      │  Broker MQTT       │
                                                      └────────┬───────────┘
                                                               │
                                     Spring Boot subscreve     │  robo/status
                                                               ▼
                                                      ┌────────────────────┐
                                                      │  Spring Boot API   │
                                                      │  processarStatus() │
                                                      │  - Atualiza BD     │
                                                      │  - Registra Log    │
                                                      └────────────────────┘
                                                               │
                                    GET /api/robots/{id}       │  (polling)
                                                               ▼
                                                      ┌─────────────────┐
                                                      │    Frontend     │
                                                      │  (vê resultado) │
                                                      └─────────────────┘
```

### Explicação de Cada Etapa

**Etapa 1 — Frontend faz POST**
O operador do armazém clica em "Iniciar Movimentação" na interface. O frontend envia um `POST /api/movimentacoes` com o corpo JSON indicando qual robô deve mover qual produto, de qual estante para qual destino.

**Etapa 2 — Spring Boot cria a movimentação como PENDENTE**
O `RobotMovimentService.criar()` salva um novo `RobotMoviment` no banco com `statusMovimentacao = PENDENTE`. Nenhuma alteração de estoque ocorre ainda. Este é o ponto central da estratégia anti-dado-fantasma.

**Etapa 3 — Spring Boot publica no tópico `robo/comandos`**
O `MqttGateway` publica um JSON com os dados da movimentação (movId, origemEstanteId, destinoEstanteId, tipoMovimento) no tópico `robo/comandos` via broker MQTT.

**Etapa 4 — ESP32 recebe o comando**
O ESP32, que está subscrito no tópico `robo/comandos`, recebe a mensagem na função de callback `onMqttMessage()`. Ele imediatamente publica de volta um status `EM_EXECUCAO` para confirmar que recebeu o comando.

**Etapa 5 — ESP32 executa o movimento físico**
O robô move-se nos eixos X e Y até chegar na estante de origem. Em seguida, a garra recolhe ou deposita o produto. Durante cada etapa, o ESP32 publica atualizações de posição com o campo `estanteAtualId`.

**Etapa 6 — ESP32 publica o resultado**
Após concluir (ou falhar), o ESP32 publica no tópico `robo/status` um JSON com `status: "SUCESSO"` ou `status: "FALHA"`.

**Etapa 7 — Spring Boot processa o resultado**
O `MqttMessageListener` recebe a mensagem e chama `processarStatusMqtt()`. Dependendo do status:
- **SUCESSO:** atualiza `produto.quantidade`, `estante.capacidadeAtual` e registra Log LOGISTICA.
- **FALHA:** não altera estoque, registra Log ERRO, muda `Robot.status` para `MANUTENCAO`.

**Etapa 8 — Frontend vê o resultado**
O frontend faz polling em `GET /api/robots/{id}` a cada 1–2 segundos para exibir a posição atual e o status da movimentação.

### O que acontece se o ESP32 não responder (timeout)?

Se o ESP32 não publicar nenhuma resposta em `robo/status` dentro de um prazo esperado (ex: 30 segundos), a movimentação permanece no status `PENDENTE` indefinidamente. Para evitar isso, recomenda-se implementar um **job agendado** com `@Scheduled` que busca movimentações com status `PENDENTE` há mais de X minutos e as marca como `FALHA`, registrando o Log de `ERRO` com a mensagem `"Timeout: ESP32 não respondeu"`. Isso impede que movimentações travadas acumulem no banco.

---

## 2. CONFIGURAÇÃO DO SPRING BOOT — MQTT

### Beans em `MqttConfig.java`

#### `MqttPahoClientFactory`
Responsável por criar conexões com o broker MQTT usando o protocolo Paho. Configura o endereço do broker, credenciais (se houver) e opções de conexão como `cleanSession` e timeout. É o ponto de entrada da conexão.

```java
@Bean
public MqttPahoClientFactory mqttClientFactory() {
    DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
    MqttConnectOptions options = new MqttConnectOptions();
    options.setServerURIs(new String[]{"tcp://" + brokerHost + ":" + brokerPort});
    options.setCleanSession(false); // mantém sessão para não perder mensagens
    options.setConnectionTimeout(30);
    options.setKeepAliveInterval(60);
    factory.setConnectionOptions(options);
    return factory;
}
```

**Por que `cleanSession=false`?** Para garantir que se o Spring Boot cair e reiniciar, o broker entregará todas as mensagens que chegaram enquanto estava offline (desde que QoS >= 1).

#### `MessageChannel outboundChannel`
Canal de comunicação interno do Spring Integration pelo qual as mensagens de saída (publicações) trafegam. É uma fila interna — o `MqttGateway` coloca mensagens aqui e o handler as pega e envia ao broker.

```java
@Bean
public MessageChannel mqttOutboundChannel() {
    return new DirectChannel();
}
```

#### `MqttPahoMessageHandler`
É o componente que de fato envia mensagens para o broker MQTT. Recebe mensagens do `outboundChannel`, as serializa e as publica no tópico configurado. Configura QoS e o comportamento de publicação.

```java
@Bean
@ServiceActivator(inputChannel = "mqttOutboundChannel")
public MessageHandler mqttOutbound(MqttPahoClientFactory factory) {
    MqttPahoMessageHandler handler = new MqttPahoMessageHandler(
        "spring-publisher-client", factory
    );
    handler.setAsync(true);           // não bloqueia a thread principal
    handler.setDefaultTopic("robo/comandos");
    handler.setDefaultQos(1);         // QoS 1 = entrega ao menos uma vez
    return handler;
}
```

#### `IntegrationFlow inbound`
Define o pipeline de recebimento de mensagens: subscreve no tópico `robo/status`, recebe mensagens do broker, as passa pelo canal interno e as entrega ao listener. É o oposto do handler — é quem recebe.

```java
@Bean
public IntegrationFlow mqttInboundFlow(MqttPahoClientFactory factory) {
    return IntegrationFlow
        .from(mqttInboundAdapter(factory))
        .channel("mqttInboundChannel")
        .get();
}

private MqttPahoMessageDrivenChannelAdapter mqttInboundAdapter(MqttPahoClientFactory factory) {
    MqttPahoMessageDrivenChannelAdapter adapter =
        new MqttPahoMessageDrivenChannelAdapter("spring-subscriber-client", factory, "robo/status");
    adapter.setCompletionTimeout(5000);
    adapter.setConverter(new DefaultPahoMessageConverter());
    adapter.setQos(1);
    return adapter;
}
```

#### `MessageChannel inboundChannel`
Canal interno pelo qual as mensagens recebidas do broker trafegam até o `MqttMessageListener`. Funciona como a "esteira" que leva mensagens do adaptador ao seu handler.

```java
@Bean
public MessageChannel mqttInboundChannel() {
    return new DirectChannel();
}
```

### Propriedades necessárias em `application.properties`

```properties
# ──────────────────────────────────────────
# Configurações MQTT
# ──────────────────────────────────────────

# Host do broker MQTT (mesmo da rede local do ESP32)
mqtt.broker.host=localhost

# Porta padrão do Mosquitto (TCP)
mqtt.broker.port=1883

# Tópico que o Spring publica (ESP32 subscreve)
mqtt.topic.commands=robo/comandos

# Tópico que o ESP32 publica (Spring subscreve)
mqtt.topic.status=robo/status

# Client ID único para o publisher do Spring
mqtt.client.id.publisher=spring-publisher-client

# Client ID único para o subscriber do Spring
mqtt.client.id.subscriber=spring-subscriber-client

# QoS: 0=fire and forget, 1=ao menos uma vez, 2=exatamente uma vez
# Recomendado: 1 para garantir entrega sem overhead de QoS 2
mqtt.qos=1
```

> ⚠️ **Atenção:** Se o ESP32 e o Spring Boot estão na mesma rede local, use o IP da máquina onde o Mosquitto roda (ex: `192.168.1.100`), **não** `localhost` no ESP32.

### Como `MqttGateway` funciona como interface de publicação

`MqttGateway` é uma interface anotada com `@MessagingGateway`. O Spring Integration gera automaticamente uma implementação em runtime. Basta injetá-la e chamar o método `publicar()` — o Spring cuida de pegar a mensagem, colocá-la no `outboundChannel` e de lá o `MqttPahoMessageHandler` a envia ao broker.

```java
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface MqttGateway {
    void publicar(@Payload String payload, @Header(MqttHeaders.TOPIC) String topico);
}
```

**Exemplo de uso em um Service:**
```java
// Dentro de RobotMovimentService
String json = objectMapper.writeValueAsString(comandoDTO);
mqttGateway.publicar(json, "robo/comandos");
```

### Como `MqttMessageListener` recebe mensagens do ESP32

O listener é um `@Component` anotado com `@ServiceActivator(inputChannel = "mqttInboundChannel")`. O Spring Integration chama automaticamente o método anotado toda vez que uma mensagem chega no canal de entrada (ou seja, toda vez que o ESP32 publica em `robo/status`).

```java
@Component
public class MqttMessageListener {

    private final RobotMovimentService robotMovimentService;

    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handleMessage(String payload) {
        // payload é a String JSON publicada pelo ESP32
        robotMovimentService.processarStatusMqtt(payload);
    }
}
```

O método `processarStatusMqtt()` faz o deserialização do JSON, identifica a movimentação pelo `movId` e aplica a lógica de negócio correspondente ao status recebido.

---

## 3. LÓGICA DE VERIFICAÇÃO ASSÍNCRONA (ANTI DADO FANTASMA)

### O problema do Dado Fantasma

**Dado fantasma** é quando o banco de dados reflete uma realidade que não aconteceu fisicamente. Exemplo clássico no contexto deste projeto:

1. Frontend solicita mover Parafuso de Aço da EST-01 para EST-02.
2. Spring Boot **imediatamente** decrementa `estante.capacidadeAtual` da EST-01 e incrementa a da EST-02.
3. O ESP32 recebe o comando mas falha no meio do caminho (queda de energia, motor travado).
4. Resultado: **O banco diz que o produto está em EST-02, mas fisicamente ele nunca saiu de EST-01** (ou caiu no chão). O estoque está errado — isso é um dado fantasma.

### Por que `StatusMovimentacao.PENDENTE` existe

O status `PENDENTE` é a defesa principal contra dados fantasmas. Ele representa a promessa de que uma movimentação foi solicitada, mas **ainda não foi executada e confirmada pelo robô**. Enquanto uma movimentação está `PENDENTE`, nenhuma alteração de estoque deve ocorrer.

### A sequência correta de estados

```
Requisição do Frontend
        │
        ▼
   ┌─────────┐      Spring Boot cria o registro
   │ PENDENTE│ ◄─── Nenhuma alteração de estoque
   └────┬────┘
        │  ESP32 recebe o comando e confirma
        ▼
┌──────────────┐    Spring Boot atualiza Robot.status
│ EM_EXECUCAO  │    Spring Boot atualiza Robot.estanteAtual
└──────┬───────┘    Ainda sem alteração de estoque
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐  ┌───────┐
│SUCESSO│  │ FALHA │
└──┬───┘  └───┬───┘
   │           │
   │           └── Robot.status = MANUTENCAO
   │               Log ERRO registrado
   │               Estoque NÃO alterado
   │
   └── produto.quantidade atualizado
       estante.capacidadeAtual atualizado
       Log LOGISTICA registrado
       Robot.status = AGUARDANDO
```

### Pseudocódigo de `processarStatusMqtt()`

```java
@Transactional
public void processarStatusMqtt(String payload) {
    // 1. Deserializar o JSON do ESP32
    StatusMqttDTO dto = objectMapper.readValue(payload, StatusMqttDTO.class);

    // 2. Buscar a movimentação pelo ID
    RobotMoviment moviment = repository.findById(dto.movId())
        .orElseThrow(() -> new RuntimeException("Movimentação não encontrada: " + dto.movId()));

    Robot robot = moviment.getRobot();

    // 3. Atualizar o status da movimentação
    moviment.setStatusMovimentacao(dto.status());

    switch (dto.status()) {

        case EM_EXECUCAO:
            // Atualizar posição atual do robô
            if (dto.estanteAtualId() != null) {
                Estante estanteAtual = estanteRepository.findById(dto.estanteAtualId())
                    .orElseThrow(...);
                robot.setEstanteAtual(estanteAtual);
            }
            robot.setStatus(RobotStatus.EM_MOVIMENTO);
            robotRepository.save(robot);
            break;

        case SUCESSO:
            // ✅ Só agora atualizamos o estoque
            Produto produto = moviment.getProduto();
            Estante origem  = moviment.getOrigemEstante();
            Estante destino = moviment.getDestinoEstante();

            if (moviment.getTipoMovimento() == TipoMovimento.REMOVER) {
                // Produto saiu da origem
                origem.setCapacidadeAtual(origem.getCapacidadeAtual() - 1);
                produto.setEstante(destino); // produto agora está no destino
            } else {
                // Produto chegou ao destino
                destino.setCapacidadeAtual(destino.getCapacidadeAtual() + 1);
            }

            estanteRepository.save(origem);
            estanteRepository.save(destino);
            produtoRepository.save(produto);

            // Atualizar robô
            robot.setStatus(RobotStatus.AGUARDANDO);
            robot.setProdutoAtual(null);
            robot.setEstanteAtual(destino);
            robotRepository.save(robot);

            // Registrar Log
            Log log = Log.builder()
                .timestamp(LocalDateTime.now())
                .tipo(TipoLog.LOGISTICA)
                .mensagem(dto.mensagem())
                .estante(destino)
                .robot(robot)
                .movimentacao(moviment)
                .build();
            logRepository.save(log);
            break;

        case FALHA:
            // ❌ NÃO alterar o estoque
            robot.setStatus(RobotStatus.MANUTENCAO); // robô precisa de atenção
            robotRepository.save(robot);

            // Registrar Log de ERRO
            Log logErro = Log.builder()
                .timestamp(LocalDateTime.now())
                .tipo(TipoLog.ERRO)
                .mensagem("Falha na movimentação: " + dto.erro())
                .robot(robot)
                .movimentacao(moviment)
                .build();
            logRepository.save(logErro);
            break;
    }

    repository.save(moviment);
}
```

### Por que `@Transactional` é obrigatório

O método `processarStatusMqtt()` realiza **múltiplas operações de banco em uma única execução**:

1. Busca o `RobotMoviment`
2. Busca o `Robot`
3. Busca as `Estante` (origem e destino)
4. Busca o `Produto`
5. Salva `Estante` (origem)
6. Salva `Estante` (destino)
7. Salva `Produto`
8. Salva `Robot`
9. Salva `Log`
10. Salva `RobotMoviment` (status atualizado)

Se **qualquer uma dessas operações falhar** (ex: constraint de banco, timeout), sem `@Transactional` todas as anteriores já teriam sido commitadas — o banco ficaria em estado inconsistente (ex: estoque decrementado mas produto não atualizado).

Com `@Transactional`, todas as operações fazem parte de **uma única transação atômica**: ou todas têm sucesso e são commitadas juntas, ou qualquer falha faz um rollback completo de todas, voltando ao estado anterior.

---

## 4. TELEMETRIA EM TEMPO REAL — POSIÇÃO DO ROBÔ

### Como `Robot.estanteAtual` é atualizado via MQTT

O campo `estanteAtual` representa a posição física atual do robô no armazém. Ele é atualizado toda vez que o ESP32 publica uma mensagem com `status: "EM_EXECUCAO"` e inclui o campo `estanteAtualId`.

O fluxo é:
1. ESP32 chega próximo a uma estante durante o movimento.
2. Publica `{"status": "EM_EXECUCAO", "estanteAtualId": "EST-02", ...}`.
3. `MqttMessageListener` recebe e chama `processarStatusMqtt()`.
4. Spring Boot busca a `Estante` com id `"EST-02"` no banco.
5. Chama `robot.setEstanteAtual(estante)` e salva.
6. Frontend faz polling em `GET /api/robots/ROB-01` e vê `estanteAtualId: "EST-02"`.

### Payload JSON publicado pelo ESP32 durante o movimento

```json
{
  "movId": "a3f1d7e2-4b5c-4d88-9f1a-2b6c8e0d1f3a",
  "status": "EM_EXECUCAO",
  "mensagem": "Movendo para EST-02",
  "estanteAtualId": "EST-02",
  "erro": null
}
```

| Campo          | Tipo     | Obrigatório | Descrição                                       |
|----------------|----------|-------------|-------------------------------------------------|
| `movId`        | String   | Sim         | UUID da `RobotMoviment` para rastreamento       |
| `status`       | String   | Sim         | Um de: `EM_EXECUCAO`, `SUCESSO`, `FALHA`        |
| `mensagem`     | String   | Não         | Texto livre descritivo da etapa atual           |
| `estanteAtualId` | String | Não         | ID da estante onde o robô está agora            |
| `erro`         | String   | Não         | Descrição do erro (preenchido apenas em `FALHA`) |

### Como o frontend pode monitorar a posição em tempo real

Enquanto uma solução de tempo real com SSE (Server-Sent Events) ou WebSocket não for implementada, o frontend pode usar **polling HTTP**:

```javascript
// Exemplo em JavaScript (frontend)
async function monitorarRobo(robotId, intervaloMs = 1500) {
  const poll = async () => {
    const response = await fetch(`/api/robots/${robotId}`);
    const robot = await response.json();

    // Atualizar UI com posição atual
    console.log("Status:", robot.status);
    console.log("Estante atual:", robot.estanteAtualId);
    console.log("Produto carregando:", robot.produtoAtual?.nome);

    // Parar quando o robô não estiver mais em movimento
    if (robot.status !== "EM_MOVIMENTO") {
      clearInterval(intervalId);
      console.log("Movimento concluído.");
    }
  };

  const intervalId = setInterval(poll, intervaloMs);
  poll(); // executa imediatamente
}

// Chamar após disparar uma movimentação
monitorarRobo("ROB-01");
```

**Por que 1–2 segundos?** O movimento físico do robô leva vários segundos. Polling a cada 1.5s equilibra a responsividade visual com a carga no servidor. Intervalos menores que 500ms podem sobrecarregar o banco desnecessariamente.

---

## 5. CÓDIGO COMPLETO DO ESP32 (C++ / Arduino)

### 5.1 Dependências necessárias

No **Arduino IDE**, instale via Library Manager (`Sketch > Include Library > Manage Libraries`):

| Biblioteca       | Versão recomendada | Para quê serve                          |
|------------------|--------------------|-----------------------------------------|
| `PubSubClient`   | 2.8+               | Protocolo MQTT sobre TCP/IP             |
| `ArduinoJson`    | 6.x (v6+)          | Serialização/deserialização de JSON     |
| `WiFi`           | Nativa ESP32       | Conexão Wi-Fi (já vem com o ESP32 SDK) |

No **PlatformIO** (`platformio.ini`):

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
```

### 5.2 Código completo — `robo_mqtt.ino`

```cpp
// ═══════════════════════════════════════════════════════════════════════════
//  Stock Overflow — Firmware do Robô (ESP32)
//  Responsável por: receber comandos via MQTT, mover fisicamente e reportar
// ═══════════════════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ───────────────────────────────────────────────────────────────────────────
// 5.2 CONFIGURAÇÕES — edite conforme seu ambiente
// ───────────────────────────────────────────────────────────────────────────

// Wi-Fi
const char* WIFI_SSID     = "NomeDaSuaRede";
const char* WIFI_PASSWORD = "SenhaDaRede";

// MQTT Broker — use o IP da máquina onde o Mosquitto roda
// Se o Spring Boot e ESP32 estão na mesma rede: IP local da máquina (ex: 192.168.1.100)
// NUNCA use "localhost" no ESP32 — localhost aponta para o próprio ESP32
const char* MQTT_BROKER_HOST = "192.168.1.100";
const int   MQTT_BROKER_PORT = 1883;
const char* MQTT_CLIENT_ID   = "ESP32-ROB-01";   // deve ser único na rede

// Tópicos MQTT
const char* TOPIC_COMMANDS = "robo/comandos";  // ESP32 subscreve
const char* TOPIC_STATUS   = "robo/status";    // ESP32 publica

// Identidade do robô
const char* ROBOT_ID = "ROB-01";

// ───────────────────────────────────────────────────────────────────────────
// 5.3 DEFINIÇÃO DE PINOS — L298N Driver
// ───────────────────────────────────────────────────────────────────────────
// Diagrama de conexão do L298N ao ESP32:
//
//   L298N          ESP32
//   ──────────────────────
//   IN1    ──────►  GPIO 25  (dir. X)
//   IN2    ──────►  GPIO 26  (dir. X)
//   ENA    ──────►  GPIO 27  (PWM X) — Conecte via PWM ou ponte HIGH para sempre ativo
//   IN3    ──────►  GPIO 32  (dir. Y)
//   IN4    ──────►  GPIO 33  (dir. Y)
//   ENB    ──────►  GPIO 14  (PWM Y)
//   GND    ──────►  GND ESP32 (obrigatório ligar GNDs juntos!)
//   VCC    ──────►  Fonte externa 12V (NÃO use o 5V do ESP32 para o motor!)
//   5V out ──────►  VIN ESP32 (opcional, se quiser alimentar o ESP32 pelo L298N)

// Motor Eixo X (horizontal — move entre estantes)
const int MOTOR_X_IN1 = 25;
const int MOTOR_X_IN2 = 26;
const int MOTOR_X_ENA = 27;  // PWM

// Motor Eixo Y (vertical — move entre andares/prateleiras)
const int MOTOR_Y_IN3 = 32;
const int MOTOR_Y_IN4 = 33;
const int MOTOR_Y_ENB = 14;  // PWM

// Motor da Garra / Mecanismo de retirada
// Pode ser um servo, motor DC, ou solenoide
const int MOTOR_GARRA_PIN = 13;  // Sinal PWM para servo ou digital para DC

// Sensor de fim de curso (OPCIONAL — mas fortemente recomendado)
// Conecte um fim de curso mecânico ou óptico para saber quando chegou na posição
// const int FIM_DE_CURSO_X = 34;  // Entrada digital (entrada apenas no ESP32)
// const int FIM_DE_CURSO_Y = 35;

// ───────────────────────────────────────────────────────────────────────────
// 5.6 MAPEAMENTO DE ESTANTES PARA COORDENADAS FÍSICAS
// ───────────────────────────────────────────────────────────────────────────
// Adapte os valores de X e Y para sua estrutura física.
// Unidade: milissegundos de ativação do motor (aprox. distância)
// Calibre esses valores medindo o tempo necessário para ir de um ponto a outro.

struct EstanteCoordenada {
  const char* id;
  int x;   // tempo em ms para mover no eixo X a partir da posição inicial
  int y;   // tempo em ms para mover no eixo Y a partir da posição inicial
};

// Tabela de estantes — expanda conforme o número de estantes do armazém
const int NUM_ESTANTES = 4;
EstanteCoordenada estantes[NUM_ESTANTES] = {
  {"EST-01", 0,    0   },   // Posição home (origem)
  {"EST-02", 1000, 0   },   // 1000ms à direita da EST-01
  {"EST-03", 0,    1500},   // 1500ms acima da EST-01
  {"EST-04", 1000, 1500},   // 1000ms direita + 1500ms acima
};

// ───────────────────────────────────────────────────────────────────────────
// VARIÁVEIS GLOBAIS
// ───────────────────────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// Posição atual do robô em coordenadas físicas
int posicaoAtualX = 0;
int posicaoAtualY = 0;

// Estado de execução
bool emExecucao = false;
String movIdAtual = "";

// ───────────────────────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES — Busca de coordenadas
// ───────────────────────────────────────────────────────────────────────────

EstanteCoordenada* buscarEstante(const char* id) {
  for (int i = 0; i < NUM_ESTANTES; i++) {
    if (strcmp(estantes[i].id, id) == 0) {
      return &estantes[i];
    }
  }
  return nullptr;  // não encontrada
}

// ───────────────────────────────────────────────────────────────────────────
// 5.4 FUNÇÕES DE MOVIMENTO
// ───────────────────────────────────────────────────────────────────────────

// Move o robô no eixo X
// deltaMs: tempo de ativação do motor em milissegundos
// direcao: "DIREITA" ou "ESQUERDA"
void moverEixoX(int deltaMs, String direcao) {
  if (deltaMs <= 0) return;  // sem movimento necessário

  Serial.println("Movendo eixo X: " + direcao + " por " + deltaMs + "ms");

  // Configura direção
  if (direcao == "DIREITA") {
    digitalWrite(MOTOR_X_IN1, HIGH);
    digitalWrite(MOTOR_X_IN2, LOW);
  } else {
    digitalWrite(MOTOR_X_IN1, LOW);
    digitalWrite(MOTOR_X_IN2, HIGH);
  }

  // Liga motor com PWM na velocidade máxima (255 = 100%)
  analogWrite(MOTOR_X_ENA, 200);  // 200/255 ≈ 78% velocidade
  delay(deltaMs);

  // Para o motor
  analogWrite(MOTOR_X_ENA, 0);
  digitalWrite(MOTOR_X_IN1, LOW);
  digitalWrite(MOTOR_X_IN2, LOW);

  delay(200);  // pausa de segurança entre movimentos
}

// Move o robô no eixo Y
// deltaMs: tempo de ativação do motor em milissegundos
// direcao: "SUBIR" ou "DESCER"
void moverEixoY(int deltaMs, String direcao) {
  if (deltaMs <= 0) return;

  Serial.println("Movendo eixo Y: " + direcao + " por " + deltaMs + "ms");

  if (direcao == "SUBIR") {
    digitalWrite(MOTOR_Y_IN3, HIGH);
    digitalWrite(MOTOR_Y_IN4, LOW);
  } else {
    digitalWrite(MOTOR_Y_IN3, LOW);
    digitalWrite(MOTOR_Y_IN4, HIGH);
  }

  analogWrite(MOTOR_Y_ENB, 200);
  delay(deltaMs);

  analogWrite(MOTOR_Y_ENB, 0);
  digitalWrite(MOTOR_Y_IN3, LOW);
  digitalWrite(MOTOR_Y_IN4, LOW);

  delay(200);
}

// Aciona o mecanismo de garra
// acao: "RETIRAR" (pega produto da prateleira) ou "COLOCAR" (deposita na prateleira)
void acionarGarra(String acao) {
  Serial.println("Acionando garra: " + acao);

  if (acao == "RETIRAR") {
    // Exemplo para servo: gira para posição de retirada
    // Para motor DC simples: liga em uma direção por 2 segundos
    digitalWrite(MOTOR_GARRA_PIN, HIGH);
    delay(2000);
    digitalWrite(MOTOR_GARRA_PIN, LOW);
  } else {  // COLOCAR
    // Para servo: gira para posição de depósito
    // Para motor DC: liga na direção reversa
    digitalWrite(MOTOR_GARRA_PIN, HIGH);
    delay(2000);
    digitalWrite(MOTOR_GARRA_PIN, LOW);
  }

  delay(500);  // aguarda estabilizar
}

// Move da posição atual até a estante alvo
// Retorna true se chegou, false se estante não mapeada
bool moverParaEstante(const char* estanteId, String movId) {
  EstanteCoordenada* destino = buscarEstante(estanteId);

  if (destino == nullptr) {
    Serial.println("ERRO: Estante não encontrada no mapeamento: " + String(estanteId));
    return false;
  }

  int deltaX = destino->x - posicaoAtualX;
  int deltaY = destino->y - posicaoAtualY;

  // Publicar posição de saída
  publicarStatus(movId, "EM_EXECUCAO",
    "Saindo para " + String(estanteId), estanteId);

  // Movimento X
  if (deltaX != 0) {
    moverEixoX(abs(deltaX), deltaX > 0 ? "DIREITA" : "ESQUERDA");
    posicaoAtualX = destino->x;
    publicarStatus(movId, "EM_EXECUCAO",
      "Posicionado em X=" + String(posicaoAtualX), estanteId);
  }

  // Movimento Y
  if (deltaY != 0) {
    moverEixoY(abs(deltaY), deltaY > 0 ? "SUBIR" : "DESCER");
    posicaoAtualY = destino->y;
    publicarStatus(movId, "EM_EXECUCAO",
      "Posicionado em Y=" + String(posicaoAtualY), estanteId);
  }

  return true;
}

// ───────────────────────────────────────────────────────────────────────────
// FUNÇÕES MQTT — Publicação de status
// ───────────────────────────────────────────────────────────────────────────

void publicarStatus(String movId, const char* status, String mensagem,
                    const char* estanteAtualId = "", const char* erro = "") {
  StaticJsonDocument<256> doc;
  doc["movId"]         = movId;
  doc["status"]        = status;
  doc["mensagem"]      = mensagem;
  doc["estanteAtualId"] = estanteAtualId;
  if (strlen(erro) > 0) {
    doc["erro"] = erro;
  }

  char buffer[256];
  serializeJson(doc, buffer);

  bool enviado = mqttClient.publish(TOPIC_STATUS, buffer, true);  // retain=true
  if (enviado) {
    Serial.println("MQTT publicado: " + String(buffer));
  } else {
    Serial.println("ERRO ao publicar MQTT!");
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 5.5 CALLBACK — Recebe comandos do Spring Boot
// ───────────────────────────────────────────────────────────────────────────

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Converter payload (bytes) para String
  String mensagemJson = "";
  for (int i = 0; i < length; i++) {
    mensagemJson += (char)payload[i];
  }

  Serial.println("═══ Comando recebido ═══");
  Serial.println("Tópico: " + String(topic));
  Serial.println("Payload: " + mensagemJson);

  // Deserializar JSON
  StaticJsonDocument<512> doc;
  DeserializationError erro = deserializeJson(doc, mensagemJson);

  if (erro) {
    Serial.println("ERRO ao parsear JSON: " + String(erro.c_str()));
    return;
  }

  // Extrair campos do comando
  String movId           = doc["movId"].as<String>();
  String origemEstanteId = doc["origemEstanteId"].as<String>();
  String destinoEstanteId = doc["destinoEstanteId"].as<String>();
  String tipoMovimento   = doc["tipoMovimento"].as<String>();  // "REMOVER" ou "ADICIONAR"

  // Validação básica
  if (movId.isEmpty() || origemEstanteId.isEmpty() || destinoEstanteId.isEmpty()) {
    Serial.println("ERRO: Campos obrigatórios ausentes no comando.");
    publicarStatus(movId, "FALHA", "Comando inválido recebido",
                   "", "Campos obrigatórios ausentes");
    return;
  }

  // Verificar se já está em execução (evitar comandos simultâneos)
  if (emExecucao) {
    Serial.println("AVISO: Já em execução de movId=" + movIdAtual + ". Ignorando novo comando.");
    return;
  }

  // ── 1. CONFIRMAR RECEBIMENTO IMEDIATAMENTE ──
  emExecucao = true;
  movIdAtual = movId;
  publicarStatus(movId, "EM_EXECUCAO",
    "Comando recebido, iniciando execução",
    origemEstanteId.c_str());

  bool sucesso = true;
  String mensagemErro = "";

  // ── 2. MOVER PARA ESTANTE DE ORIGEM ──
  if (!moverParaEstante(origemEstanteId.c_str(), movId)) {
    sucesso = false;
    mensagemErro = "Estante de origem não mapeada: " + origemEstanteId;
  }

  // ── 3. ACIONAR GARRA NA ESTANTE DE ORIGEM ──
  if (sucesso) {
    publicarStatus(movId, "EM_EXECUCAO",
      "Acionando mecanismo na estante de origem",
      origemEstanteId.c_str());

    if (tipoMovimento == "REMOVER") {
      acionarGarra("RETIRAR");   // pega o produto
    } else {
      acionarGarra("COLOCAR");   // deposita o produto
    }
  }

  // ── 4. MOVER PARA ESTANTE DE DESTINO ──
  if (sucesso) {
    if (!moverParaEstante(destinoEstanteId.c_str(), movId)) {
      sucesso = false;
      mensagemErro = "Estante de destino não mapeada: " + destinoEstanteId;
    }
  }

  // ── 5. ACIONAR GARRA NA ESTANTE DE DESTINO ──
  if (sucesso) {
    publicarStatus(movId, "EM_EXECUCAO",
      "Acionando mecanismo na estante de destino",
      destinoEstanteId.c_str());

    if (tipoMovimento == "REMOVER") {
      acionarGarra("COLOCAR");   // deposita o produto no destino
    } else {
      acionarGarra("RETIRAR");   // retira do destino (movimento ADICIONAR inverso)
    }
  }

  // ── 6. PUBLICAR RESULTADO FINAL ──
  if (sucesso) {
    publicarStatus(movId, "SUCESSO",
      "Produto movido com sucesso",
      destinoEstanteId.c_str());
    Serial.println("✅ Movimentação concluída com sucesso!");
  } else {
    publicarStatus(movId, "FALHA",
      "Falha durante a movimentação",
      "", mensagemErro.c_str());
    Serial.println("❌ Movimentação falhou: " + mensagemErro);
  }

  emExecucao = false;
  movIdAtual = "";
}

// ───────────────────────────────────────────────────────────────────────────
// 5.7 RECONEXÃO AUTOMÁTICA
// ───────────────────────────────────────────────────────────────────────────

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("Conectando ao Wi-Fi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi conectado! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ Falha ao conectar ao Wi-Fi. Tentará novamente no próximo ciclo.");
  }
}

void conectarMQTT() {
  if (mqttClient.connected()) return;

  Serial.println("Conectando ao broker MQTT: " + String(MQTT_BROKER_HOST));

  int tentativas = 0;
  while (!mqttClient.connected() && tentativas < 5) {
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("✅ Conectado ao broker MQTT!");
      mqttClient.subscribe(TOPIC_COMMANDS, 1);  // QoS 1
      Serial.println("Subscrito em: " + String(TOPIC_COMMANDS));
    } else {
      Serial.print("❌ Falha MQTT, rc=");
      Serial.println(mqttClient.state());
      // Códigos de erro do PubSubClient:
      // -4: MQTT_CONNECTION_TIMEOUT
      // -3: MQTT_CONNECTION_LOST
      // -2: MQTT_CONNECT_FAILED
      // -1: MQTT_DISCONNECTED
      //  0: MQTT_CONNECTED
      //  1: MQTT_CONNECT_BAD_PROTOCOL
      //  2: MQTT_CONNECT_BAD_CLIENT_ID
      //  3: MQTT_CONNECT_UNAVAILABLE
      //  4: MQTT_CONNECT_BAD_CREDENTIALS
      //  5: MQTT_CONNECT_UNAUTHORIZED
      delay(2000);
      tentativas++;
    }
  }

  if (!mqttClient.connected()) {
    // Se estava em execução e perdemos conexão → publicar FALHA quando reconectar
    if (emExecucao && !movIdAtual.isEmpty()) {
      Serial.println("ALERTA: Conexão perdida durante execução de " + movIdAtual);
      // Tentará publicar FALHA na próxima reconexão
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 5.8 SETUP E LOOP
// ───────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  Serial.println("═══════════════════════════════");
  Serial.println(" Stock Overflow — Robô " + String(ROBOT_ID));
  Serial.println("═══════════════════════════════");

  // Configurar pinos dos motores
  pinMode(MOTOR_X_IN1,   OUTPUT);
  pinMode(MOTOR_X_IN2,   OUTPUT);
  pinMode(MOTOR_X_ENA,   OUTPUT);
  pinMode(MOTOR_Y_IN3,   OUTPUT);
  pinMode(MOTOR_Y_IN4,   OUTPUT);
  pinMode(MOTOR_Y_ENB,   OUTPUT);
  pinMode(MOTOR_GARRA_PIN, OUTPUT);

  // Estado inicial dos motores (parado)
  digitalWrite(MOTOR_X_IN1, LOW);
  digitalWrite(MOTOR_X_IN2, LOW);
  digitalWrite(MOTOR_X_ENA, LOW);
  digitalWrite(MOTOR_Y_IN3, LOW);
  digitalWrite(MOTOR_Y_IN4, LOW);
  digitalWrite(MOTOR_Y_ENB, LOW);
  digitalWrite(MOTOR_GARRA_PIN, LOW);

  // Inicializar conexão Wi-Fi
  conectarWiFi();

  // Configurar broker MQTT
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(512);  // aumenta buffer para JSONs maiores

  // Conectar ao broker
  conectarMQTT();

  Serial.println("Robô pronto e aguardando comandos...");
}

void loop() {
  // Verificar e reconectar Wi-Fi se necessário
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Reconectando...");
    conectarWiFi();
  }

  // Verificar e reconectar MQTT se necessário
  if (!mqttClient.connected()) {
    conectarMQTT();

    // Se havia execução em andamento quando perdemos conexão → reportar FALHA
    if (emExecucao && !movIdAtual.isEmpty()) {
      publicarStatus(movIdAtual, "FALHA",
        "Conexão MQTT perdida durante execução",
        "", "Desconexão inesperada do broker");
      emExecucao = false;
      movIdAtual = "";
    }
  }

  // Processar mensagens MQTT recebidas (obrigatório chamar periodicamente)
  mqttClient.loop();

  // Pequeno delay para não sobrecarregar o processador
  delay(10);
}
```

---

## 6. PAYLOADS MQTT — REFERÊNCIA COMPLETA

### Backend → ESP32 (tópico: `robo/comandos`)

Publicado pelo Spring Boot logo após criar a `RobotMoviment` com status `PENDENTE`.

```json
{
  "movId": "a3f1d7e2-4b5c-4d88-9f1a-2b6c8e0d1f3a",
  "origemEstanteId": "EST-01",
  "destinoEstanteId": "EST-02",
  "produtoId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "tipoMovimento": "REMOVER"
}
```

| Campo              | Tipo   | Descrição                                   |
|--------------------|--------|---------------------------------------------|
| `movId`            | String | UUID da `RobotMoviment` — chave de rastreamento |
| `origemEstanteId`  | String | ID da estante onde o produto está agora     |
| `destinoEstanteId` | String | ID da estante para onde o produto vai       |
| `produtoId`        | String | UUID do produto que será movido             |
| `tipoMovimento`    | String | `"REMOVER"` ou `"ADICIONAR"`               |

---

### ESP32 → Backend (tópico: `robo/status`)

#### Status: `EM_EXECUCAO` (publicado ao receber o comando e durante o movimento)

```json
{
  "movId": "a3f1d7e2-4b5c-4d88-9f1a-2b6c8e0d1f3a",
  "status": "EM_EXECUCAO",
  "mensagem": "Movendo para EST-02",
  "estanteAtualId": "EST-02",
  "erro": null
}
```

#### Status: `SUCESSO` (publicado ao concluir com êxito)

```json
{
  "movId": "a3f1d7e2-4b5c-4d88-9f1a-2b6c8e0d1f3a",
  "status": "SUCESSO",
  "mensagem": "Produto retirado e depositado com sucesso",
  "estanteAtualId": "EST-02",
  "erro": null
}
```

#### Status: `FALHA` (publicado quando qualquer etapa falha)

```json
{
  "movId": "a3f1d7e2-4b5c-4d88-9f1a-2b6c8e0d1f3a",
  "status": "FALHA",
  "mensagem": "Falha durante a movimentação",
  "estanteAtualId": "EST-01",
  "erro": "Motor eixo Y não respondeu após 3000ms"
}
```

---

## 7. COMO TESTAR SEM O ESP32 (Simulação via CLI)

### Instalação do Mosquitto no Windows

1. Acesse: [https://mosquitto.org/download/](https://mosquitto.org/download/)
2. Baixe o instalador `mosquitto-2.x.x-install-windows-x64.exe`
3. Execute como administrador e instale com as opções padrão
4. Adicione o diretório de instalação ao PATH do sistema:
   - Geralmente: `C:\Program Files\mosquitto`
   - Pesquise "Variáveis de ambiente" no Windows → edite a variável `Path`

### Iniciando o broker

Abra um terminal PowerShell ou CMD como **administrador**:

```bash
# Inicia o broker com logs verbosos (mostra todas as conexões e mensagens)
mosquitto -v
```

Você verá algo como:
```
1685000000: mosquitto version 2.0.18 starting
1685000000: Config loaded from /etc/mosquitto/mosquitto.conf
1685000000: Starting in local only mode. Connections will only be possible from clients running on this machine.
1685000000: Opening ipv4 listen socket on port 1883.
1685000000: mosquitto version 2.0.18 running
```

> ⚠️ **Atenção:** Por padrão no Mosquitto 2.x, conexões externas (ex: do ESP32) são bloqueadas. Para permitir:
> Crie o arquivo `C:\mosquitto\mosquitto.conf` com:
> ```
> listener 1883
> allow_anonymous true
> ```
> E inicie com: `mosquitto -c C:\mosquitto\mosquitto.conf -v`

### Simular o ESP32 publicando SUCESSO

Abra um **segundo terminal** e execute:

```bash
# Simular ESP32 reportando SUCESSO
mosquitto_pub -h localhost -p 1883 -t "robo/status" -m "{\"movId\":\"SEU-MOV-ID-AQUI\",\"status\":\"SUCESSO\",\"mensagem\":\"Produto movido com sucesso\",\"estanteAtualId\":\"EST-02\",\"erro\":null}"
```

Substituindo `SEU-MOV-ID-AQUI` pelo UUID real de uma `RobotMoviment` com status `PENDENTE` no banco.

### Simular ESP32 reportando FALHA

```bash
mosquitto_pub -h localhost -p 1883 -t "robo/status" -m "{\"movId\":\"SEU-MOV-ID-AQUI\",\"status\":\"FALHA\",\"mensagem\":\"Falha na execução\",\"estanteAtualId\":\"EST-01\",\"erro\":\"Motor travado no eixo Y\"}"
```

### Simular ESP32 reportando EM_EXECUCAO

```bash
mosquitto_pub -h localhost -p 1883 -t "robo/status" -m "{\"movId\":\"SEU-MOV-ID-AQUI\",\"status\":\"EM_EXECUCAO\",\"mensagem\":\"Movendo para EST-02\",\"estanteAtualId\":\"EST-02\",\"erro\":null}"
```

### Escutar o que o Spring Boot publica em `robo/comandos`

Abra um **terceiro terminal** antes de fazer o POST pelo frontend:

```bash
# Fica ouvindo tudo que o Spring publica (simula o ESP32 recebendo comandos)
mosquitto_sub -h localhost -p 1883 -t "robo/comandos" -v
```

O `-v` mostra o tópico junto com a mensagem. Você verá o JSON do comando assim que o Spring Boot publicar.

### Fluxo completo de teste sem ESP32

```
Terminal 1: mosquitto -c C:\mosquitto\mosquitto.conf -v
Terminal 2: mosquitto_sub -h localhost -t "robo/comandos" -v    ← "ESP32" ouvindo
Terminal 3: (vazio, pronto para publicar status)

No Postman/browser:
  POST /api/movimentacoes {...}

Terminal 2 receberá o comando JSON.
Copie o movId do JSON.

Terminal 3: mosquitto_pub ... -m '{"movId":"ID_COPIADO","status":"SUCESSO",...}'

Spring Boot processará o SUCESSO e atualizará o banco.
Verifique com GET /api/movimentacoes/{id}
```

---

## 8. TROUBLESHOOTING

### Erro 1 — ESP32 não conecta no broker

**Sintoma:** Serial monitor mostra `MQTT connection failed, rc=-2` repetidamente.

**Causas e soluções:**

| Causa | Solução |
|-------|---------|
| IP do broker errado no ESP32 | Use o IP local da máquina (ex: `192.168.1.100`), nunca `localhost` |
| Porta 1883 bloqueada pelo firewall | Adicione regra de entrada no Windows Firewall para porta TCP 1883 |
| Mosquitto não está rodando | Execute `mosquitto -v` e verifique se aparece "running" |
| ESP32 e PC em redes diferentes | Certifique-se que ambos estão no mesmo Wi-Fi ou sub-rede |
| Mosquitto 2.x bloqueando externas | Configure `listener 1883` e `allow_anonymous true` no `mosquitto.conf` |

```bash
# Teste de conectividade (no PC com Mosquitto)
# Verifique se a porta está aberta:
netstat -an | findstr "1883"
```

---

### Erro 2 — Spring Boot não recebe mensagens do ESP32

**Sintoma:** ESP32 publica em `robo/status` mas nenhum log aparece no Spring Boot.

**Causas e soluções:**

| Causa | Solução |
|-------|---------|
| Nome do tópico com typo | Confirme que ESP32 publica `robo/status` e Spring subscreve `robo/status` (case-sensitive!) |
| QoS incompatível | Use QoS=1 em ambos os lados para garantir entrega |
| `clientId` duplicado | Se duas instâncias do Spring rodam com o mesmo clientId, o broker desconecta a mais antiga |
| `cleanSession=true` + downtime | Com `cleanSession=true`, se o Spring caiu e subiu, mensagens enviadas durante o downtime são perdidas |
| Erro no `@ServiceActivator` | Verifique se o channel name em `@ServiceActivator(inputChannel="mqttInboundChannel")` coincide exatamente com o bean do canal |

---

### Erro 3 — Dado fantasma mesmo com verificação

**Sintoma:** Estoque é atualizado mesmo quando o robô falha.

**Causa:** O método `processarStatusMqtt()` não tem `@Transactional`.

**Solução:** Adicione a anotação:

```java
@Transactional  // ← OBRIGATÓRIO!
public void processarStatusMqtt(String payload) {
    // ...
}
```

Sem `@Transactional`, se o método salva o estoque e depois falha ao salvar o Log, o estoque fica errado mas o método não faz rollback.

---

### Erro 4 — Robô publica SUCESSO mas estoque não atualiza

**Sintoma:** Log do Spring mostra "Movimentação não encontrada: [movId]".

**Causas:**

| Causa | Solução |
|-------|---------|
| `movId` no payload do ESP32 está errado | Verifique se o ESP32 está copiando exatamente o `movId` do comando recebido, sem modificações |
| Movimentação foi deletada do banco | Nunca delete `RobotMoviment` com status `PENDENTE` ou `EM_EXECUCAO` |
| UUID com espaços ou quebra de linha | Verifique a serialização no ESP32 — o `ArduinoJson` às vezes adiciona espaços inesperados |

**Debug:**

```bash
# No banco, verifique se a movimentação existe:
SELECT id, status_movimentacao FROM robot_moviments WHERE id = 'SEU-UUID-AQUI';
```

---

### Erro 5 — Desconexão MQTT durante execução

**Sintoma:** ESP32 desconecta do broker no meio de uma movimentação; o Spring Boot fica com a movimentação em `EM_EXECUCAO` para sempre.

**Solução em camadas:**

1. **No ESP32:** Ao detectar desconexão durante execução, publicar `FALHA` assim que reconectar:
   ```cpp
   if (emExecucao && !movIdAtual.isEmpty()) {
     publicarStatus(movIdAtual, "FALHA", "Desconexão durante execução",
                    "", "Conexão MQTT perdida");
   }
   ```

2. **No Spring Boot:** Job agendado para limpar movimentações travadas:
   ```java
   @Scheduled(fixedDelay = 60000)  // a cada 60 segundos
   public void limparMovimentacoesTravas() {
     LocalDateTime limite = LocalDateTime.now().minusMinutes(5);
     List<RobotMoviment> travadas = repository
       .findByStatusMovimentacaoAndTimestampBefore(StatusMovimentacao.EM_EXECUCAO, limite);
     // Marcar como FALHA e registrar Log ERRO
   }
   ```

3. **Configuração:** Use `cleanSession=false` e QoS=1 para garantir entrega mesmo após reconexão.

---

### Erro 6 — Motor não responde

**Sintoma:** Código executa sem erros mas o motor não se move.

| Causa | Solução |
|-------|---------|
| Pinos errados no código | Use `Serial.println()` para confirmar quais pinos estão sendo ativados e compare com o hardware |
| GND do L298N não conectado ao GND do ESP32 | **Obrigatório!** Os GNDs devem ser comuns |
| Alimentação insuficiente | Motores DC precisam de 6–12V externos; o ESP32 só fornece 3.3V/5V (insuficiente) |
| EN (enable) não está HIGH | No L298N, o pino ENA/ENB deve estar HIGH para o motor funcionar. Se estiver direto no +5V (jumper), não precisa configurar. Se conectado ao ESP32, ative com `analogWrite(ENA, 255)` |
| PWM no ESP32 vs Arduino | No ESP32, `analogWrite()` pode não funcionar em todos os pinos. Use `ledcWrite()` (API nativa do ESP32) para PWM confiável |

**PWM correto para ESP32:**

```cpp
// Configuração PWM nativa do ESP32 (mais confiável que analogWrite)
const int CANAL_PWM_X = 0;  // Canal PWM 0 (0-15 disponíveis)
const int CANAL_PWM_Y = 1;

void setup() {
  ledcSetup(CANAL_PWM_X, 1000, 8);    // Canal 0, 1kHz, 8 bits (0-255)
  ledcAttachPin(MOTOR_X_ENA, CANAL_PWM_X);

  ledcSetup(CANAL_PWM_Y, 1000, 8);
  ledcAttachPin(MOTOR_Y_ENB, CANAL_PWM_Y);
}

// Uso: ledcWrite(CANAL_PWM_X, 200);  // 200/255 = ~78% velocidade
```

---

### Erro 7 — Mensagens duplicadas chegando no listener

**Sintoma:** `processarStatusMqtt()` é chamado 2x para a mesma mensagem; estoque duplicado.

**Causa:** Dois beans do Spring estão subscrevendo o mesmo tópico, ou o clientId do subscriber é duplicado em múltiplas instâncias.

**Soluções:**

1. **Verifique que só existe um** `MqttPahoMessageDrivenChannelAdapter` subscrito em `robo/status`.

2. **Use clientId único por instância** (especialmente em ambiente de múltiplos pods):
   ```java
   String clientId = "spring-subscriber-" + UUID.randomUUID().toString().substring(0, 8);
   ```

3. **Implemente idempotência em `processarStatusMqtt()`:**
   ```java
   // Verificar se a movimentação já está em status terminal antes de processar
   if (moviment.getStatusMovimentacao() == StatusMovimentacao.SUCESSO
    || moviment.getStatusMovimentacao() == StatusMovimentacao.FALHA) {
     log.warn("Movimentação {} já em estado terminal. Ignorando mensagem duplicada.", movId);
     return;
   }
   ```

4. **Use QoS=1 (não QoS=2):** QoS=2 garante "exatamente uma vez" mas tem overhead significativo. QoS=1 com idempotência no código é a abordagem mais robusta e performática.

---

*Documento gerado em: 31/05/2026 | Stock Overflow — estoque-api | Backend Documentation*
