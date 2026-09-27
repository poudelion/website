export type BallState = {
  x: number; z: number; vx: number; vz: number;
  owner: "adi" | "visitor" | "free";
  pickupDelay: number; resetIn: number; goals: number; adiGoals: number; lastTouch: "adi" | "visitor";
};
export const createBall = (): BallState => ({ x: 0, z: 5, vx: 0, vz: 0, owner: "adi", pickupDelay: 0, resetIn: 0, goals: 0, adiGoals: 0, lastTouch: "adi" });
export const WINNING_SCORE = 5;
export function matchWinner(ball: BallState): "visitor" | "adi" | null {
  return ball.goals >= WINNING_SCORE ? "visitor" : ball.adiGoals >= WINNING_SCORE ? "adi" : null;
}
export function shootBall(ball: BallState, facing: number, player: "adi" | "visitor" = "visitor") {
  if (matchWinner(ball) || ball.owner !== player || ball.resetIn > 0) return;
  ball.lastTouch = player;
  ball.owner = "free";
  ball.vx = Math.sin(facing) * 34;
  ball.vz = Math.cos(facing) * 34;
  ball.pickupDelay = .55;
}
export function takeBall(ball: BallState, x: number, z: number, player: "adi" | "visitor" = "visitor") {
  if (!matchWinner(ball) && ball.owner !== player && ball.resetIn <= 0 && ball.pickupDelay <= 0 && Math.hypot(x-ball.x,z-ball.z) < (player === "visitor" ? 3.5 : 1.25)) {
    ball.owner = player; ball.lastTouch = player; ball.pickupDelay = player === "visitor" ? 2.5 : .65; ball.vx = 0; ball.vz = 0;
  }
}
export function stepBall(ball: BallState, dt: number): "goal" | "reset" | null {
  if (matchWinner(ball)) return null;
  ball.pickupDelay = Math.max(0, ball.pickupDelay-dt);
  if (ball.resetIn > 0) {
    ball.resetIn = Math.max(0,ball.resetIn-dt);
    if (ball.resetIn === 0) { const {goals,adiGoals}=ball; Object.assign(ball,createBall(),{goals,adiGoals}); return "reset"; }
    return null;
  }
  if (ball.owner !== "free") return null;
  const oldX=ball.x, oldZ=ball.z;
  ball.x += ball.vx*dt; ball.z += ball.vz*dt;
  // Check the swept crossing, so a fast shot cannot skip the goal mouth.
  for (const side of [-1,1]) {
    const goalLine=side*53;
    if (oldZ*side < 53 && ball.z*side >= 53) {
      const fraction=(goalLine-oldZ)/(ball.z-oldZ);
      const crossingX=oldX+(ball.x-oldX)*fraction;
      if (Math.abs(crossingX) <= 3.35) {
        ball.x=crossingX; ball.z=side*54; ball.vx=0; ball.vz=0;
        if(ball.lastTouch === "adi") ball.adiGoals++; else ball.goals++; ball.resetIn=2; return "goal";
      }
    }
  }
  // Keep missed shots on the walkable pitch, ready to collect again.
  if (Math.abs(ball.x)>35.5) {ball.x=Math.sign(ball.x)*35.5;ball.vx*=-.65;}
  if (Math.abs(ball.z)>54) {ball.z=Math.sign(ball.z)*54;ball.vz*=-.65;}
  const drag=Math.exp(-.32*dt);ball.vx*=drag;ball.vz*=drag;
  if (Math.hypot(ball.vx,ball.vz)<.3) {ball.vx=0;ball.vz=0;}
  return null;
}

export function advanceAdi(ball: BallState, player: {x:number;z:number;facing:number}, dt:number) {
  if(matchWinner(ball)||ball.resetIn>0)return;
  const attacking=ball.owner==="adi";
  const targetX=attacking?0:ball.x, targetZ=attacking?-48:ball.z;
  const dx=targetX-player.x,dz=targetZ-player.z,distance=Math.hypot(dx,dz);
  if(distance>.05){const step=Math.min(distance,(attacking?4.5:6)*dt);player.x+=dx/distance*step;player.z+=dz/distance*step;player.facing=Math.atan2(dx,dz);}
  takeBall(ball,player.x,player.z,"adi");
  if(ball.owner==="adi"){
    ball.x=player.x+Math.sin(player.facing)*1.1;ball.z=player.z+Math.cos(player.facing)*1.1;
    if(player.z < -34 && Math.abs(player.x)<12 && ball.pickupDelay===0)shootBall(ball,Math.atan2(-ball.x,-53-ball.z),"adi");
  }
}

export function tackleBall(ball: BallState, x:number, z:number) {
  if(Math.hypot(x-ball.x,z-ball.z)<=4.5)takeBall(ball,ball.x,ball.z);
}
