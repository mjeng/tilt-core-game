export function createTiltCoreGame(env){
  const { ctx, keys, size, setHudLabels, setHudValues, setStatus, end, drawGrid, clamp } = env;

  let ball=null, target=null, tiltX=0, tiltY=0, score=0, timeLeft=0;

  function onOrientation(e){
    tiltX=clamp((e.gamma||0)/35,-1,1);
    tiltY=clamp((e.beta||0)/35,-1,1);
  }

  async function requestSensor(){
    try{
      if(typeof DeviceOrientationEvent!=="undefined" && typeof DeviceOrientationEvent.requestPermission==="function"){
        const res=await DeviceOrientationEvent.requestPermission();
        if(res!=="granted") setStatus("Orientation denied. Keyboard still works.");
      }
      window.addEventListener("deviceorientation", onOrientation, true);
    }catch(e){
      setStatus("Orientation unavailable. Keyboard still works.");
    }
  }

  function stop(){
    window.removeEventListener("deviceorientation", onOrientation, true);
  }

  function resetPreview(){
    ball=null;
    target=null;
  }

  function init(){
    const { W, H } = size();
    score=0;
    timeLeft=30;
    setHudLabels({ left: "Score", middle: "Mode" });
    setHudValues({ left: 0, middle: "Tilt", time: timeLeft.toFixed(1) });
    ball={x:W/2,y:H/2,vx:0,vy:0,r:18};
    target={x:W/2,y:H/2,r:54};
    moveTarget();
  }

  function moveTarget(){
    const { W, H } = size();
    target.x=80+Math.random()*Math.max(1,W-160);
    target.y=95+Math.random()*Math.max(1,H-210);
  }

  function update(dt){
    const { W, H } = size();
    timeLeft=Math.max(0,timeLeft-dt);
    let kx=(keys.has("ArrowLeft")||keys.has("a")?-1:0)+(keys.has("ArrowRight")||keys.has("d")?1:0);
    let ky=(keys.has("ArrowUp")||keys.has("w")?-1:0)+(keys.has("ArrowDown")||keys.has("s")?1:0);
    const ix=kx||tiltX, iy=ky||tiltY;
    ball.vx+=ix*900*dt; ball.vy+=iy*900*dt; ball.vx*=Math.pow(.82,dt*60); ball.vy*=Math.pow(.82,dt*60); ball.x+=ball.vx*dt; ball.y+=ball.vy*dt;
    if(ball.x<ball.r){ball.x=ball.r;ball.vx*=-.45} if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx*=-.45} if(ball.y<ball.r){ball.y=ball.r;ball.vy*=-.45} if(ball.y>H-ball.r){ball.y=H-ball.r;ball.vy*=-.45}
    const d=Math.hypot(ball.x-target.x,ball.y-target.y); if(d<target.r) score+=dt*(d<target.r*.45?12:5); if(d<ball.r+8){score+=10;moveTarget();}
    setHudValues({ left: Math.floor(score), middle: "Tilt", time: timeLeft.toFixed(1) });
    if(timeLeft<=0) end("Final score: "+Math.floor(score));
  }

  function draw(){
    if(!ball || !target) return;
    drawGrid();
    ctx.fillStyle="rgba(34,197,94,.12)"; ctx.strokeStyle="rgba(134,239,172,.85)"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(target.x,target.y,target.r,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle="rgba(34,197,94,.22)"; ctx.beginPath(); ctx.arc(target.x,target.y,target.r*.45,0,Math.PI*2); ctx.fill();
    const g=ctx.createRadialGradient(ball.x-7,ball.y-8,2,ball.x,ball.y,25); g.addColorStop(0,"#fff"); g.addColorStop(.5,"#93c5fd"); g.addColorStop(1,"#1d4ed8");
    ctx.shadowColor="rgba(59,130,246,.7)"; ctx.shadowBlur=24; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  }

  return {
    meta: {
      title: "Tilt Core",
      description: "Tilt your phone to keep the ball on the target. Hold the center ring to score faster.",
      controls: "Phone: tilt to steer. Desktop: arrow keys or WASD.",
      showAxisControls: false
    },
    requestSensor,
    resetPreview,
    init,
    update,
    draw,
    stop
  };
}
