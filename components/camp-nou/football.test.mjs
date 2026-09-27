import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createBall, takeBall, shootBall, stepBall, advanceAdi } from './football.ts';

test('possession requires proximity and a shot cannot be immediately collected', () => {
  const ball=createBall(); takeBall(ball,20,20); assert.equal(ball.owner,'adi');
  takeBall(ball,0,5); assert.equal(ball.owner,'visitor');
  shootBall(ball,Math.PI); assert.equal(ball.owner,'free'); assert(ball.vz<0);
  takeBall(ball,ball.x,ball.z); assert.equal(ball.owner,'free');
});
for(const side of [-1,1])test(`goal at end ${side} counts once and restarts with score intact`,()=>{
  const ball=createBall();ball.owner='visitor';ball.z=side*48;
  shootBall(ball,side<0?Math.PI:0);
  let scored=false;for(let i=0;i<20;i++)if(stepBall(ball,.05)==='goal')scored=true;
  assert(scored);assert.equal(ball.goals,1);assert(ball.resetIn>0);
  for(let i=0;i<60;i++)stepBall(ball,.05);
  assert.equal(ball.owner,'adi');assert.equal(ball.goals,1);assert.equal(ball.resetIn,0);
});
test('missed shots and sideline bounces stay in reach',()=>{
  const ball=createBall();Object.assign(ball,{owner:'free',x:8,z:52,vz:34});
  stepBall(ball,.1);assert.equal(ball.goals,0);assert(ball.vz<0);assert(ball.z<=54);
  Object.assign(ball,{x:35,z:0,vx:34,vz:0});stepBall(ball,.1);assert(ball.vx<0);assert(ball.x<=35.5);
});
test('fast shots use goal-line crossings and cannot score twice',()=>{
  const ball=createBall();Object.assign(ball,{owner:'free',lastTouch:'visitor',x:0,z:52,vz:340});
  assert.equal(stepBall(ball,.05),'goal');assert.equal(ball.goals,1);
  stepBall(ball,.05);assert.equal(ball.goals,1);
});
test('loose balls can be collected after the shot cooldown',()=>{
  const ball=createBall();Object.assign(ball,{owner:'free',x:0,z:0,pickupDelay:.1});
  stepBall(ball,.2);takeBall(ball,1,0);assert.equal(ball.owner,'visitor');
});

test('Adi chases, wins possession and scores without adding to visitor score',()=>{
 const ball=createBall();Object.assign(ball,{owner:'visitor',x:6,z:5});
 const ai={x:0,z:5,facing:0};
 for(let i=0;i<800&&ball.adiGoals===0;i++){stepBall(ball,.05);advanceAdi(ball,ai,.05);}
 assert.equal(ball.adiGoals,1);assert.equal(ball.goals,0);
});
