import {test} from 'node:test';
import assert from 'node:assert/strict';
import {notifyPitchJoin} from './pitch-notification.ts';

test('sends the jersey details to the existing provider and checks acceptance', async()=>{
 let calls=0;
 const sent=await notifyPitchJoin({name:'Visitor',number:'10'},'test-key',async(url,options)=>{
  calls++;assert.equal(url,'https://api.web3forms.com/submit');assert.equal(options.method,'POST');
  const body=JSON.parse(options.body);
  assert.equal(body.name,'Visitor');assert.equal(body.jersey_number,'10');assert.equal(body.access_key,'test-key');
  assert.match(body.subject,/New pitch visitor/);assert.equal(body.email,undefined);
  return new Response(JSON.stringify({success:true}),{status:200});
 });
 assert.equal(sent,true);assert.equal(calls,1);
});
test('provider failures do not throw into the game',async()=>{
 for(const send of [async()=>new Response('{"success":false}',{status:200}),async()=>new Response('{"success":true}',{status:429}),async()=>{throw new Error('Network unavailable');},async()=>new Response('not json')]){
  assert.equal(await notifyPitchJoin({name:'Visitor',number:'10'},'test-key',send),false);
 }
});
