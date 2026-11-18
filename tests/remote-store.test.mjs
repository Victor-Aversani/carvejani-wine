import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import {createApp} from '../server.mjs';
import {createSessionStore} from '../session-store.mjs';

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port)));
const stop=server=>new Promise(resolve=>server.close(resolve));

test('Sessões remotas: reinício, cookie seguro, criptografia, limites compartilhados e falha sem liberar acesso',async()=>{
 const rows=new Map(),limits=new Map(),callbacks=new Set();let down=false;
 const user={id:'00000000-0000-4000-8000-000000000002',email:'customer@example.invalid',email_confirmed_at:new Date().toISOString()};
 const fake=http.createServer(async(req,res)=>{
  let raw='';for await(const c of req)raw+=c;const body=raw?JSON.parse(raw):{};
  const u=new URL(req.url,'http://localhost'),p=u.pathname;let status=200,result={};
  if(p.startsWith('/rest/v1/carvejani_server_')||p.startsWith('/rest/v1/rpc/carvejani_server_')) {
   assert.equal(req.headers.apikey,'sb_secret_isolated_test');assert.equal(req.headers.authorization,undefined);
   if(down){status=503;result={}}
   else if(p==='/rest/v1/rpc/carvejani_server_rate'){const hits=(limits.get(body.p_id)||0)+1;limits.set(body.p_id,hits);result=hits<=body.p_max}
   else if(p==='/rest/v1/rpc/carvejani_server_consume'){result=!callbacks.has(body.p_id);callbacks.add(body.p_id)}
   else if(p==='/rest/v1/carvejani_server_sessions'){
    const id=u.searchParams.get('id')?.slice(3),uid=u.searchParams.get('user_id')?.slice(3);
    if(req.method==='GET')result=rows.has(id)?[rows.get(id)]:[];
    else if(req.method==='POST'){rows.set(body.id,body);status=204}
    else if(req.method==='PATCH'){if(rows.has(id))rows.set(id,{...rows.get(id),...body});status=204}
    else if(req.method==='DELETE'){for(const [key,row] of rows)if(key===id||row.user_id===uid)rows.delete(key);status=204}
   }
  } else {
   assert.equal(req.headers.apikey,'sb_publishable_isolated_test');
   if(p==='/auth/v1/token')result={access_token:'private-access-token',refresh_token:'private-refresh-token',expires_in:3600,user};
   else if(p==='/auth/v1/user')result=user;
   else if(p==='/rest/v1/customer_profiles')result=[{id:user.id,full_name:'Cliente'}];
  }
  res.writeHead(status,{'Content-Type':'application/json'});res.end(status===204?undefined:JSON.stringify(result));
 });
 const provider=await listen(fake),origin='https://shop.example.invalid';
 const config={NODE_ENV:'test',SESSION_STORE:'supabase',SUPABASE_SECRET_KEY:'sb_secret_isolated_test',SUPABASE_URL:provider,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_isolated_test',SESSION_ENCRYPTION_KEY:'22'.repeat(32),APP_ORIGIN:origin};
 const post=(url,p,body,cookie='')=>fetch(url+p,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Carvejani-Request':'1',Cookie:cookie},body:JSON.stringify(body)});
 let first=createApp(config),second;
 try{
  let url=await listen(first.server);
  const login=await post(url,'/api/auth/login',{email:user.email,password:'NeverSavedPassword123',remember:true});
  assert.equal(login.status,200);const set=login.headers.get('set-cookie'),cookie=set.split(';')[0];
  assert.match(set,/^__Host-carvejani=/);assert.match(set,/; Secure/);assert.match(set,/HttpOnly/);assert.match(set,/Max-Age=2592000/);
  assert.equal(rows.size,1);const row=[...rows.values()][0];
  assert.equal(row.user_id,user.id);assert.notEqual(row.id,cookie.split('=')[1]);assert.equal(row.id,crypto.createHash('sha256').update(cookie.split('=')[1]).digest('hex'));
  const saved=JSON.stringify(row);for(const secret of ['private-access-token','private-refresh-token','NeverSavedPassword123'])assert.ok(!saved.includes(secret));
  await stop(first.server);first.close();first=null;
  second=createApp(config);url=await listen(second.server);
  assert.equal((await fetch(url+'/api/auth/me',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await fetch(url+'/.env')).status,404);assert.equal((await fetch(url+'/session-store.mjs')).status,404);
  const store1=createSessionStore(config,'.'),store2=createSessionStore(config,'.');
  const fingerprint='f'.repeat(64);assert.equal(await store1.rate(fingerprint,2,900),true);assert.equal(await store2.rate(fingerprint,2,900),true);assert.equal(await store1.rate(fingerprint,2,900),false);
  const used='e'.repeat(64);assert.equal(await store1.consume(used,Date.now()+60000),true);assert.equal(await store2.consume(used,Date.now()+60000),false);
  down=true;
  const unavailable=await post(url,'/api/auth/login',{email:user.email,password:'NeverSavedPassword123'});
  assert.equal(unavailable.status,503);assert.equal(unavailable.headers.get('set-cookie'),null);
  assert.equal((await fetch(url+'/api/auth/me',{headers:{Cookie:cookie}})).status,503);
  down=false;
  assert.equal((await post(url,'/api/auth/logout',{},cookie)).status,200);
  assert.equal((await fetch(url+'/api/auth/me',{headers:{Cookie:cookie}})).status,401);
  assert.equal(rows.size,0);
  assert.throws(()=>createSessionStore({NODE_ENV:'production'},'.'),/SESSION_STORE/);
  assert.throws(()=>createSessionStore({SESSION_STORE:'supabase'},'.'),/SUPABASE_SECRET_KEY/);
 }finally{
  if(first){await stop(first.server);first.close()}
  if(second){await stop(second.server);second.close()}
  await stop(fake);
 }
});
