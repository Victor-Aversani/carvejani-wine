import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

const unavailable=()=>Object.assign(new Error('Não foi possível acessar sua sessão. Tente novamente.'),{status:503});

export function createSessionStore(env,root) {
 const mode=env.SESSION_STORE||'sqlite';
 if(env.NODE_ENV==='production'&&!env.SESSION_STORE)throw Error('Defina SESSION_STORE explicitamente antes de publicar.');
 if(mode==='supabase') {
  if(!env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'))throw Error('Configure SUPABASE_SECRET_KEY somente no ambiente privado do servidor.');
  const base=new URL('/rest/v1/',env.SUPABASE_URL).href;
  if(new URL(base).protocol!=='https:'&&env.NODE_ENV!=='test')throw Error('O armazenamento de sessões requer HTTPS.');
  async function request(endpoint,method='GET',body,prefer) {
   try {
    const r=await fetch(base+endpoint,{method,headers:{apikey:env.SUPABASE_SECRET_KEY,...(body?{'Content-Type':'application/json'}:{}),...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw unavailable();
    return r.status===204?null:await r.json();
   } catch {throw unavailable()}
  }
  const filter=id=>'?id=eq.'+encodeURIComponent(id);
  return {
   read:async id=>(await request('carvejani_server_sessions'+filter(id)+'&select=id,user_id,payload,deadline&limit=1'))[0]||null,
   create:row=>request('carvejani_server_sessions','POST',row,'return=minimal'),
   update:(id,payload)=>request('carvejani_server_sessions'+filter(id),'PATCH',{payload},'return=minimal'),
   remove:id=>request('carvejani_server_sessions'+filter(id),'DELETE',null,'return=minimal'),
   removeUser:userId=>request('carvejani_server_sessions?user_id=eq.'+encodeURIComponent(userId),'DELETE',null,'return=minimal'),
   rate:(id,max,seconds)=>request('rpc/carvejani_server_rate','POST',{p_id:id,p_max:max,p_seconds:seconds}),
   consume:(id,deadline)=>request('rpc/carvejani_server_consume','POST',{p_id:id,p_deadline:deadline}),
   close:()=>{}
  };
 }
 if(mode!=='sqlite')throw Error('SESSION_STORE deve ser sqlite ou supabase.');
 const dir=env.DATA_DIRECTORY||path.join(root,'data');fs.mkdirSync(dir,{recursive:true});
 const db=new DatabaseSync(env.DB_PATH||path.join(dir,'sessions.sqlite'));
 db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, user_id TEXT, payload TEXT, deadline INTEGER); CREATE TABLE IF NOT EXISTS limits(id TEXT PRIMARY KEY, hits INTEGER, deadline INTEGER); CREATE TABLE IF NOT EXISTS used_callbacks(id TEXT PRIMARY KEY, deadline INTEGER);');
 let cleaned=0;
 function cleanup(now){if(now-cleaned<60000)return;for(const table of ['sessions','limits','used_callbacks'])db.prepare('DELETE FROM '+table+' WHERE deadline<?').run(now);cleaned=now;}
 return {
  read:async id=>db.prepare('SELECT * FROM sessions WHERE id=?').get(id)||null,
  create:async row=>{db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(row.id,row.user_id,row.payload,row.deadline)},
  update:async(id,payload)=>{db.prepare('UPDATE sessions SET payload=? WHERE id=?').run(payload,id)},
  remove:async id=>{db.prepare('DELETE FROM sessions WHERE id=?').run(id)},
  removeUser:async userId=>{db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId)},
  rate:async(id,max,seconds)=>{const now=Date.now();cleanup(now);const r=db.prepare('SELECT * FROM limits WHERE id=?').get(id);if(r&&r.deadline>now&&r.hits>=max)return false;db.prepare('INSERT OR REPLACE INTO limits VALUES(?,?,?)').run(id,r&&r.deadline>now?r.hits+1:1,r&&r.deadline>now?r.deadline:now+seconds*1000);return true},
  consume:async(id,deadline)=>{cleanup(Date.now());return db.prepare('INSERT OR IGNORE INTO used_callbacks VALUES(?,?)').run(id,deadline).changes===1},
  close:()=>db.close()
 };
}
