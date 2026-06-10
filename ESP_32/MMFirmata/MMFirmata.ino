#include <WiFi.h>
#include <WebSocketsServer.h> // Requer a biblioteca WebSockets de Markus Sattler (Links2004)
#include <ArduinoJson.h>      // Requer a biblioteca ArduinoJson de Benoit Blanchon

const char* ssid     = "Esdras";
const char* password = "123456789";

// Instancia o servidor WebSocket na porta 81 (Padrão para WebSockets)
WebSocketsServer webSocket = WebSocketsServer(81);

// Pino do Sensor KY-025
const int SENSOR_PIN = 4;
bool lastSensorState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// Variáveis de controle de movimento
int targetX = 0, targetY = 0;
int currentX = 0, currentY = 0;
bool emMovimento = false;

// ================================================================
// FUNÇÃO PARA PROCESSAR COMANDOS RECEBIDOS VIA WEBSOCKET
// ================================================================
void processCommand(uint8_t num, JsonDocument& doc) {
  const char* action = doc["action"];

  if (action == nullptr) {
    Serial.println("Comando inválido: sem campo 'action'");
    webSocket.sendTXT(num, "{\"status\":\"erro\",\"mensagem\":\"Campo 'action' ausente\"}");
    return;
  }

  if (strcmp(action, "move") == 0) {
    targetX = doc["x"] | 0;
    targetY = doc["y"] | 0;
    emMovimento = true;
    
    Serial.printf("Comando 'move' -> Alvo X: %d, Y: %d\n", targetX, targetY);
    webSocket.sendTXT(num, "{\"status\":\"aceito\",\"mensagem\":\"Iniciando movimento\"}");
  } 
  
  else if (strcmp(action, "stop") == 0) {
    emMovimento = false;
    targetX = currentX;
    targetY = currentY;
    
    Serial.println("Comando 'stop' -> Parada de emergência!");
    webSocket.sendTXT(num, "{\"status\":\"parado\",\"mensagem\":\"Movimento interrompido\"}");
  }

  else if (strcmp(action, "status") == 0) {
    char buffer[100];
    snprintf(buffer, sizeof(buffer), "{\"status\":\"info\",\"x\":%d,\"y\":%d,\"movendo\":%s}", 
             currentX, currentY, emMovimento ? "true" : "false");
    webSocket.sendTXT(num, buffer);
  }
  
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
      webSocket.sendTXT(num, "{\"status\":\"conectado\",\"mensagem\":\"Bem-vindo ao servidor ESP32\"}");
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("[%u] Mensagem recebida: %s\n", num, payload);
      
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("Falha ao analisar JSON: ");
        Serial.println(error.c_str());
        webSocket.sendTXT(num, "{\"status\":\"erro\",\"mensagem\":\"JSON invalido\"}");
        return;
      }

      processCommand(num, doc);
      break;
    }
    
    case WStype_BIN:
      Serial.printf("[%u] Binário recebido: %u bytes\n", num, length);
      break;
  }
}

// ================================================================
// CONFIGURAÇÃO INICIAL (SETUP)
// ================================================================
void setup() {
  Serial.begin(115200);

  // Inicializa o pino do sensor KY-025
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  lastSensorState = digitalRead(SENSOR_PIN);

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
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("Servidor WebSocket iniciado na porta 81.");
  Serial.println("Aguardando comandos para leitura de sensor magnético em X e Y...");
}

// ================================================================
// LOOP PRINCIPAL (LOOP)
// ================================================================
void loop() {
  webSocket.loop();

  if (emMovimento) {
    bool currentSensorState = digitalRead(SENSOR_PIN);
    
    // Simples debounce para o sensor hall magnético
    if (currentSensorState != lastSensorState) {
      if (millis() - lastDebounceTime > debounceDelay) {
        lastDebounceTime = millis();
        
        // Verifica transição (assumindo sensor ativo em LOW quando passa o ímã)
        if (currentSensorState == LOW) {
          Serial.println("[SENSOR] Ímã detectado!");
          
          // Move primeiro em X
          if (currentX != targetX) {
            if (currentX < targetX) currentX++;
            else currentX--;
            Serial.printf("[MOVIMENTO] Avançou em X -> X: %d, Y: %d\n", currentX, currentY);
          }
          // Depois que X chegou no alvo, move em Y
          else if (currentY != targetY) {
            if (currentY < targetY) currentY++;
            else currentY--;
            Serial.printf("[MOVIMENTO] Avançou em Y -> X: %d, Y: %d\n", currentX, currentY);
          }

          // Envia a posição atual para TODOS os clientes conectados (broadcast)
          char buffer[100];
          snprintf(buffer, sizeof(buffer), "{\"status\":\"movendo\",\"x\":%d,\"y\":%d}", currentX, currentY);
          webSocket.broadcastTXT(buffer);

          // Verifica se chegou ao destino
          if (currentX == targetX && currentY == targetY) {
            if (targetX != 0 || targetY != 0) {
              // Chegou no ponto desejado, agora manda voltar pro 0,0
              Serial.println("[MOVIMENTO] Alvo atingido! Iniciando retorno para base (0,0)...");
              targetX = 0;
              targetY = 0;
              webSocket.broadcastTXT("{\"status\":\"retornando\",\"x\":0,\"y\":0}");
            } else {
              // Chegou de volta ao ponto de origem (0,0)
              Serial.println("[MOVIMENTO] Base (0,0) atingida. Finalizando.");
              emMovimento = false;
              webSocket.broadcastTXT("{\"status\":\"finalizado\",\"x\":0,\"y\":0}");
            }
          }
        }
      }
    }
    lastSensorState = currentSensorState;
  } else {
    // Log periódico de aguardo (a cada 5 segundos)
    static unsigned long lastWaitLogTime = 0;
    if (millis() - lastWaitLogTime > 5000) {
      lastWaitLogTime = millis();
      Serial.printf("[STATUS] Aguardando comando... Posição atual -> X: %d, Y: %d\n", currentX, currentY);
    }
  }
}