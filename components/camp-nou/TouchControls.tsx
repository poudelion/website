"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./camp.module.css";

type Props = { onMove:(x:number,z:number)=>void; onShoot:()=>void; onTackle:()=>void; canShoot:boolean; canTackle:boolean };
export default function TouchControls({onMove,onShoot,onTackle,canShoot,canTackle}:Props) {
  const pointer=useRef<number|null>(null);
  const moveRef=useRef(onMove);moveRef.current=onMove;
  const [stick,setStick]=useState({x:0,y:0});
  const reset=()=>{pointer.current=null;setStick({x:0,y:0});moveRef.current(0,0);};
  useEffect(()=>{
    const stop=()=>{pointer.current=null;setStick({x:0,y:0});moveRef.current(0,0);};
    window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
    return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);moveRef.current(0,0);};
  },[]);
  const update=(event:PointerEvent<HTMLDivElement>)=>{
    if(pointer.current!==event.pointerId)return;
    const rect=event.currentTarget.getBoundingClientRect();
    let x=(event.clientX-rect.left-rect.width/2)/42,y=(event.clientY-rect.top-rect.height/2)/42;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    setStick({x:x*42,y:y*42});
    if(length<.14)onMove(0,0);else onMove(x,y);
  };
  return <div className={styles.touchPad}>
    <div className={styles.joystick} role="group" aria-label="Movement joystick" onPointerDown={e=>{if(pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={update} onPointerUp={e=>{if(e.pointerId===pointer.current)reset();}} onPointerCancel={e=>{if(e.pointerId===pointer.current)reset();}} onLostPointerCapture={e=>{if(e.pointerId===pointer.current)reset();}}>
      <span className={styles.joystickKnob} style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/>
      <small>MOVE</small>
    </div>
    <div className={styles.touchActions}>
      <button type="button" className={styles.tackleButton} disabled={!canTackle} onClick={onTackle}>Tackle</button>
      <button type="button" className={styles.shootButton} disabled={!canShoot} onClick={onShoot}>Shoot</button>
    </div>
  </div>;
}
