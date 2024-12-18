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
    const header = Buffer.alloc(4);
    header.writeUInt32BE(messageBuffer.length, 0);
    const finalBuffer = Buffer.concat([header, messageBuffer]);
    client.write(finalBuffer);
}




/*
Protobuf
1. Conoce las reglas de codificación Protobuf
    Protobuf codifica cada campo como <key><value>:

    key: Combina el field_number y el wire_type.
    wire_type indica el tipo de datos:
    0 = varint (enteros)
    2 = length-delimited (strings, bytes)
    Para obtener el key: (field_number << 3) | wire_type.
    value: Dependiendo del tipo de datos:
    varint: se codifica en base 128, con continuación de bits.
    length-delimited: primero un varint con la longitud, luego los bytes de la cadena o datos binarios.
    Ejemplo:
        Para source_id (field 2, string), wire_type = 2:

        field_number = 2
        (2 << 3) = 16 (0x10)
        0x10 | 0x02 = 0x12
        El primer byte para source_id será 0x12. Luego escribes la longitud de la cadena en varint y luego los bytes ASCII/UTF-8 de la cadena.

2. Determina el orden de los campos
    Aunque Protobuf permite el uso de campos en cualquier orden, es buena práctica seguir el orden por field_number. 
    Además, asegúrate de incluir solo los campos necesarios. En el caso de Chromecast:

    protocol_version (field 1) va primero
    source_id (field 2)
    destination_id (field 3)
    namespace (field 4)
    payload_type (field 5)
    payload_utf8 (field 6)
3. Codifica cada campo manualmente
    Para un varint (ej. protocol_version=0, payload_type=0):
    El valor 0 en varint es simplemente 0x00.
    Para un string (ej. source_id="sender-0"):
    Convierte "sender-0" a bytes ASCII: [0x73,0x65,0x6e,0x64,0x65,0x72,0x2d,0x30]
    Longitud = 8 → varint 8 = 0x08
    Campo: [0x12 (key), 0x08 (length), 0x73,0x65,0x6e,0x64,0x65,0x72,0x2d,0x30]
4. Junta todos los campos
    Concatenas todos los campos codificados uno tras otro para formar el mensaje. Asegúrate de que todos los lengths y varints estén correctos.

5. Añade la longitud del mensaje al principio
    El Chromecast (y el protocolo Cast) espera que precedas el mensaje Protobuf con 4 bytes (UInt32 Big-Endian) que indiquen la longitud total del mensaje. 
    Esto no es parte de Protobuf en sí, sino parte del framing específico del protocolo Cast.
*/
