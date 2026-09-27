"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Mail, Maximize2, X, PersonStanding, CircleHelp } from "lucide-react";
import * as THREE from "three";
import styles from "./camp.module.css";
import TouchControls from "./TouchControls";
import { notifyPitchJoin } from "./pitch-notification";
import contactConfig from "./contact-config.json";
import { createBall, shootBall, takeBall, stepBall, advanceAdi, matchWinner, tackleBall } from "./football";

const stops = [
  { name: "About me", label: "THE PLAYER", number: "01", x: -25, z: 15, color: "#f5d86e", title: "From the hills of Nepal to a world of ideas.", text: "I’m Aditya Raj Poudel, a computer science student at Morgan State University, based in Baltimore. Born in Ramechhap, Nepal, I moved to the USA in 2023. I build practical tools at the intersection of AI, machine learning, and mathematics.", note: "A.S. Computer Science · CCBC · 4.0 GPA · 2025 | B.S. Computer Science · Morgan State · Expected 2027" },
  { name: "Projects", label: "THE HIGHLIGHTS", number: "02", x: 25, z: -18, color: "#f192ab", title: "Every project starts with a little ambition.", text: "From evacuation simulations to financial dashboards, I build tools that solve real problems. Explore the projects in my starting lineup.", note: "Seven ideas brought to life. Always building the next one." },
  { name: "Skills", label: "THE PLAYBOOK", number: "03", x: -24, z: -27, color: "#a3c7ff", title: "The tools behind the ideas.", text: "Python, Java, C, Bash, R, and Rust. For data and machine learning: scikit-learn, NumPy, and Pandas. My toolkit includes Git, SQLite, Shiny, and REST APIs.", note: "Data structures & algorithms · Object-oriented programming · Web scraping · Networking" },
  { name: "Contact", label: "THE NEXT MATCH", number: "04", x: 25, z: 28, color: "#baddae", title: "Let’s make something worth cheering for.", text: "Have an idea, an opportunity, or just want to talk football? This is where we connect.", note: "Baltimore, Maryland · Open to a project, a question, or just a hello." },
];

type Kit = { name: string; number: string };
type Controller = { move: (x:number,z:number) => void; tackle: () => void; restart: () => void; shoot: () => void; dress: (kit: Kit) => void; teleport: (i: number) => void; key: (key: string, pressed: boolean) => void };

export default function CampNou() {
  const mount = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const walking = useRef(false);
  const selectedRef = useRef<number | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [joining, setJoining] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [entryError, setEntryError] = useState("");
  const pendingStop = useRef<number | null>(null);
  const joined = useRef(false);
  const [fieldPassVisible, setFieldPassVisible] = useState(false);
  const beginExploring = (destination?: number) => {
    setSelected(null); setHelp(false);
    if (!kit) { pendingStop.current = destination ?? null; setEntryError(""); setJoining(true); return; }
    if (!exploring) controller.current?.restart();
    setExploring(true);
    if (destination !== undefined) controller.current?.teleport(destination);
  };
  const joinPitch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joined.current) return;
    const name = playerName.trim().replace(/\s+/g, " ");
    if (!name || name.length > 16) { setEntryError("Choose a name between 1 and 16 characters."); return; }
    if (name.toLocaleLowerCase() === "adi") { setEntryError("Adi is already on the pitch. Choose another name."); return; }
    if (!/^\d{1,2}$/.test(playerNumber) || Number(playerNumber) < 1) { setEntryError("Choose a whole number from 1 to 99."); return; }
    if (Number(playerNumber) === 11) { setEntryError("Number 11 belongs to Adi. Pick another favourite."); return; }
    const nextKit = { name, number: String(Number(playerNumber)) };
    joined.current = true;
    void notifyPitchJoin(nextKit, contactConfig.accessKey);
    setFieldPassVisible(true);
    controller.current?.dress(nextKit); setKit(nextKit); setJoining(false); setExploring(true);
    if (pendingStop.current !== null) controller.current?.teleport(pendingStop.current);
    pendingStop.current = null;
  };
  const [exploring, setExploring] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [near, setNear] = useState<number | null>(null);
  const [help, setHelp] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [winner, setWinner] = useState<"visitor" | "adi" | null>(null);
  const [goals, setGoals] = useState(0);
  const [adiGoals, setAdiGoals] = useState(0);
  const [scorer, setScorer] = useState("visitor");
  const [possession, setPossession] = useState("adi");
  const [goalCelebration, setGoalCelebration] = useState(false);
  const [ballPosition, setBallPosition] = useState({x:0,z:5});
  const [position, setPosition] = useState({ x: 0, z: 30 });
  const openStop = (i: number) => { setSelected(i); setVisited(v => v.includes(i) ? v : [...v, i]); };
  useEffect(() => { walking.current = exploring; }, [exploring]);
  useEffect(() => {
    if (!fieldPassVisible) return;
    const timer = window.setTimeout(() => setFieldPassVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [fieldPassVisible]);
  useEffect(() => { selectedRef.current = (help || joining) ? -1 : selected; }, [selected, help, joining]);
  useEffect(() => {
    if(selected===null&&!help&&!joining)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
    const elements=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button,a[href],input')??[]);
    elements()[0]?.focus();
    const trap=(e:KeyboardEvent)=>{if(e.key==="Escape"){setSelected(null);setHelp(false);setJoining(false);}if(e.key!=="Tab")return;const items=elements(),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}};
    document.addEventListener("keydown",trap);
    return()=>{document.removeEventListener("keydown",trap);previous?.focus();};
  },[selected,help,joining]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor("#acc2c8");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#b9ccd0", 220, 490);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 650);
    camera.position.set(108, 83, 128);
    scene.add(new THREE.HemisphereLight(0xe0f1ff, 0x687453, 2.9));
    const sun = new THREE.DirectionalLight(0xffe6ba, 3.5); sun.position.set(-70, 120, 60); scene.add(sun);
    const material = (color: THREE.ColorRepresentation, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...extra });
    const concrete = material("#ccd4d3"), dark = material("#152638"), white = material("#f4f0d8"), blue = material("#243b68"), red = material("#8c2844");
    function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = scene) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
    }
    function line(points: THREE.Vector3[], color = "#e4ecd6") { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color })); scene.add(l); return l; }
    function oval(rx: number, rz: number, y: number, width: number, mat: THREE.Material) {
      const shape = new THREE.Shape(); shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
      const hole = new THREE.Path(); hole.absellipse(0, 0, rx - width, rz - width, 0, Math.PI * 2, true, 0); shape.holes.push(hole);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 160), mat); mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; scene.add(mesh); return mesh;
    }
    box(700, .5, 700, material("#a5b3a6"), 0, -2);
    oval(114, 133, -1, 28, material("#b7c2bd"));
    box(82, .25, 120, material("#315b46"));
    for (let i = 0; i < 20; i++) box(68, .05, 5.25, material(i % 2 ? "#588a51" : "#649857"), 0, .16, -49.875 + i * 5.25);
    const pitchY = .23;
    const rect = (x: number, z: number, w: number, d: number) => line([new THREE.Vector3(x-w/2,pitchY,z-d/2),new THREE.Vector3(x+w/2,pitchY,z-d/2),new THREE.Vector3(x+w/2,pitchY,z+d/2),new THREE.Vector3(x-w/2,pitchY,z+d/2),new THREE.Vector3(x-w/2,pitchY,z-d/2)]);
    rect(0,0,68,105); line([new THREE.Vector3(-34,pitchY,0),new THREE.Vector3(34,pitchY,0)]);
    const circle = (x: number,z: number,r: number) => line(Array.from({length:97},(_,i)=>new THREE.Vector3(x+Math.cos(i/96*Math.PI*2)*r,pitchY,z+Math.sin(i/96*Math.PI*2)*r)));
    circle(0,0,9.15); circle(0,0,.2);
    for (const side of [-1, 1]) {
      rect(0,side*44.25,40.3,16.5); rect(0,side*49.75,18.3,5.5); circle(0,side*41.5,.18);
      const z = side*53;
      box(7.5,.18,.18,white,0,2.5,z); for (const x of [-3.7,3.7]) box(.18,2.5,.18,white,x,1.25,z);
      for(let i=0;i<=15;i++) line([new THREE.Vector3(-3.7+i*.493,0,z+side*2.5),new THREE.Vector3(-3.7+i*.493,2.5,z+side*2.5),new THREE.Vector3(-3.7+i*.493,2.5,z)],"#cbdad0");
      for(let i=0;i<6;i++) line([new THREE.Vector3(-3.7,i*.5,z+side*2.5),new THREE.Vector3(3.7,i*.5,z+side*2.5)],"#cbdad0");
    }
    // Three continuous tiers, individually instanced seats, and open circulation decks.
    const seatGeometry = new THREE.BoxGeometry(.69,.65,.72);
    const rows = 39, perRow = 380;
    const seats = new THREE.InstancedMesh(seatGeometry, material("#ffffff"), rows*perRow);
    const dummy = new THREE.Object3D(); let index=0;
    for(let row=0;row<rows;row++) {
      const tier = Math.floor(row/13), r = row%13;
      const rx = 45+row*1.13+tier*2.4, rz=64+row*1.08+tier*2.4, y=1.5+row*.69+tier*2.7;
      oval(rx+1.1,rz+1.1,y-.35,2,concrete);
      for(let j=0;j<perRow;j++) {
        const a=j/perRow*Math.PI*2;
        if(j%32<2) { dummy.position.set(0,-20,0); } else { dummy.position.set(Math.cos(a)*rx,y,Math.sin(a)*rz); }
        dummy.rotation.set(0,-a+Math.PI/2,0); dummy.updateMatrix(); seats.setMatrixAt(index,dummy.matrix);
        const stripe = Math.floor(j/32)%3===0;
        seats.setColorAt(index,new THREE.Color(stripe ? "#243f78" : row>26 ? "#254675" : "#a33350")); index++;
      }
      if(r===12) { oval(rx+2.7,rz+2.7,y+1.1,3.2,dark); oval(rx+2.8,rz+2.8,y+1.35,.35,white); }
    }
    scene.add(seats);
    oval(94,112,37,19,material("#d9e2df",{side:THREE.DoubleSide,transparent:true,opacity:.86}));
    oval(95,113,38,1.3,dark); oval(75.5,93.5,36.8,.8,white);
    for(let i=0;i<72;i++) {
      const a=i/72*Math.PI*2;
      line([new THREE.Vector3(Math.cos(a)*75,37,Math.sin(a)*93),new THREE.Vector3(Math.cos(a)*94,38,Math.sin(a)*112)],"#edf2ed");
      if(i%3===0) { const pillar=box(.55,38,.55,concrete,Math.cos(a)*93,18,Math.sin(a)*111); pillar.rotation.z=.06*Math.cos(a); }
    }
    function sign(text: string, w:number,h:number,x:number,y:number,z:number,rotation=0,bg="#122b40",fg="#f7e4a3") {
      const canvas=document.createElement("canvas"); canvas.width=1536;canvas.height=256;
      const ctx=canvas.getContext("2d")!;ctx.fillStyle=bg;ctx.fillRect(0,0,1536,256);ctx.fillStyle=fg;ctx.font="600 95px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,768,128);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);return mesh;
    }
    sign("M É S   Q U E   U N   C L U B",66,7,0,18,-83);
    sign("Spotify CAMP NOU",34,5,0,32,-98);
    sign("FC BARCELONA",44,4,0,8,70,Math.PI);
    for(const side of [-1,1]) { box(80,1.1,.3,blue,0,.9,side*58); sign("FC BARCELONA    •    MÉS QUE UN CLUB    •    FC BARCELONA",77,1,0,1,side*57.8,side===1?Math.PI:0); }
    const markers: THREE.Mesh[]=[];
    stops.forEach((s,i)=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2,.085,8,64),new THREE.MeshBasicMaterial({color:s.color}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.3,s.z);scene.add(ring);
      const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,5,8),material(s.color,{emissive:s.color,emissiveIntensity:.5}));beacon.position.set(s.x,2.7,s.z);scene.add(beacon);
      const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.8),material(s.color,{metalness:.3,roughness:.2}));marker.position.set(s.x,5.7,s.z);scene.add(marker);markers.push(marker);
      sign(`${s.number}  /  ${s.name.toUpperCase()}`,10,1.65,s.x,7.7,s.z,0,"#152638",s.color);
    });
    function makePlayer() {
      const group = new THREE.Group(); scene.add(group);
      box(.4,1.05,.44,blue,-.2,1.35,0,group);
      box(.4,1.05,.44,red,.2,1.35,0,group);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),material("#d5a27e")); head.position.y=2.15; group.add(head);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.3,16,12,0,Math.PI*2,0,Math.PI/2),dark); hair.position.y=2.2; group.add(hair);
      const legs=[box(.27,.8,.3,dark,-.22,.42,0,group),box(.27,.8,.3,dark,.22,.42,0,group)];
      for (const side of [-1,1]) {
        box(.24,.35,.32,side<0?blue:red,side*.52,1.68,0,group);
        box(.22,.55,.28,material("#d5a27e"),side*.52,1.23,0,group);
      }
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.8,32),new THREE.MeshBasicMaterial({color:"#1d402b",transparent:true,opacity:.45}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;group.add(shadow);
      const printMaterial = new THREE.MeshBasicMaterial({transparent:true,depthWrite:false});
      for (const side of [-1,1]) {
        const print = new THREE.Mesh(new THREE.PlaneGeometry(.74,.92),printMaterial);
        print.position.set(0,1.36,side*.225); print.rotation.y=side<0?Math.PI:0;group.add(print);
      }
      const dress = ({name,number}: Kit) => {
        const canvas=document.createElement("canvas");canvas.width=512;canvas.height=640;
        const ctx=canvas.getContext("2d")!;
        ctx.fillStyle="#ffe6a0";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.font="bold 64px Arial";ctx.fillText(name.toUpperCase(),256,100,470);
        ctx.font="bold 350px Arial";ctx.fillText(number,256,370,460);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        printMaterial.map?.dispose();printMaterial.map=texture;printMaterial.needsUpdate=true;
      };
      return { group, legs, dress };
    }
    const visitor=makePlayer(), avatar=visitor.group, legs=visitor.legs;
    avatar.position.set(0,.3,30);avatar.visible=false;
    const adi=makePlayer();adi.dress({name:"Adi",number:"11"});
    const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1),white);scene.add(ball);
    // Dark panels sit just above the white ball and rotate with it.
    for(const direction of [new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)]){
      const patch=new THREE.Mesh(new THREE.CircleGeometry(.13,5),dark);patch.position.copy(direction.clone().multiplyScalar(.34));patch.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);ball.add(patch);
    }
    const football=createBall();
    let matchStarted=false, gameTime=0;
    let stickX=0,stickZ=0;
    const tackle=()=>{if(walking.current&&selectedRef.current===null)tackleBall(football,avatar.position.x,avatar.position.z);};
    const shoot=()=>{if(walking.current&&selectedRef.current===null)shootBall(football,avatar.rotation.y);};
    const keys=new Set<string>(); let yaw=0,cameraYaw=0,cameraPitch=Math.atan2(7,13),moving=false,dragging=false,lastX=0,lastY=0,lookPointer:number|null=null,nearIndex:number|null=null;
    const onKey=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement || selectedRef.current!==null)return;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.code==="Space"&&!e.repeat)shoot();if(e.key.toLowerCase()==="e"&&nearIndex!==null&&walking.current&&selectedRef.current===null){setSelected(nearIndex);setVisited(v=>v.includes(nearIndex!)?v:[...v,nearIndex!]);}if(e.key==="Escape"){setSelected(null);setHelp(false);setJoining(false);}};
    const onUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
    const clear=()=>{keys.clear();stickX=0;stickZ=0;dragging=false;lookPointer=null;};
    window.addEventListener("keydown",onKey);window.addEventListener("keyup",onUp);window.addEventListener("blur",clear);
    const down=(e:PointerEvent)=>{if(lookPointer!==null)return;lookPointer=e.pointerId;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);};
    const move=(e:PointerEvent)=>{if(dragging&&e.pointerId===lookPointer){cameraPitch=THREE.MathUtils.clamp(cameraPitch+(e.clientY-lastY)*.005,.12,1.15);lastY=e.clientY;const turn=(e.clientX-lastX)*.006;yaw-=turn;cameraYaw-=turn;lastX=e.clientX;}};
    const up=(e:PointerEvent)=>{if(e.pointerId===lookPointer){dragging=false;lookPointer=null;}};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);renderer.domElement.addEventListener("lostpointercapture",up);
    controller.current={move:(x,z)=>{stickX=x;stickZ=z;},tackle,restart:()=>{
      Object.assign(football,createBall());football.pickupDelay=1.2;
      adi.group.position.set(0,.3,5);avatar.position.set(0,.3,10);avatar.rotation.y=Math.PI;
      yaw=0;cameraYaw=0;moving=false;keys.clear();
      setWinner(null);setGoals(0);setAdiGoals(0);setGoalCelebration(false);
    },shoot,dress:(kit)=>{visitor.dress(kit);avatar.visible=true;matchStarted=true;avatar.position.set(0,.3,10);avatar.rotation.y=Math.PI;cameraYaw=0;yaw=0;moving=false;},teleport:(i)=>{if(football.owner==="visitor"){football.owner="free";football.pickupDelay=.3;}avatar.position.set(stops[i].x,.3,stops[i].z+5);yaw=0;cameraYaw=0;avatar.rotation.y=Math.PI;moving=false;},key:(k,p)=>{if(p)keys.add(k);else keys.delete(k);}};
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    let previousTime=performance.now(),elapsed=0;let frame=0,lastUi=0; const target=new THREE.Vector3(), look=new THREE.Vector3(0,2,0);
    const animate=()=>{
      frame=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-previousTime)/1000,.05);previousTime=now;elapsed+=dt;const t=elapsed;
      const playing=matchStarted&&walking.current&&selectedRef.current===null;
      if(playing||!matchStarted)gameTime+=dt;
      if(!playing){keys.clear();moving=false;stickX=0;stickZ=0;}
      const lap=gameTime*.28;
      if(!matchStarted){adi.group.position.set(Math.sin(lap)*7,.3,Math.cos(lap)*5);
      adi.group.rotation.y=Math.atan2(Math.cos(lap)*7,-Math.sin(lap)*5);}
      adi.legs[0].rotation.x=Math.sin(gameTime*7)*.55;adi.legs[1].rotation.x=-Math.sin(gameTime*7)*.55;

      if(walking.current&&selectedRef.current===null){
        let dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
        let dz=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
        const analog=Math.hypot(stickX,stickZ);
        if(analog>0){dx=stickX;dz=stickZ;}
        if(dx||dz){if(!moving){yaw=cameraYaw;moving=true;}const length=Math.hypot(dx,dz);dx/=length;dz/=length;const vx=dx*Math.cos(yaw)+dz*Math.sin(yaw),vz=dz*Math.cos(yaw)-dx*Math.sin(yaw);const speed=analog>0?12*Math.min(analog,1):(keys.has("shift")?15:8);avatar.position.x=THREE.MathUtils.clamp(avatar.position.x+vx*dt*speed,-37,37);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z+vz*dt*speed,-55,55);avatar.rotation.y=Math.atan2(vx,vz);legs[0].rotation.x=Math.sin(t*12)*.6;legs[1].rotation.x=-Math.sin(t*12)*.6;}else {moving=false;legs.forEach(l=>l.rotation.x=0);}
      }
      if(playing||!matchStarted){
        const event=stepBall(football,dt);
        if(event==="goal"){setWinner(matchWinner(football));setGoals(football.goals);setAdiGoals(football.adiGoals);setScorer(football.lastTouch);setGoalCelebration(true);}
        if(event==="reset"){setGoalCelebration(false);adi.group.position.set(0,.3,5);football.pickupDelay=1.2;}
        if(football.owner==="adi"&&!matchStarted){
          const lead=lap+.22+Math.sin(gameTime*3)*.025;
          football.x=Math.sin(lead)*7;football.z=Math.cos(lead)*5;
        }
        if(playing)takeBall(football,avatar.position.x,avatar.position.z);
        if(football.owner==="visitor"){
          football.x=THREE.MathUtils.clamp(avatar.position.x+Math.sin(avatar.rotation.y)*1.1,-35.5,35.5);
          football.z=THREE.MathUtils.clamp(avatar.position.z+Math.cos(avatar.rotation.y)*1.1,-52,52);
        }
        if(playing){
          const ai={x:adi.group.position.x,z:adi.group.position.z,facing:adi.group.rotation.y};
          advanceAdi(football,ai,dt);
          adi.group.position.set(ai.x,.3,ai.z);adi.group.rotation.y=ai.facing;
        }
        const travel=Math.hypot(football.x-ball.position.x,football.z-ball.position.z);
        ball.position.set(football.x,.58,football.z);
        ball.rotation.x+=travel/.35;ball.rotation.z-=travel/.7;
      }
      if(walking.current){
        if(moving&&!dragging){
          const desired=avatar.rotation.y+Math.PI;
          const difference=Math.atan2(Math.sin(desired-cameraYaw),Math.cos(desired-cameraYaw));
          cameraYaw+=difference*(1-Math.exp(-dt*6));
        }
        const distance=Math.hypot(13,7),horizontal=distance*Math.cos(cameraPitch);
        target.set(avatar.position.x+Math.sin(cameraYaw)*horizontal,2+distance*Math.sin(cameraPitch),avatar.position.z+Math.cos(cameraYaw)*horizontal);look.lerp(new THREE.Vector3(avatar.position.x,2,avatar.position.z),1-Math.exp(-dt*5));}
      else {target.set(Math.sin(.67+yaw)*164,86,Math.cos(.67+yaw)*164);look.lerp(new THREE.Vector3(0,3,0),1-Math.exp(-dt*4));}
      camera.position.lerp(target,1-Math.exp(-dt*3));camera.lookAt(look);
      markers.forEach((m,i)=>{m.rotation.y=t*.5;m.position.y=5.7+Math.sin(t*1.5+i)*.25;});
      if(t-lastUi>.15){lastUi=t;setPossession(football.owner);setBallPosition({x:football.x,z:football.z});setPosition({x:avatar.position.x,z:avatar.position.z});const n=stops.findIndex(s=>Math.hypot(s.x-avatar.position.x,s.z-avatar.position.z)<8);nearIndex=n<0?null:n;setNear(nearIndex);}
      renderer.render(scene,camera);
    };animate();setLoaded(true);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("keydown",onKey);window.removeEventListener("keyup",onUp);window.removeEventListener("blur",clear);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if("map"in m)(m.map as THREE.Texture|null)?.dispose();m.dispose();});}else if(o instanceof THREE.Line){o.geometry.dispose();(o.material as THREE.Material).dispose();}});renderer.dispose();renderer.domElement.remove();controller.current=null;};
  },[]);

  return <main className={styles.world}>
    <div className={styles.canvas} ref={mount} aria-label="Interactive 3D football stadium" />
    <div className={styles.vignette}/>
    <header className={styles.header}>
      <a className={styles.headerCta} href="/portfolio/index.html">Learn more <ArrowUpRight size={17}/></a>
    </header>
    {!exploring && <section className={styles.intro}><h1>More than a <em>portfolio.</em></h1><p>I’m Aditya. Developer, curious mind, lifelong culé.<br/>Welcome to my home ground.</p><button className={styles.enter} onClick={()=>beginExploring()} disabled={!loaded||failed}>Step onto the pitch <ArrowRight size={19}/></button><span className={styles.enterNote}>YOUR STADIUM. YOUR PACE.</span></section>}
    <div className={styles.viewTools}><button title={exploring?"Aerial view":"Explore on foot"} aria-label={exploring?"Aerial view":"Explore on foot"} onClick={()=>exploring?setExploring(false):beginExploring()}>{exploring?<Maximize2 size={19}/>:<PersonStanding size={20}/>}</button><button aria-label="How to explore" onClick={()=>setHelp(true)}><CircleHelp size={19}/></button></div>
    {exploring&&<div className={styles.walkTitle}><span>WELCOME TO YOUR HOME GROUND</span><h2>Make yourself at home.</h2><p>Take the ball from Adi, or explore the glowing markers.</p></div>}
    {exploring&&near!==null&&selected===null&&<button className={styles.interact} onClick={()=>openStop(near)}><kbd>E</kbd> Explore {stops[near].name} <ArrowUpRight size={18}/></button>}
    <footer className={styles.footer}>
      <nav className={styles.socialDock} aria-label="Social and contact links">
        <a href="https://www.linkedin.com/in/aditya-poudel-526a66277/" target="_blank" rel="noreferrer"><svg width="23" height="23" fill="currentColor" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg><span>LinkedIn</span><ArrowUpRight size={17}/></a>
        <a href="https://github.com/poudelion" target="_blank" rel="noreferrer"><svg width="23" height="23" fill="currentColor" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg><span>GitHub</span><ArrowUpRight size={17}/></a>
        <a href="https://www.instagram.com/adityaa.poudel/" target="_blank" rel="noreferrer"><svg width="23" height="23" fill="currentColor" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg><span>Instagram</span><ArrowUpRight size={17}/></a>
        <a href="mailto:adityarajpoudel@gmail.com"><Mail size={23}/><span>Email</span><ArrowUpRight size={17}/></a>
      </nav>
    </footer>
    <div className={styles.bottomNote}><span>VISCA EL BARÇA</span></div>
    {exploring&&<><div className={styles.controls}><span><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><p>Move around<br/><small>Drag to look / tilt · Shift to run · Space to shoot</small></p></div><div className={styles.minimap}><div className={styles.mapPitch}><i/><span aria-label="Ball" style={{left:`${(ballPosition.x+38)/76*100}%`,top:`${(ballPosition.z+57)/114*100}%`,background:"#ffe171",width:7,height:7}}/><b style={{left:`${(position.x+38)/76*100}%`,top:`${(position.z+57)/114*100}%`}}/>{stops.map(s=><span key={s.name} style={{left:`${(s.x+38)/76*100}%`,top:`${(s.z+57)/114*100}%`,background:s.color}}/>)}</div><small>YOU ARE HERE</small></div>{selected===null&&!help&&<TouchControls onMove={(x,z)=>controller.current?.move(x,z)} onShoot={()=>controller.current?.shoot()} onTackle={()=>controller.current?.tackle()} canShoot={possession==="visitor"&&!winner&&!goalCelebration} canTackle={possession!=="visitor"&&!winner&&!goalCelebration}/>}</>}
    {exploring&&kit&&<aside className={styles.matchHud} aria-label="Football game">
      <div><span>{kit.name} <small>#{kit.number}</small></span><strong>{goals} – {adiGoals} <small>ADI</small></strong></div>
      <p>{selected!==null||help?"Game paused · take your time exploring":winner?(winner==="visitor"?"You win! First to five. Explore or play again.":"Adi wins this match. Ready for a rematch?"):goalCelebration?"Goal! Adi takes the next kickoff.":possession==="visitor"?"Your ball. Face either goal and shoot.":possession==="adi"?"Run up to Adi’s ball to take possession.":"Loose ball! Run up to it to collect."}</p>
      <small>FIRST TO 5</small>
      {winner?<button onClick={()=>controller.current?.restart()}>Play again</button>:<button onClick={()=>controller.current?.shoot()} disabled={possession!=="visitor"||selected!==null||help||goalCelebration}>Shoot <kbd>SPACE</kbd></button>}
    </aside>}
    {exploring&&fieldPassVisible&&kit&&<p className={styles.notificationNotice} role="status">Field pass issued · {kit.name} #{kit.number}<br/>Welcome to the pitch. Make it yours.</p>}
    {exploring&&goalCelebration&&!winner&&<div className={styles.goalToast} role="status">GOAL! <span>{scorer==="adi"?"Adi scores! Win it back.":`Nice finish, ${kit?.name}.`}</span></div>}
    {!loaded&&!failed&&<div className={styles.loading}>Opening the gates…</div>}
    {failed&&<div className={styles.loading}>The 3D view requires WebGL. You can still explore the full portfolio using Learn more.</div>}
    {joining&&<div className={styles.modalBackdrop} onClick={()=>setJoining(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="join-title" className={styles.modal} onClick={e=>e.stopPropagation()}>
        <button className={styles.close} aria-label="Close jersey setup" onClick={()=>setJoining(false)}><X/></button>
        <h2 id="join-title">Make the shirt yours.</h2>
        <p>Adi’s already warming up. Choose your name and favourite number to join him.</p>
        <div className={styles.jerseyPreview} aria-label="Half blue, half red jersey preview"><span>{playerName.trim()||"YOUR NAME"}</span><strong>{playerNumber||"?"}</strong></div>
        <form onSubmit={joinPitch} className={styles.joinForm}>
          <label htmlFor="player-name">Name on your jersey<input id="player-name" name="playerName" maxLength={16} required value={playerName} onChange={e=>{setPlayerName(e.target.value);setEntryError("");}} autoComplete="nickname" placeholder="Your name" aria-describedby="kit-reservation email-notice"/></label>
          <label htmlFor="player-number">Favourite number<input id="player-number" name="playerNumber" type="text" inputMode="numeric" maxLength={2} required value={playerNumber} onChange={e=>{setPlayerNumber(e.target.value);setEntryError("");}} placeholder="1–99" aria-describedby="kit-reservation email-notice"/></label>
          <p id="kit-reservation" className={styles.reservation}>Adi and #11 are reserved for the home player.</p>
          {entryError&&<p role="alert" className={styles.entryError}>{entryError}</p>}
          <button className={styles.enter} type="submit" disabled={!loaded||failed}>Join the pitch <ArrowRight size={18}/></button>
        </form>
      </section>
    </div>}
    {(selected!==null||help)&&<div className={styles.modalBackdrop} onClick={()=>{setSelected(null);setHelp(false);setJoining(false);}}><section role="dialog" aria-modal="true" aria-label={help?"How to explore":stops[selected!].name} className={styles.modal} onClick={e=>e.stopPropagation()}><button autoFocus className={styles.close} aria-label="Close" onClick={()=>{setSelected(null);setHelp(false);setJoining(false);}}><X/></button>{help?<><div className={styles.eyebrow}>YOUR MATCHDAY GUIDE</div><h2>The pitch is yours.</h2><p>Use WASD or arrow keys to move. Hold Shift to run. Run up to the ball to take it from Adi, then face either goal and press Space (or tap Shoot). First to five goals wins. Goals count automatically, and Adi restarts play between goals. Drag the stadium left or right to turn the camera, and up or down to adjust its height. On a phone, use the left joystick to move. Push farther to run. Tap Shoot to kick or Tackle near the ball to win it back.</p><p>Walk to a glowing marker and press E to open it, or use Learn more to browse the full portfolio. The view button switches between aerial and on-foot views. The game pauses while you read a portfolio section. Stepping back onto the pitch from the aerial view starts a fresh match.</p><button className={styles.enter} onClick={()=>beginExploring()}>Let’s explore <ArrowRight size={18}/></button></>:<><div className={styles.eyebrow}>{stops[selected!].number} / {stops[selected!].label}</div><h2>{stops[selected!].title}</h2><p>{stops[selected!].text}</p><div className={styles.placeholder}>{stops[selected!].note}</div>{selected===1&&<div className={styles.projectLinks}>{[["ExEv","Evacuation simulation & routing","exev"],["Homicide Dashboard","Automated data scraper & visualizer","homicide-dashboard"],["FINAD","Financial analysis dashboard","finad"],["CourseMonitor","CourseMonitor","coursemonitor"],["SUBS","SUBS","subs"],["CopyIt","Copy text from anywhere on screen","copyit"],["Let’s Football","A game for the beautiful game","lets-football"]].map(([name,description,slug])=><a key={slug} href={`/portfolio/projects/${slug}.html`} target="_blank" rel="noreferrer"><span>{name}<small>{description}</small></span><ArrowUpRight size={17}/></a>)}</div>}{selected===3&&<div className={styles.socialLinks}><a href="mailto:adityarajpoudel@gmail.com">Email me <ArrowUpRight size={16}/></a><a href="https://github.com/poudelion" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16}/></a><a href="https://linkedin.com/in/aditya-poudel-526a66277/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={16}/></a></div>}{selected===0&&<p>Off screen: swimming, soccer, and the next adventure. A lifelong Barça fan — and yes, I’ve seen Messi play live.</p>}<button className={styles.enter} onClick={()=>beginExploring(selected!)}>Visit this part of the pitch <ArrowRight size={18}/></button></>}</section></div>}
  </main>;
}
