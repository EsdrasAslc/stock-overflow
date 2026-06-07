# Guia de Integração — Sensor Magnético no ESP32

Este guia foi criado para auxiliar no desenvolvimento físico do robô, explicando como conectar os sensores magnéticos (Efeito Hall ou Reed Switch) e como programar a lógica de contagem e movimentação no microcontrolador ESP32 para se comunicar com o backend Java.

---

## 🔌 1. Esquema de Ligação de Hardware (Pinagem)

Os sensores magnéticos (ex: **KY-003** com sensor de Efeito Hall ou módulos **Reed Switch**) possuem 3 pinos:
1. **VCC** $\rightarrow$ Conectar ao pino `3V3` do ESP32.
2. **GND** $\rightarrow$ Conectar ao pino `GND` do ESP32.
3. **OUT/Signal (Digital)** $\rightarrow$ Conectar a um pino GPIO do ESP32 configurado com resistor Pull-Up interno (`INPUT_PULLUP`).

### Sugestão de Pinagem:
* **Sensor de Eixo Horizontal (X)** $\rightarrow$ Conectar ao pino **GPIO 18**
* **Sensor de Eixo Vertical (Y)** $\rightarrow$ Conectar ao pino **GPIO 19**
* **Atuador/Garra (Solenoide ou Servo)** $\rightarrow$ Conectar ao pino **GPIO 23**

---

## 🧠 2. Estratégia de Contagem de Ímãs (Debounce)

Os sensores mecânicos (Reed) e até sensores magnéticos rápidos podem sofrer com **ruído de vibração física** (o robô passa pelo ímã, chacoalha um pouco e o sensor dispara 2 ou 3 vezes seguidas no mesmo ímã).

Para evitar contagem dupla, implementamos um **debounce por software**. Só incrementamos o contador se tiver passado um intervalo de tempo mínimo (ex: $200\text{ ms}$) desde a última detecção.

---

## 💻 3. Exemplo Prático de Código C++

Abaixo está um template de código que você pode incorporar dentro do loop ou da função de processamento de comandos do seu arquivo [MMFirmata.ino](file:///c:/Users/thiag/Documents/GitHub/stock-overflow/ESP_32/MMFirmata.ino).

```cpp
#include <Arduino.h>
#include <ArduinoJson.h>

// Definindo os Pinos dos Sensores
#define PIN_SENSOR_X 18
#define PIN_SENSOR_Y 19

// Variáveis de Controle Físico
int targetX = 0; // Coluna alvo recebida do Java (ex: 2)
int targetY = 0; // Linha/Andar alvo recebida do Java (ex: 1)

int currentX = 0; // Contador atual de ímãs no eixo X
int currentY = 0; // Contador atual de ímãs no eixo Y

bool emMovimento = false;
bool subindo = false;
bool voltandoOrigem = false;

// Variáveis de Controle de Ruído (Debounce)
unsigned long ultimoTempoSensorX = 0;
unsigned long ultimoTempoSensorY = 0;
const unsigned long DEBOUNCE_TIME_MS = 200; // Tempo mínimo entre ímãs

// Função chamada ao receber o comando de movimento pelo WebSocket
void iniciarMovimento(int destinoX, int destinoY) {
  targetX = destinoX;
  targetY = destinoY;
  
  // Reseta os contadores para iniciar a busca a partir de X=0, Y=0
  currentX = 0;
  currentY = 0;
  
  emMovimento = true;
  voltandoOrigem = false;
  
  // Liga os motores na direção correta
  ligarMotorHorizontal(true); // Ligar motor para frente
  
  // Envia status inicial de movimento para o Java
  enviarTelemetria("movendo");
}

void setup() {
  Serial.begin(115200);
  
  // Configurando os pinos dos sensores magnéticos
  pinMode(PIN_SENSOR_X, INPUT_PULLUP);
  pinMode(PIN_SENSOR_Y, INPUT_PULLUP);
  
  // Opcional: usar interrupções para leitura instantânea dos ímãs
  attachInterrupt(digitalPinToInterrupt(PIN_SENSOR_X), sensorX_ISR, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_SENSOR_Y), sensorY_ISR, FALLING);
}

// Interrupção do Eixo X (detectou ímã de coluna)
void IRAM_ATTR sensorX_ISR() {
  unsigned long tempoAtual = millis();
  if (tempoAtual - ultimoTempoSensorX > DEBOUNCE_TIME_MS) {
    if (emMovimento && !subindo && !voltandoOrigem) {
      currentX++;
    }
    ultimoTempoSensorX = tempoAtual;
  }
}

// Interrupção do Eixo Y (detectou ímã de andar)
void IRAM_ATTR sensorY_ISR() {
  unsigned long tempoAtual = millis();
  if (tempoAtual - ultimoTempoSensorY > DEBOUNCE_TIME_MS) {
    if (emMovimento && subindo && !voltandoOrigem) {
      currentY++;
    }
    ultimoTempoSensorY = tempoAtual;
  }
}

void loop() {
  if (emMovimento) {
    
    // --- PASSO 1: Movimento Horizontal ---
    if (!subindo && !voltandoOrigem) {
      if (currentX >= targetX) {
        desligarMotorHorizontal();
        Serial.println("Chegou na coluna desejada! Iniciando subida...");
        
        // Passa para a fase de subida
        subindo = true;
        ligarMotorVertical(true); // Ligar motor para subir
      } else {
        enviarTelemetria("movendo");
      }
    }
    
    // --- PASSO 2: Movimento Vertical ---
    else if (subindo && !voltandoOrigem) {
      if (currentY >= targetY) {
        desligarMotorVertical();
        Serial.println("Chegou no andar desejado! Acionando garra...");
        
        acionarGarra(); // Deixa ou retira o produto
        
        // Inicia retorno para a base (Homing)
        subindo = false;
        voltandoOrigem = true;
        ligarMotorVertical(false);  // Descer
        ligarMotorHorizontal(false); // Voltar para trás
        
        enviarTelemetria("retornando");
      } else {
        enviarTelemetria("movendo");
      }
    }
    
    // --- PASSO 3: Retorno para a Origem (Homing/Finalizado) ---
    else if (voltandoOrigem) {
      // O robô desce e volta até bater nas chaves fim de curso físicas (origem)
      if (detectouChaveFimDeCursoX() && detectouChaveFimDeCursoY()) {
        desligarMotorVertical();
        desligarMotorHorizontal();
        
        emMovimento = false;
        voltandoOrigem = false;
        currentX = 0;
        currentY = 0;
        
        Serial.println("Movimentacao concluida com sucesso!");
        enviarTelemetria("finalizado"); // Conclui a transação no Java!
      }
    }
  }
  
  delay(10);
}

// Funções Auxiliares de Controle (Devem ser integradas com sua ponte H / Driver)
void ligarMotorHorizontal(bool frente) { /* controle de GPIO para Motor X */ }
void desligarMotorHorizontal() { /* controle de GPIO */ }
void ligarMotorVertical(bool sobe) { /* controle de GPIO para Motor Y */ }
void desligarMotorVertical() { /* controle de GPIO */ }
void acionarGarra() { /* ativa solenoide / servo */ delay(2000); }
bool detectouChaveFimDeCursoX() { return digitalRead(12) == LOW; } // Exemplo pino 12
bool detectouChaveFimDeCursoY() { return digitalRead(13) == LOW; } // Exemplo pino 13

// Envia telemetria via WebSocket em formato JSON
void enviarTelemetria(String status) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  doc["x"] = currentX;
  doc["y"] = currentY;
  
  String output;
  serializeJson(doc, output);
  // webSocket.broadcastTXT(output); // Função de envio do seu WebSocket
}
```

---

## 🚦 4. Ciclo de Vida do Comando e Transação

1. O backend Spring Boot faz a chamada `POST` e fica travado esperando a conclusão.
2. Seu ESP32 recebe o comando `move` e inicia a máquina de estados acima, transmitindo a telemetria `"movendo"` e `"retornando"`.
3. O Java ignora as mensagens de `"movendo"` e `"retornando"` temporariamente, mas se mantém ouvindo.
4. Quando seu ESP32 bater no fim de curso e enviar `{"status": "finalizado"}`, o Java completará o futuro, salvará as alterações no banco de dados e responderá `HTTP 200 (Sucesso)` ao frontend.
5. Se o robô travar, você pode enviar o comando `/pararRobo` que envia `{"action": "stop"}` via WebSocket. O ESP32 deve parar imediatamente os motores e enviar `{"status": "parado"}` para forçar o Rollback no banco de dados.
