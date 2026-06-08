#include <WiFi.h>
#include <WebSocketsServer.h> // Requer a biblioteca WebSockets de Markus Sattler (Links2004)
#include <ArduinoJson.h>      // Requer a biblioteca ArduinoJson de Benoit Blanchon

const char* ssid     = "Esdras";
const char* password = "docinho2020";

// Instancia o servidor WebSocket na porta 81 (Padrão para WebSockets)
WebSocketsServer webSocket = WebSocketsServer(81);

// Variáveis de controle de movimento
int targetX = 0, targetY = 0;
int currentX = 0, currentY = 0;
bool emMovimento = false;
unsigned long lastMoveTime = 0;

// ================================================================
// FUNÇÃO PARA PROCESSAR COMANDOS RECEBIDOS VIA WEBSOCKET
// ================================================================
// Aqui é onde você vai implementar novas funcionalidades.
// A comunicação é feita usando JSON, por exemplo: {"action": "move", "x": 100, "y": 50}
void processCommand(uint8_t num, JsonDocument& doc) {
  // Extrai a ação solicitada
  const char* action = doc["action"];

  if (action == nullptr) {
    Serial.println("Comando inválido: sem campo 'action'");
    webSocket.sendTXT(num, "{\"status\":\"erro\",\"mensagem\":\"Campo 'action' ausente\"}");
    return;
  }

  // --- IMPLEMENTE NOVAS FUNÇÕES AQUI ABAIXO ---

  // 1. Comando de movimento (Ex: {"action": "move", "x": 150, "y": 200})
  if (strcmp(action, "move") == 0) {
    targetX = doc["x"] | 0; // Pega o valor de x, se não existir assume 0
    targetY = doc["y"] | 0; // Pega o valor de y, se não existir assume 0
    emMovimento = true;
    
    Serial.printf("Comando 'move' -> Alvo X: %d, Y: %d\n", targetX, targetY);
    webSocket.sendTXT(num, "{\"status\":\"aceito\",\"mensagem\":\"Iniciando movimento\"}");
  } 
  
  // 2. Comando para parar o movimento imediatamente (Ex: {"action": "stop"})
  else if (strcmp(action, "stop") == 0) {
    emMovimento = false;
    targetX = currentX; // Redefine o alvo para a posição atual
    targetY = currentY;
    
    Serial.println("Comando 'stop' -> Parada de emergência!");
    webSocket.sendTXT(num, "{\"status\":\"parado\",\"mensagem\":\"Movimento interrompido\"}");
  }

  // 3. Comando para consultar a posição atual (Ex: {"action": "status"})
  else if (strcmp(action, "status") == 0) {
    char buffer[100];
    snprintf(buffer, sizeof(buffer), "{\"status\":\"info\",\"x\":%d,\"y\":%d,\"movendo\":%s}", 
             currentX, currentY, emMovimento ? "true" : "false");
    webSocket.sendTXT(num, buffer);
  }

  // Adicione novos "else if (strcmp(action, "nova_acao") == 0) { ... }" aqui!
  
  // Ação não reconhecida
  else {
    Serial.printf("Comando desconhecido: %s\n", action);
    webSocket.sendTXT(num, "{\"status\":\"erro\",\"mensagem\":\"Acao desconhecida\"}");
  }
}

// ================================================================
// EVENTOS DO WEBSOCKET
// ================================================================
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Cliente desconectado!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Cliente conectado via WebSocket! IP: %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      
      // Envia uma mensagem de boas-vindas ao conectar
      webSocket.sendTXT(num, "{\"status\":\"conectado\",\"mensagem\":\"Bem-vindo ao servidor ESP32\"}");
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("[%u] Mensagem recebida: %s\n", num, payload);
      
      // Tenta analisar o texto recebido como JSON
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("Falha ao analisar JSON: ");
        Serial.println(error.c_str());
        webSocket.sendTXT(num, "{\"status\":\"erro\",\"mensagem\":\"JSON invalido\"}");
        return;
      }

      // Distribui a execução de acordo com o comando no JSON
      processCommand(num, doc);
      break;
    }
    
    case WStype_BIN:
      // Tratamento de dados binários se necessário
      Serial.printf("[%u] Binário recebido: %u bytes\n", num, length);
      break;
  }
}

// ================================================================
// CONFIGURAÇÃO INICIAL (SETUP)
// ================================================================
void setup() {
  Serial.begin(115200);

  // Inicia conexão Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.print("\nConectado! IP do ESP32: ");
  Serial.println(WiFi.localIP());
  
  // Inicia o servidor WebSocket na porta 81
  webSocket.begin();
  // Registra a função de eventos
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("Servidor WebSocket iniciado na porta 81.");
}

// ================================================================
// LOOP PRINCIPAL (LOOP)
// ================================================================
void loop() {
  // Mantém o servidor WebSocket rodando. Deve ser chamado constantemente.
  webSocket.loop();

  // --- LÓGICA DE MOVIMENTO (Executada continuamente em background) ---
  if (emMovimento) {
    // IMPORTANTE: Não use delay() bloqueante para não derrubar o WebSocket.
    // Usamos millis() para definir a cadência do motor (ex: a cada 30ms).
    if (millis() - lastMoveTime > 30) {
      lastMoveTime = millis();
      
      // Atualiza coordenadas em direção ao alvo
      if (currentX < targetX) currentX++;
      else if (currentX > targetX) currentX--;

      if (currentY < targetY) currentY++;
      else if (currentY > targetY) currentY--;

      // Envia a posição atual para TODOS os clientes conectados (broadcast)
      char buffer[100];
      snprintf(buffer, sizeof(buffer), "{\"status\":\"movendo\",\"x\":%d,\"y\":%d}", currentX, currentY);
      webSocket.broadcastTXT(buffer);

      // Verifica se chegou ao destino
      if (currentX == targetX && currentY == targetY) {
        if (targetX != 0 || targetY != 0) {
          // Chegou no ponto desejado, agora a lógica original manda voltar pro 0,0
          targetX = 0;
          targetY = 0;
          webSocket.broadcastTXT("{\"status\":\"retornando\",\"x\":0,\"y\":0}");
        } else {
          // Chegou de volta ao ponto de origem (0,0)
          emMovimento = false;
          webSocket.broadcastTXT("{\"status\":\"finalizado\",\"x\":0,\"y\":0}");
        }
      }
    }
  }
}