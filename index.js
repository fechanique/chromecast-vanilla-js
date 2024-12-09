const tls = require('tls');

const chromecastIp = '192.168.1.139';
const port = 8009;
const appId = 'AF34CB76';

// Mensaje CONNECT
const connectMessage = Buffer.from([
    // protocol_version = 0
    0x08, 0x00,
    // source_id = "sender-0"
    0x12, 0x08, 0x73, 0x65, 0x6e, 0x64, 0x65, 0x72, 0x2d, 0x30,
    // destination_id = "receiver-0"
    0x1a, 0x0a, 0x72, 0x65, 0x63, 0x65, 0x69, 0x76, 0x65, 0x72, 0x2d, 0x30,
    // namespace = "urn:x-cast:com.google.cast.tp.connection" (40 bytes)
    0x22, 0x28,
      0x75, 0x72, 0x6e, 0x3a, 0x78, 0x2d, 0x63, 0x61, 0x73, 0x74, 0x3a,
      0x63, 0x6f, 0x6d, 0x2e, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e,
      0x63, 0x61, 0x73, 0x74, 0x2e, 0x74, 0x70, 0x2e, 0x63, 0x6f,
      0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e,
    // payload_type = 0 (STRING)
    0x28, 0x00,
    // payload_utf8 = {"type":"CONNECT"} (18 bytes)
    0x32, 0x12,
      0x7b, 0x22, 0x74, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22,
      0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54, 0x22, 0x7d
  ]);

// Mensaje LAUNCH para la app AF34CB76
// namespace: "urn:x-cast:com.google.cast.receiver"
// payload_utf8 = {"type":"LAUNCH","appId":"AF34CB76","requestId":1}
const launchMessage = Buffer.from([
    0x08,0x00,                                  // protocol_version=0
    0x12,0x08,0x73,0x65,0x6e,0x64,0x65,0x72,0x2d,0x30, // source_id="sender-0"
    0x1a,0x0a,0x72,0x65,0x63,0x65,0x69,0x76,0x65,0x72,0x2d,0x30, // "receiver-0"
    0x22,0x23,                                 // namespace length=35
    0x75,0x72,0x6e,0x3a,0x78,0x2d,0x63,0x61,0x73,0x74,0x3a,
    0x63,0x6f,0x6d,0x2e,0x67,0x6f,0x6f,0x67,0x6c,0x65,0x2e,
    0x63,0x61,0x73,0x74,0x2e,0x72,0x65,0x63,0x65,0x69,
    0x76,0x65,0x72,                           // namespace data
    0x28,0x00,                                 // payload_type=0
    0x32,0x32,                                 // payload_utf8 length=50
    0x7b,0x22,0x74,0x79,0x70,0x65,0x22,0x3a,0x22,0x4c,0x41,0x55,
    0x4e,0x43,0x48,0x22,0x2c,0x22,0x61,0x70,0x70,0x49,0x64,0x22,
    0x3a,0x22,...Buffer.from(appId, 'utf8'),0x22,0x2c,
    0x22,0x72,0x65,0x71,0x75,0x65,0x73,0x74,0x49,0x64,0x22,0x3a,
    0x31,0x7d
]);

const getStatusMessage = Buffer.from([
    0x08,0x00,
    0x12,0x08,0x73,0x65,0x6e,0x64,0x65,0x72,0x2d,0x30,
    0x1a,0x0a,0x72,0x65,0x63,0x65,0x69,0x76,0x65,0x72,0x2d,0x30,
    0x22,0x23,
    0x75,0x72,0x6e,0x3a,0x78,0x2d,0x63,0x61,0x73,0x74,0x3a,
    0x63,0x6f,0x6d,0x2e,0x67,0x6f,0x6f,0x67,0x6c,0x65,0x2e,
    0x63,0x61,0x73,0x74,0x2e,0x72,0x65,0x63,0x65,0x69,0x76,
    0x65,0x72,
    0x28,0x00,
    0x32,0x23,
    0x7b,0x22,0x74,0x79,0x70,0x65,0x22,0x3a,0x22,0x47,0x45,
    0x54,0x5f,0x53,0x54,0x41,0x54,0x55,0x53,0x22,0x2c,0x22,
    0x72,0x65,0x71,0x75,0x65,0x73,0x74,0x49,0x64,0x22,0x3a,
    0x31,0x7d
  ]);

  const heartbeatMessage = Buffer.from([
    0x08,0x00,                                      
    0x12,0x08,0x73,0x65,0x6e,0x64,0x65,0x72,0x2d,0x30,
    0x1a,0x0a,0x72,0x65,0x63,0x65,0x69,0x76,0x65,0x72,0x2d,0x30,
    0x22,0x27,
    0x75,0x72,0x6e,0x3a,0x78,0x2d,0x63,0x61,0x73,0x74,0x3a,
    0x63,0x6f,0x6d,0x2e,0x67,0x6f,0x6f,0x67,0x6c,0x65,0x2e,
    0x63,0x61,0x73,0x74,0x2e,0x74,0x70,0x2e,
    0x68,0x65,0x61,0x72,0x74,0x62,0x65,0x61,0x74,
    0x28,0x00,
    0x32,0x0f,
    0x7b,0x22,0x74,0x79,0x70,0x65,0x22,0x3a,0x22,0x50,0x49,0x4e,0x47,0x22,0x7d
  ]);

// Función para enviar mensajes con el header de longitud
function sendProtobufMessage(client, messageBuffer) {
  const length = messageBuffer.length;
  const header = Buffer.alloc(4);
  header.writeUInt32BE(length, 0);
  const finalBuffer = Buffer.concat([header, messageBuffer]);
  client.write(finalBuffer);
}

const client = tls.connect({ host: chromecastIp, port, rejectUnauthorized:false }, () => {
    console.log('Conectado al Chromecast');
    // Enviar CONNECT primero
    sendProtobufMessage(client, connectMessage);
    sendProtobufMessage(client, getStatusMessage);
    sendProtobufMessage(client, launchMessage);
    setInterval(function() {
        sendProtobufMessage(client, heartbeatMessage);
      }, 5000);
  });
  
  client.on('data', (chunk) => {
    console.log(chunk.toString())
  });
  
  client.on('error', (err) => {
    console.error('Error:', err.message);
  });
  
  client.on('close', () => {
    console.log('Conexión cerrada');
  });