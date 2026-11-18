import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const env=new URL('.env',import.meta.url);
if(!fs.existsSync(env)){let text=fs.readFileSync(new URL('.env.example',import.meta.url),'utf8');text=text.replace(/^SESSION_ENCRYPTION_KEY=$/m,'SESSION_ENCRYPTION_KEY='+crypto.randomBytes(32).toString('hex'));fs.writeFileSync(env,text,{mode:0o600});console.log('Configuração local criada em '+fileURLToPath(env));}else console.log('Configuração existente preservada.');
