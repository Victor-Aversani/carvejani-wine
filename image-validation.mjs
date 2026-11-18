export function validateAvatar(base64) {
 if(typeof base64!=='string'||base64.length>350000||!base64.length||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('Imagem inválida.');
 const b=Buffer.from(base64,'base64');
 if(b.length>262144||b.length<20||b[0]!==255||b[1]!==216||b.at(-2)!==255||b.at(-1)!==217)throw Error('Envie uma imagem JPEG de até 256 KB.');
 let i=2,dimensions=false;
 while(i<b.length-2){if(b[i++]!==255)throw Error('JPEG inválido.');while(b[i]===255)i++;const marker=b[i++];if(marker===218)break;if(marker===216||marker===217||marker===1||(marker>=208&&marker<=215))continue;if(i+2>b.length)break;const size=b.readUInt16BE(i);if(size<2||i+size>b.length)throw Error('JPEG inválido.');if([192,193,194].includes(marker)){if(size<8)throw Error('JPEG inválido.');const h=b.readUInt16BE(i+3),w=b.readUInt16BE(i+5);if(!w||!h||w>1024||h>1024)throw Error('Dimensões máximas: 1024 por 1024 pixels.');dimensions=true;}i+=size;}
 if(!dimensions)throw Error('Imagem JPEG sem dimensões válidas.');return b;
}
