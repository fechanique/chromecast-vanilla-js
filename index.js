const tls = require('tls');

const chromecastIp = '192.168.1.139';
const port = 8009;
const appId = 'AF34CB76';

const client = tls.connect({ host: chromecastIp, port, rejectUnauthorized:false }, () => {
    console.log('Conectado al Chromecast');
    sendProtobufMessage(client, composeProtoBuf('urn:x-cast:com.google.cast.tp.connection', '{"type":"CONNECT"}'));
    sendProtobufMessage(client, composeProtoBuf('urn:x-cast:com.google.cast.receiver', '{"type":"GET_STATUS","requestId":1}'));
    sendProtobufMessage(client, composeProtoBuf('urn:x-cast:com.google.cast.receiver', '{"type":"LAUNCH","appId":"'+appId+'","requestId":1}'));
    setInterval(function() {
        sendProtobufMessage(client, composeProtoBuf('urn:x-cast:com.google.cast.tp.heartbeat', '{"type":"PING"}'));
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

function composeProtoBuf(namespace, payload){
    const sourceidBuf = Buffer.from('sender-0');
    const destinationidBuf = Buffer.from('receiver-0');
    const namespaceBuf = Buffer.from(namespace);
    const payloadBuf = Buffer.from(payload);
    return Buffer.from([
        0x08, 0x00,                                         // protocol_version = 0
        0x12, sourceidBuf.length, ...sourceidBuf,           // source_id = "sender-0"
        0x1a, destinationidBuf.length, ...destinationidBuf, // destination_id = "receiver-0"
        0x22, namespaceBuf.length, ...namespaceBuf,         // namespace = "urn:x-cast:com.google.cast.tp.connection" (40 bytes)
        0x28, 0x00,                                         // payload_type = 0 (STRING)
        0x32, payloadBuf.length, ...payloadBuf              // payload_utf8 = {"type":"CONNECT"} (18 bytes)
    ]);
}

function sendProtobufMessage(client, messageBuffer) {
    const length = messageBuffer.length;
    const header = Buffer.alloc(4);
    header.writeUInt32BE(length, 0);
    const finalBuffer = Buffer.concat([header, messageBuffer]);
    client.write(finalBuffer);
}
