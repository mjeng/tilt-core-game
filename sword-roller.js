export function createSwordRollerGame(env){
  const { ctx, keys, size, setHudLabels, setHudValues, setStatus, end, drawGrid, clamp, dead, distPointSeg, circleRect } = env;

  let rawAx=0, rawAy=0, baseAx=0, baseAy=0, motionSamples=[];
  let sidePos=0, sideVel=0, thrust=0, thrustVel=0, prevThrust=0, monsters=[], particles=[];
  let score=0, health=100, timeLeft=0, spawnTimer=.2, forwardSign=1, sideSign=1;

  function onMotion(e){
    const a=e.acceleration || e.accelerationIncludingGravity || {};
    rawAx=typeof a.x==="number"?a.x:0;
    rawAy=typeof a.y==="number"?a.y:0;
    if(motionSamples.length<30){
      motionSamples.push({x:rawAx,y:rawAy});
      baseAx=motionSamples.reduce((s,p)=>s+p.x,0)/motionSamples.length;
      baseAy=motionSamples.reduce((s,p)=>s+p.y,0)/motionSamples.length;
    }
  }

  async function requestSensor(){
    motionSamples=[]; rawAx=rawAy=baseAx=baseAy=0;
    try{
      if(typeof DeviceMotionEvent!=="undefined" && typeof DeviceMotionEvent.requestPermission==="function"){
        const res=await DeviceMotionEvent.requestPermission();
        if(res!=="granted") { setStatus("Motion denied. Keyboard still works."); return; }
      }
      window.addEventListener("devicemotion", onMotion, true);
    }catch(e){
      setStatus("Motion unavailable. Keyboard still works.");
    }
  }

  function stop(){
    window.removeEventListener("devicemotion", onMotion, true);
  }

  function resetPreview(){
    monsters=[];
    particles=[];
  }

  function flipForward(){
    forwardSign*=-1;
    setStatus("Forward axis flipped.");
  }

  function flipSide(){
    sideSign*=-1;
    setStatus("Side axis flipped.");
  }

  function init(){
    score=0;
    health=100;
    timeLeft=45;
    monsters=[];
    particles=[];
    sidePos=sideVel=thrust=thrustVel=prevThrust=0;
    motionSamples=[];
    setHudLabels({ left: "Score", middle: "Gate" });
    setHudValues({ left: 0, middle: health, time: timeLeft.toFixed(1) });
    spawnTimer=.2;
  }

  function origin(){
    const { W, H } = size();
    return {x:W/2,y:H-78};
  }

  function gate(){
    const { W, H } = size();
    return {x:W/2,y:H-34,w:Math.min(190,W*.48),h:24};
  }

  function spawnMonster(){
    const { H } = size();
    const o=origin(), R=Math.min(H*.73,630), a=-Math.PI/4+Math.random()*Math.PI/2, hp=Math.random()<.2?2:1;
    monsters.push({x:o.x+Math.sin(a)*R,y:o.y-Math.cos(a)*R,r:hp===2?23:17,hp,maxHp:hp,speed:42+Math.random()*30+Math.min(45,score*.035),wob:Math.random()*9,cd:0});
  }

  function burst(x,y,color,n=10){
    for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,life:.45,color});
  }

  function updateParticles(dt){
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94}
    particles=particles.filter(p=>p.life>0);
  }

  function drawParticles(){
    for(const p of particles){ctx.globalAlpha=clamp(p.life/.45,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=1;
  }

  function update(dt){
    const { H } = size();
    timeLeft=Math.max(0,timeLeft-dt);
    const left=keys.has("ArrowLeft")||keys.has("a"), right=keys.has("ArrowRight")||keys.has("d"), up=keys.has("ArrowUp")||keys.has("w"), down=keys.has("ArrowDown")||keys.has("s");
    const kSide=(left?-1:0)+(right?1:0), kThrust=(up?1:0)+(down?-1:0);
    if(kSide||kThrust){ sidePos=clamp(sidePos+kSide*dt*1.7,-1,1); thrust=clamp(thrust+kThrust*dt*2.4,0,1); if(!up&&!down) thrust=clamp(thrust-dt*1.1,0,1); }
    else {
      const ax=dead((rawAx-baseAx)*sideSign,.12), ay=dead((rawAy-baseAy)*forwardSign,.16);
      sideVel+=ax*dt*1.8; sideVel*=Math.pow(.82,dt*60); sidePos=clamp((sidePos+sideVel*dt*2.4)*Math.pow(.985,dt*60),-1,1);
      thrustVel+=ay*dt*2.1; thrustVel*=Math.pow(.84,dt*60); thrust=clamp((thrust+thrustVel*dt*2.2)*Math.pow(.996,dt*60),0,1);
    }
    spawnTimer-=dt; if(spawnTimer<=0){spawnMonster(); spawnTimer=Math.max(.45,1.18-score*.0018);}
    const o=origin(), g=gate();
    for(const m of monsters){ m.cd=Math.max(0,m.cd-dt); m.wob+=dt*5; const dx=o.x-m.x, dy=o.y-m.y, d=Math.max(1,Math.hypot(dx,dy)); m.x+=dx/d*m.speed*dt + (-dy/d*Math.sin(m.wob)*4*dt); m.y+=dy/d*m.speed*dt + (dx/d*Math.sin(m.wob)*4*dt); if(circleRect(m.x,m.y,m.r,g.x-g.w/2,g.y-g.h/2,g.w,g.h)){ health-=m.maxHp===2?18:12; burst(m.x,m.y,"#fb7185",12); m.dead=true; } }
    const angle=sidePos*Math.PI/4, len=90+thrust*Math.min(370,H*.52), tip={x:o.x+Math.sin(angle)*len,y:o.y-Math.cos(angle)*len};
    const stabbing=thrust>.24 && thrust>=prevThrust-.01;
    for(const m of monsters){ if(m.cd>0) continue; const d=distPointSeg(m.x,m.y,o.x,o.y,tip.x,tip.y); if(stabbing && d<m.r+10){ m.hp--; m.cd=.18; score+=15; burst(m.x,m.y,m.hp<=0?"#a78bfa":"#fbbf24",10); if(m.hp<=0){score+=m.maxHp===2?35:20; m.dead=true;} } }
    monsters=monsters.filter(m=>!m.dead); updateParticles(dt); prevThrust=thrust;
    setHudValues({ left: Math.floor(score), middle: Math.max(0,Math.floor(health)), time: timeLeft.toFixed(1) });
    if(health<=0||timeLeft<=0) end(`Score: ${Math.floor(score)} | Gate: ${Math.max(0,Math.floor(health))}`);
  }

  function draw(){
    const { H } = size();
    drawGrid(); const o=origin(), g=gate();
    ctx.fillStyle="rgba(56,189,248,.12)"; ctx.strokeStyle="rgba(125,211,252,.55)"; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.arc(o.x,o.y,Math.min(390,H*.54),-Math.PI*3/4,-Math.PI/4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle="#64748b"; ctx.fillRect(g.x-g.w/2,g.y-g.h/2,g.w,g.h); ctx.fillStyle="#e2e8f0"; ctx.fillRect(g.x-g.w/2+8,g.y-g.h/2+5,g.w-16,4);
    for(const m of monsters){ ctx.fillStyle=m.maxHp===2?"#7c3aed":"#dc2626"; ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(m.x-m.r*.32,m.y-m.r*.18,3,0,Math.PI*2); ctx.arc(m.x+m.r*.32,m.y-m.r*.18,3,0,Math.PI*2); ctx.fill(); }
    const angle=sidePos*Math.PI/4, len=90+thrust*Math.min(370,H*.52), tip={x:o.x+Math.sin(angle)*len,y:o.y-Math.cos(angle)*len};
    ctx.strokeStyle="#e5e7eb"; ctx.lineWidth=8; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(tip.x,tip.y); ctx.stroke(); ctx.strokeStyle="#93c5fd"; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle="#fbbf24"; ctx.beginPath(); ctx.arc(o.x,o.y,18,0,Math.PI*2); ctx.fill(); drawParticles();
  }

  return {
    meta: {
      title: "Sword Roller",
      description: "Phone screen-up on an ab roller. This mode ignores tilt and uses horizontal-plane motion only: roll forward/back to thrust and push left/right to sweep the sword.",
      controls: "Tap Start while the roller is still. Desktop: left/right aim, up/down thrust/retract.",
      showAxisControls: true
    },
    requestSensor,
    resetPreview,
    init,
    update,
    draw,
    stop,
    flipForward,
    flipSide
  };
}
