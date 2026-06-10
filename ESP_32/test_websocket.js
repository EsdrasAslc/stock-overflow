const WebSocket = require('ws');

// Substitua pelo IP que aparece no monitor serial do Arduino IDE
const ESP32_IP = '10.87.155.223'; // Exemplo de IP, troque pelo correto
const WS_PORT = 81;

console.log(`Conectando ao ESP32 no IP: ws://${ESP32_IP}:${WS_PORT}`);
const ws = new WebSocket(`ws://${ESP32_IP}:${WS_PORT}`);

// Evento disparado quando a conexão é aberta
ws.on('open', function open() {
  console.log('Conexão WebSocket aberta com sucesso!');

  // Testando o comando status
  console.log('Enviando comando: status');
  ws.send(JSON.stringify({ action: 'status' }));

  // Após 2 segundos, testar o comando move
  setTimeout(() => {
    console.log('\nEnviando comando: move (x: 100, y: 50)');
    ws.send(JSON.stringify({ action: 'move', x: 100, y: 50 }));
  }, 2000);

  // Após 5 segundos, testar o comando stop
  setTimeout(() => {
    console.log('\nEnviando comando: stop');
    ws.send(JSON.stringify({ action: 'stop' }));
  }, 5000);
});

// Evento disparado quando recebe uma mensagem do ESP32
ws.on('message', function incoming(data) {
  try {
    const json = JSON.parse(data.toString());
    console.log('Mensagem recebida do ESP32:', json);
  } catch (e) {
    console.log('Texto recebido do ESP32:', data.toString());
  }
});

// Evento disparado quando a conexão é fechada
ws.on('close', function close() {
  console.log('Conexão WebSocket fechada.');
});

// Evento disparado em caso de erro (ex: ESP32 desligado ou IP errado)
ws.on('error', function error(err) {
  console.error('Erro no WebSocket:', err.message);
  console.log('Verifique se o IP do ESP32 está correto e se ele está conectado na mesma rede Wi-Fi.');
});
