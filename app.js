const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const isChinese = document.documentElement.lang === 'zh-CN';
const tr = (en, zh) => isChinese ? zh : en;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = {blue:'#527fa6',orange:'#d56036',gold:'#ad8c35',teal:'#7baba4',ink:'#252c2b'};
const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a,v));
const path = points => points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
const label = (x,y,text,color=C.ink,size=17,anchor='start') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${text}</text>`;
function arrow(x,y,dx,dy,color,width=2,head=7,halo=false) {
  const length = Math.hypot(dx,dy); if(length<.2)return '';
  const ux=dx/length,uy=dy/length,ex=x+dx,ey=y+dy;
  const d=`M${x},${y}L${ex},${ey}M${ex-ux*head-uy*head*.55},${ey-uy*head+ux*head*.55}L${ex},${ey}L${ex-ux*head+uy*head*.55},${ey-uy*head-ux*head*.55}`;
  return (halo?`<path d="${d}" fill="none" stroke="#fcfcf8" stroke-width="${width+5}" stroke-linecap="round" stroke-linejoin="round"/>`:'')+`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const playIcon='<path d="m8 5 10 7-10 7Z"/>';
const pauseIcon='<path d="M8 5v14M16 5v14"/>';
function playButton(button,paused){button.querySelector('.icon').innerHTML=paused?playIcon:pauseIcon;button.querySelector('span').textContent=paused?tr('Play','播放'):tr('Pause','暂停');button.setAttribute('aria-label',paused?tr('Play animation','播放动画'):tr('Pause animation','暂停动画'));}
// One clock for all illustrations. Timelines stop outside the viewport or in a hidden tab.
const loops=[];
const animationObserver=new IntersectionObserver(entries=>entries.forEach(e=>{const loop=loops.find(l=>l.target===e.target);if(loop){loop.visible=e.isIntersecting;loop.target.classList.toggle('motion-paused',loop.paused||!loop.visible)}}),{threshold:.05});
function makeLoop(target,duration,render,button,staticTime=duration-1000){
  const loop={target:$(target),duration,render,button:$(button),elapsed:reduced?staticTime:0,paused:reduced,visible:false,cycle:0};
  loop.sync=()=>{playButton(loop.button,loop.paused);loop.target.classList.toggle('motion-paused',loop.paused||!loop.visible);};
  loop.restart=()=>{loop.elapsed=0;loop.paused=false;loop.cycle=0;loop.render(0);loop.sync();};
  loop.toggle=()=>{loop.paused=!loop.paused;loop.sync();};
  loop.button.onclick=loop.toggle;loops.push(loop);animationObserver.observe(loop.target);loop.render(loop.elapsed);loop.sync();return loop;
}
let lastTime=0;
function tick(now){const dt=Math.min(80,now-lastTime||0);lastTime=now;if(!document.hidden)for(const loop of loops){if(loop.visible&&!loop.paused){const next=loop.elapsed+dt;if(next>=loop.duration)loop.cycle++;loop.elapsed=next%loop.duration;loop.render(loop.elapsed);}}requestAnimationFrame(tick);}
requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{for(const l of loops)l.target.classList.toggle('motion-paused',document.hidden||l.paused||!l.visible)});

function smoothStep(value){const x=clamp(value);return x*x*(3-2*x);}

// Both panels start empty; each chunk fades into focus before its boundary is annotated.
function heroDraw(ms){
  const progress=clamp((ms-200)/5600),fade=ms>7900?smoothStep((8500-ms)/600):1;
  const actionY=x=>114-42*Math.sin((x-42)/476*Math.PI*1.7);
  const xs=Array.from({length:8},(_,i)=>42+i*68);
  const chunks=xs.map((x,i)=>[x,actionY(x)+(i>=4?45:0)]);
  const amounts=[smoothStep((ms-200)/750),smoothStep((ms-1080)/780)];
  let left='<defs>'+amounts.map((a,i)=>`<filter id="hero-soft-${i}" x="-25%" y="-40%" width="150%" height="180%"><feGaussianBlur stdDeviation="${4.2*(1-a)}"/></filter>`).join('')+'</defs>';
  amounts.forEach((amount,i)=>{
    const points=chunks.slice(i*4,i*4+4);
    left+=`<g class="chunk-body" data-chunk="${i+1}" opacity="${amount}" filter="url(#hero-soft-${i})"><path d="${path(points)}" fill="none" stroke="${C.blue}" stroke-opacity=".11" stroke-width="32" stroke-linecap="round"/><path d="${path(points)}" fill="none" stroke="${C.blue}" stroke-width="4.5" stroke-linecap="round"/>`+label(i?365:42,31,tr('CHUNK '+(i+1),'动作块 '+(i+1)),C.blue,15);
    points.forEach(([x,y],j)=>{left+=`<circle cx="${x}" cy="${y}" r="6.5" fill="${C.blue}" stroke="#fcfcf8" stroke-width="2"/>`+label(x,y+29,'a'+(j+i*4),C.ink,17,'middle');});
    left+='</g>';
  });
  const [a,b]=chunks.slice(3,5),boundary=smoothStep((ms-2060)/450);
  left+=`<g class="boundary-indicator" opacity="${boundary}"><rect x="${a[0]-17}" y="45" width="102" height="133" rx="10" fill="${C.orange}" opacity=".08"/><path d="M${a[0]},${a[1]}L${b[0]},${b[1]}" stroke="${C.orange}" stroke-width="3" stroke-dasharray="5 5"/>${label(280,203,tr('Boundary jump','边界跳变'),C.orange,17,'middle')}</g>`;
  let right='';
  if(progress>0){const endX=42+476*progress;const count=Math.max(2,Math.ceil(progress*100));const pts=Array.from({length:count},(_,i)=>{const x=42+(endX-42)*i/(count-1);return[x,actionY(x)]});right+=`<path d="${path(pts)}" fill="none" stroke="${C.orange}" stroke-opacity=".11" stroke-width="32" stroke-linecap="round"/><path d="${path(pts)}" fill="none" stroke="${C.orange}" stroke-width="4.5" stroke-linecap="round"/>`;for(let i=0;i<=Math.floor(progress*7);i++)right+=`<circle cx="${xs[i]}" cy="${actionY(xs[i])}" r="5.5" fill="${C.orange}" stroke="#fcfcf8" stroke-width="2"/>`+label(xs[i],actionY(xs[i])+30,'a'+i,C.ink,17,'middle');right+=`<circle cx="${endX}" cy="${actionY(endX)}" r="10" fill="${C.orange}" stroke="#fcfcf8" stroke-width="3"/>`+label(42,31,tr('EVOLVE FROM THE CURRENT ACTION','从当前动作持续演化'),C.orange,15);}
  $('#chunks').innerHTML=`<g opacity="${fade}">${left}</g>`;$('#continuous').innerHTML=`<g opacity="${fade}">${right}</g>`;
}
const heroLoop=makeLoop('#idea',8500,heroDraw,'#heroPlay',7400);$('#heroReplay').onclick=heroLoop.restart;

// Reveal whole paper panels: a → b → c → complete.
let methodStage=-1;
const methodSteps=[
 tr('a · Construct the target action transition field from demonstrations.','a · 从示范构造目标动作转移场。'),
 tr('b · Learn the conditional field through direct supervision.','b · 通过直接监督，学习条件动作转移场。'),
 tr('c · Integrate recursively from the current action.','c · 从当前动作出发，递归积分生成后续动作。'),
 tr('Demonstrations → target field → learned field → evolving actions.','示范 → 目标场 → 学习场 → 连续动作演化。')
];
function methodDraw(ms){
 const stage=ms<2200?0:ms<4000?1:ms<5800?2:3;
 if(stage===methodStage)return;methodStage=stage;
 $$('.method-part').forEach((el,i)=>el.classList.toggle('pending',i>stage));
 $$('.sequence-progress i').forEach((el,i)=>el.classList.toggle('active',i<=stage));
 $('#methodStep').textContent=methodSteps[stage];$('#methodFigure').dataset.stage=stage;
}
const methodLoop=makeLoop('#methodFigure',8000,methodDraw,'#methodPlay');
$('#methodReplay').onclick=methodLoop.restart;

// A soft dark color band travels tail-to-tip over each fixed arrow stroke.
const cy=t=>142+44*Math.sin(t*2*Math.PI-.65),dy=t=>88*Math.PI*Math.cos(t*2*Math.PI-.65),cx=t=>48+660*t;
function directionalPulse(ms){
 const center=-7+32*((ms%1600)/1600);
 return {center,start:center-7,end:center+7};
}
function paintFieldPulse(svg,ms){
 const p=directionalPulse(ms),gradient=svg.querySelector('.pulse-gradient');
 gradient.setAttribute('x1',p.start);gradient.setAttribute('x2',p.end);
}
let fieldClock=1000;
function fieldBase(width=760){
 const span=width-96,gradientId='pulse-shade-'+width;let top=[],bot=[],mid=[],arrows='';
 for(let i=0;i<=100;i++){const t=i/100,x=48+span*t,y=cy(t);mid.push([x,y]);top.push([x,y-72]);bot.unshift([x,y+72]);}
 const cols=width>800?24:18;
 for(let i=0;i<cols;i++){
  const t=(i+.5)/cols;
  for(const r of [-48,0,48]){
   const vx=span,vy=dy(t)-5*r,len=Math.hypot(vx,vy),ux=vx/len,uy=vy/len;
   const x=48+span*t-ux*9,y=cy(t)+r-uy*9,angle=Math.atan2(uy,ux)*180/Math.PI;
   arrows+=`<g class="field-arrow" data-column="${i}" data-offset="${r}" transform="translate(${x} ${y}) rotate(${angle})">${arrow(0,0,18,0,'#4c7e73',1.9,4.8)}<g class="arrow-pulse">${arrow(0,0,18,0,`url(#${gradientId})`,1.9,4.8)}</g></g>`;
  }
 }
 return `<defs><linearGradient class="pulse-gradient" id="${gradientId}" gradientUnits="userSpaceOnUse" x1="-14" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#205e51" stop-opacity="0"/><stop offset=".25" stop-color="#205e51" stop-opacity=".35"/><stop offset=".5" stop-color="#205e51" stop-opacity="1"/><stop offset=".75" stop-color="#205e51" stop-opacity=".35"/><stop offset="1" stop-color="#205e51" stop-opacity="0"/></linearGradient></defs><path class="field-band" d="${path([...top,...bot])}Z" fill="#d8e6dd" stroke="#b8cfc2" stroke-width="1"/><g class="field-arrows">${arrows}</g><path d="${path(mid)}" stroke="#658d7a" stroke-width="2" fill="none" stroke-dasharray="6 6"/>`;
}
function drawField(){
  const t=+$('#position').value/100,r=+$('#offset').value,x=cx(t),y=cy(t),px=112,py=dy(t)*112/660,ry=-5*r*112/660;
  let svg=fieldBase();
  svg+=`<circle cx="${x}" cy="${y}" r="5" fill="#718c7a"/>`+label(x-13,y-12,'γ(τ)','#617c6a',18,'end');
  svg+=`<path d="M${x+px},${y+r+py}v${ry}M${x},${y+r+ry}l${px},${py}" fill="none" stroke="#849387" stroke-width="1.8" stroke-dasharray="5 5"/>`;
  svg+=arrow(x,y+r,px,py,C.blue,3.5,9,true)+arrow(x,y+r,0,ry,C.gold,3.5,9,true)+arrow(x,y+r,px,py+ry,C.orange,4.5,11,true);
  svg+=`<circle cx="${x}" cy="${y+r}" r="8" fill="#fcfcf8" stroke="${C.ink}" stroke-width="2.5"/>`+label(x-15,y+r+25,'a',C.ink,22,'end');
  $('#field').innerHTML=svg;
  const ends=[0,py,ry,py+ry],min=Math.min(...ends),max=Math.max(...ends),scale=Math.min(1.32,145/Math.max(1,max-min)),ox=40,oy=44-min*scale;
  const vx=px*scale,vy=py*scale,vr=ry*scale;
  let inset=`<path d="M${ox+vx},${oy+vy}v${vr}M${ox},${oy+vr}l${vx},${vy}" fill="none" stroke="#b4bcb2" stroke-width="1.8" stroke-dasharray="5 5"/>`;
  inset+=arrow(ox,oy,vx,vy,C.blue,3.8,10)+arrow(ox,oy,0,vr,C.gold,3.8,10)+arrow(ox,oy,vx,vy+vr,C.orange,4.8,11);
  inset+=`<circle cx="${ox}" cy="${oy}" r="6" fill="white" stroke="${C.ink}" stroke-width="2"/>`+label(ox+vx+12,oy+vy+vr+5,'F*',C.orange,23)+label(ox-12,oy+24,'a',C.ink,21,'end');
  $('#vectorSum').innerHTML=inset;
  paintFieldPulse($('#field'),fieldClock);
}
// The query tour shares the visible/paused clock with the existing directional pulse.
let fieldMode='auto',fieldTourElapsed=0,fieldLastElapsed=null,fieldResume=null;
const fieldTourKeys=[[0,22,12],[3600,65,12],[5500,65,50],[7900,65,-48],[12000,22,12]];
function fieldTourAt(ms){
  const t=((ms%12000)+12000)%12000;
  const i=fieldTourKeys.findIndex((k,j)=>j<fieldTourKeys.length-1&&t<fieldTourKeys[j+1][0]);
  const a=fieldTourKeys[i],b=fieldTourKeys[i+1],u=smoothStep((t-a[0])/(b[0]-a[0]));
  return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
}
function fieldValues(){return [+$('#position').value,+$('#offset').value];}
function syncFieldMode(){
  $('#fieldPanel').dataset.mode=fieldMode;
  $('#fieldAuto').setAttribute('aria-pressed',String(fieldMode==='auto'));
  $('#fieldManual').setAttribute('aria-pressed',String(fieldMode==='manual'));
}
function renderFieldFrame(ms){
  const dt=fieldLastElapsed===null?0:(ms-fieldLastElapsed+48000)%48000;
  fieldLastElapsed=ms;fieldClock=ms;
  if(fieldMode==='auto'){
    fieldTourElapsed=(fieldTourElapsed+dt)%12000;
    let values=fieldTourAt(fieldTourElapsed);
    if(fieldResume){
      fieldResume.elapsed+=dt;
      const u=smoothStep(fieldResume.elapsed/850);
      values=values.map((v,i)=>fieldResume.from[i]+(v-fieldResume.from[i])*u);
      if(u===1)fieldResume=null;
    }
    $('#position').value=values[0];$('#offset').value=values[1];drawField();
  }else paintFieldPulse($('#field'),ms);
}
function enterManual(){fieldMode='manual';fieldResume=null;syncFieldMode();}
for(const id of ['position','offset']){
  $('#'+id).addEventListener('pointerdown',enterManual);
  $('#'+id).addEventListener('input',()=>{enterManual();drawField();});
}
$('#fieldManual').onclick=enterManual;
$('#fieldAuto').onclick=()=>{
  if(fieldMode!=='auto')fieldResume={from:fieldValues(),elapsed:0};
  fieldMode='auto';fieldLoop.paused=false;fieldLoop.sync();syncFieldMode();
};
drawField();syncFieldMode();
// 48 seconds is a common multiple of the 12-second tour and 1.6-second arrow pulse.
const fieldLoop=makeLoop('#fieldPanel',48000,renderFieldFrame,'#fieldPlay',0);

const rolloutPoints=[[48,cy(0)+48]];
for(let n=0;n<40;n++){const t=n/40,[x,y]=rolloutPoints[n];rolloutPoints.push([x+(904+5*(48+904*t-x))/40,y+(dy(t)+5*(cy(t)-y))/40]);}
$('#rollout').innerHTML=fieldBase(1000)+'<g id="rollTrace"></g>';
function drawRoll(n){n=clamp(n,0,40);const full=Math.floor(n),fraction=n-full;const ps=rolloutPoints.slice(0,full+1);if(full<40&&fraction>0){const p=rolloutPoints[full],q=rolloutPoints[full+1];ps.push([p[0]+fraction*(q[0]-p[0]),p[1]+fraction*(q[1]-p[1])]);}let svg=`<path d="${path(ps)}" fill="none" stroke="#fcfcf8" stroke-width="11" stroke-linecap="round"/><path d="${path(ps)}" fill="none" stroke="${C.orange}" stroke-width="4.5" stroke-linecap="round"/>`;ps.slice(0,-1).forEach((p,i)=>{if(i%2===0)svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.8" fill="${C.orange}"/>`;});const [x,y]=ps[ps.length-1];svg+=`<circle cx="${x}" cy="${y}" r="10" fill="${C.orange}" stroke="white" stroke-width="3"/>`+label(Math.min(950,x+18),y-19,'a'+full,C.orange,21,x>900?'end':'start');$('#rollTrace').innerHTML=svg;$('#rollTime').value=full;$('#rollCount').textContent=`${full} / 40`;}
const rollLoop=makeLoop('#rollPanel',9600,ms=>{drawRoll(clamp((ms-400)/5800)*40);paintFieldPulse($('#rollout'),ms)},'#rollPlay',7400);
$('#rollReset').onclick=rollLoop.restart;
$('#rollTime').oninput=()=>{const n=+$('#rollTime').value;rollLoop.paused=true;rollLoop.elapsed=400+n/40*5800;rollLoop.sync();drawRoll(n);};

const datasets={real:{intro:'Four everyday tasks on the AgileX Cobot Magic platform.',names:['Base','RTC','Legato','ODEAction'],colors:[C.blue,'#86acc5','#9aabb5',C.orange],sr:[65,63.75,66.25,80],range:[60,85],quality:[[25.18,24.64,24.57,23.52],[2.535,2.493,2.483,2.431],[3.01,2.72,2.66,1.81],[.142,.1367,.1363,.131]],ranges:[[23,25.6],[2.4,2.56],[1.6,3.2],[.128,.144]],source:'Figure 4 · Four-task averages'},ebench:{intro:'Fine manipulation across six EBench tasks.',names:['Base','ODEAction'],colors:[C.blue,C.orange],sr:[15.28,24.72],range:[0,30],quality:[[27.16,25.51],[2.128,2.023],[1.43,.30],[.01705,.01487]],ranges:[[24,28],[2,2.16],[0,1.6],[.014,.018]],source:'Table 1 · EBench averages'},libero:{intro:'Tabletop manipulation across all four LIBERO suites.',names:['Base','ODEAction'],colors:[C.blue,C.orange],sr:[96.85,98.25],range:[94,100],quality:[[26.80,25.52],[2.134,1.999],[1.22,.44],[.04552,.04483]],ranges:[[25,27.5],[1.95,2.2],[0,1.4],[.044,.046]],source:'Table 1 · LIBERO averages'},robotwin:{intro:'Bimanual manipulation across 50 RoboTwin tasks.',names:['Base','ODEAction'],colors:[C.blue,C.orange],sr:[87.3,89.8],range:[80,95],quality:[[25.96,23.89],[2.298,2.159],[1.145,.635],[.112,.08710]],ranges:[[23,27],[2.1,2.35],[0,1.3],[.08,.12]],source:'Table 2 & Section 3.3 · Random-setting success rates; reported trajectory averages'}};

const metricNames=['NLDLJ','NSPARC','EE-MAJ (×10⁻³)',tr('Boundary Jump','边界跳变')];
// Small multiples: one success-rate chart and all four trajectory metrics per benchmark.
function bars(values,names,colors,range,unit=''){
  const narrow=matchMedia('(max-width:760px)').matches;
  const W=260,H=narrow?192:236,L=46,R=12,T=29,B=33,[min,max]=range,y=v=>H-B-(v-min)/(max-min)*(H-T-B);
  const raw=(max-min)/4,power=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(v=>v*power).sort((a,b)=>Math.abs(a-raw)-Math.abs(b-raw))[0];
  const ticks=[min];for(let v=Math.ceil((min+step*.01)/step)*step;v<max-step*.55;v+=step){if(v>min+step*.55)ticks.push(v);}ticks.push(max);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${names.map((n,i)=>n+': '+values[i]+unit).join('; ')}">`;
  for(const v of ticks)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#dce2df"/>`+label(L-7,y(v)+4,+v.toFixed(max<1?4:2),'#68746d',narrow?12:13,'end');
  const gap=(W-L-R)/names.length,bw=Math.min(46,gap*.57);
  values.forEach((v,i)=>{const x=L+gap*(i+.5);svg+=`<rect x="${x-bw/2}" y="${y(v)}" width="${bw}" height="${y(min)-y(v)}" fill="${colors[i]}" rx="1.5"/>`+label(x,y(v)-8,v,colors[i],names.length>2?16:17,'middle')+label(x,H-12,names[i],'#4c5750',names.length>2?14:15,'middle');});
  if(min>0)svg+=`<path d="M${L-5},${H-B+4}l10,-5m-10,10l10,-5" stroke="#647168" stroke-width="1.2"/>`;
  return svg+'</svg>';
}
datasets.continuation={names:['Base','RTC','Legato','ODEAction'],colors:[C.blue,'#86acc5','#9aabb5',C.orange],sr:[82.4,81.2,78.0,84.4],range:[75,86],quality:[[25.37,24.85,24.75,22.96],[2.230,2.235,2.233,2.096],[1.080,.926,.857,.533],[.1165,.1025,.1022,.0847]],ranges:[[22,26],[2.05,2.26],[.4,1.2],[.08,.12]]};
const resultCopy={
 libero:{title:'LIBERO',tag:'π₀.₅ · Spatial / Object / Goal / Long',description:tr('Across all four LIBERO suites, ODEAction improves task success and all four trajectory-quality metrics. Higher completion rates are accompanied by smoother motion and smaller boundary jumps.','在 LIBERO 全部四组任务上，ODEAction 的任务成功率与四项轨迹质量指标均得到改善。更高的任务完成率伴随着更平滑的运动和更小的边界跳变。'),source:tr('Table 1 · Four-suite averages','表 1 · 四组任务平均结果')},
 ebench:{title:'EBench',tag:tr('π₀.₅ · Six fine-manipulation tasks','π₀.₅ · 六项精细操作任务'),description:tr('On EBench, which emphasizes fine manipulation, average success improves by 61.8% relative to the base policy. The generated motion also has lower jerk and smaller boundary jumps, improving trajectory quality alongside task performance.','在侧重精细操作的 EBench 上，平均成功率相对基线策略提升了 61.8%。生成动作的 jerk 与边界跳变也同时降低，轨迹质量与任务表现共同改善。'),source:tr('Table 1 · Six-task averages','表 1 · 六项任务平均结果')},
 robotwin:{title:'RoboTwin',tag:tr('StarVLA-OFT · 50 bimanual tasks','StarVLA-OFT · 50 项双臂操作任务'),description:tr('Across 50 RoboTwin tasks, success improves in both Clean and Random settings, together with all four trajectory-quality metrics. The gains extend beyond the original backbone and task setting.','在 RoboTwin 的 50 项任务上，Clean 与 Random 设置下的成功率均得到提升，四项轨迹质量指标也共同改善。这些收益延续到了不同的骨干与任务场景。'),source:tr('Table 2 & Section 3.3 · 50-task evaluation','表 2 与第 3.3 节 · 50 项任务评测')},
 continuation:{title:tr('Action-chunk continuation comparison','动作块续接比较'),tag:'StarVLA-π · RoboTwin',description:'',source:tr('Table 3 · Average results','表 3 · 平均结果')},
 real:{title:tr('Real-robot results','真机实验结果'),tag:'π₀.₅ · AgileX Cobot Magic 1.0',description:'',source:tr('Figure 4 · Table S2 · Four-task averages','图 4 · 表 S2 · 四项任务平均结果')}
};
function cropImage(src,viewBox,width,height,alt){return `<svg viewBox="${viewBox}" role="img" aria-label="${alt}" preserveAspectRatio="xMidYMid slice"><image href="assets/${src}" width="${width}" height="${height}"/></svg>`;}
function taskStrip(bench){
  let items=[],credit='';
  if(bench==='real'){
    const taskNames=[tr('Put Bananas','放置香蕉'),tr('Open Drawer','打开抽屉'),tr('Place Cup','放置水杯'),tr('Insert Spoon','插入勺子')],xs=[688,961,1230,1501],widths=[267,260,262,264],scores=['70 → 75%','95 → 100%','70 → 90%','25 → 55%'];
    items=taskNames.map((name,i)=>`<div class="task-thumb">${cropImage('figure4.png',`${xs[i]} 115 ${widths[i]} 214`,1800,690,name)}<span>${name}<b>${scores[i]}</b></span></div>`);
    credit=tr('Real-world tasks · Success rate: Base → ODEAction','真机任务 · 成功率：基线 → ODEAction');
  }else if(bench==='ebench'){
    const names=['Gear','Frame','Nut','Flip Cup'],files=['install_gear','frame_against_pen_holder','tighten_nut','flip-cup'];
    items=names.map((name,i)=>`<div class="task-thumb"><img src="assets/benchmarks/ebench-${files[i]}.png" alt="${name}" width="640" height="480" loading="lazy"><span>${name}</span></div>`);
    credit=`${tr('Benchmark task examples','基准任务示例')} · <a href="https://internrobotics.github.io/EBench-Astra-Tech-Report/">EBench ↗</a>`;
  }else if(bench==='libero'){
    const views=['140 365 382 281','90 859 380 284','3158 275 359 269','3571 743 307 236'];
    items=views.map((view,i)=>`<div class="task-thumb">${cropImage('benchmarks/libero.png',view,4400,2400,`LIBERO ${tr('task example','任务示例')} ${i+1}`)}</div>`);
    credit=`${tr('Benchmark task examples','基准任务示例')} · <a href="https://github.com/Lifelong-Robot-Learning/LIBERO">LIBERO ↗</a>`;
  }else{
    const views=['108 1281 550 442','848 1281 550 442','1587 1281 550 442','2327 1281 550 442'];
    items=views.map((view,i)=>`<div class="task-thumb">${cropImage('benchmarks/robotwin-cross-embodiment.png',view,3694,1810,`RoboTwin ${tr('task example','任务示例')} ${i+1}`)}</div>`);
    credit=`${tr('Benchmark task examples','基准任务示例')} · <a href="https://robotwin-platform.github.io/">RoboTwin ↗</a>`;
  }
  return `<div class="task-ribbon">${items.join('')}</div><p class="media-credit">${credit}</p>`;
}
function robotwinSuccess(){
 const values=[85.7,89.4,87.3,89.8],names=[tr('Base','基线'),'ODE',tr('Base','基线'),'ODE'];
 let svg=bars(values,names,[C.blue,C.orange,C.blue,C.orange],[80,95],'%');
 const h=matchMedia('(max-width:760px)').matches?192:236;
 svg=svg.replace(`0 0 260 ${h}`,`0 0 260 ${h+25}`).replace('</svg>',label(96,h+12,'Clean','#626963',14,'middle')+label(197,h+12,'Random','#626963',14,'middle')+'</svg>');return svg;
}
function drawResults(){
 $$('.result-slot').forEach(slot=>{
  const key=slot.dataset.result,d=datasets[key],copy=resultCopy[key];
  const names=d.names.map(n=>n==='Base'?tr('Base','基线'):n==='ODEAction'?'ODE':n);
  const legend=d.names.map((n,i)=>`<span><i style="background:${d.colors[i]}"></i>${n==='Base'?tr('Base policy','基线策略'):n}</span>`).join('');
  slot.innerHTML=`<div class="benchmark" id="result-${key}" data-benchmark="${key}"><div class="benchmark-heading"><h4>${copy.title}</h4><span class="benchmark-tag">${copy.tag}</span></div>${copy.description?`<p class="benchmark-description">${copy.description}</p>`:''}${key==='continuation'?'':taskStrip(key)}<div class="legend chart-legend">${legend}</div><div class="result-plots"><div class="success-group"><h4>${tr('Success rate','成功率')} ↑</h4><p class="chart-unit">SR (%)</p>${key==='robotwin'?robotwinSuccess():bars(d.sr,names,d.colors,d.range,'%')}</div><div class="quality-group"><h4>${tr('Trajectory quality','轨迹质量')}</h4><div class="quality-grid">${d.quality.map((values,i)=>`<div class="metric-chart"><h5>${metricNames[i]} ↓</h5>${bars(values,names,d.colors,d.ranges[i])}</div>`).join('')}</div></div></div><p class="chart-source">${copy.source}</p></div>`;
 });
}
// BDR values and displayed success rates are from Table 1; gains use percentage points.
const bdrData=[
 ['Frame',25.00,30.0,48.3],['Coffee',17.26,5.0,13.3],['Nut',16.10,11.7,23.3],['Flip Cup',9.50,5.0,10.0],['Gear',7.14,15.0,23.3],['Glass',6.53,25.0,30.0],['Long',2.92,92.4,95.1],['Object',1.51,98.2,99.8],['Spatial',.72,98.8,99.3],['Goal',.66,98.0,98.8]
];
function bdrBars(which){
 const W=530,H=420,L=104,R=44,T=35,B=33,max=which===0?30:20,color=which===0?C.blue:C.orange;
 const x=v=>L+v/max*(W-L-R);let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('BDR and success-rate gain across ten evaluation units','十个评测单元的 BDR 与成功率增益')}">`;
 for(let v=0;v<=max;v+=which===0?10:5)svg+=`<line x1="${x(v)}" x2="${x(v)}" y1="${T-10}" y2="${H-B}" stroke="#dadfd5"/>`+label(x(v),H-8,v,'#626963',15,'middle');
 bdrData.forEach((row,i)=>{const y=T+i*34,value=which===0?row[1]:+(row[3]-row[2]).toFixed(1);svg+=label(L-12,y+15,row[0],C.ink,17,'end')+`<rect x="${L}" y="${y}" width="${x(value)-L}" height="21" fill="${color}"/>`+label(x(value)+7,y+15,value,color,15);if(i===5)svg+=`<line x1="12" x2="${W-12}" y1="${y+28}" y2="${y+28}" stroke="#d7dad2" stroke-dasharray="3 5"/>`;});return svg+'</svg>';
}
function drawEvidence(){
 $('#bdrChart').innerHTML=`<div class="bdr-grid"><div><h4>${tr('(a) Boundary discontinuity reduction','(a) 边界不连续性降低')} · BDR (%)</h4>${bdrBars(0)}</div><div><h4>${tr('(b) Success-rate gain','(b) 成功率增益')} · ΔSR (pp)</h4>${bdrBars(1)}</div></div>`;
 let chart='<svg viewBox="0 0 530 190" role="img" aria-label="'+tr('Ablation success rates: without neighborhood 47.4%, without correction 56.2%, ODEAction 84.4%','消融成功率：无邻域监督 47.4%，无校正项 56.2%，ODEAction 84.4%')+'">';
 const values=[47.4,56.2,84.4],names=[tr('Without neighborhood','无邻域监督'),tr('Without correction','无校正项'),'ODEAction'];
 for(let v=0;v<=100;v+=25){const x=190+2.8*v;chart+=`<line x1="${x}" x2="${x}" y1="16" y2="154" stroke="#d7ded3"/>`+label(x,180,v,'#626963',14,'middle');}
 values.forEach((v,i)=>{const y=25+i*46,col=i===2?C.orange:i===0?C.blue:'#93a7a1';chart+=label(178,y+17,names[i],C.ink,17,'end')+`<rect x="190" y="${y}" width="${v*2.8}" height="25" fill="${col}"/>`+label(198+v*2.8,y+17,v+'%',col,17);});
 $('#ablationChart').innerHTML=chart+'</svg>';
}
drawResults();drawEvidence();
matchMedia('(max-width:760px)').addEventListener('change',()=>{drawResults();drawEvidence()});

// Mechanism illustration: equal displacement at equal evolution time in all three panels.
const abX=t=>25+310*t,abY=t=>112+32*Math.sin(t*Math.PI*1.7-.65),abDY=t=>32*Math.PI*1.7*Math.cos(t*Math.PI*1.7-.65);
const abShock=.34;
function abOffset(t,mode){
 if(t<abShock)return 0;
 const u=(t-abShock)/(1-abShock);
 return mode===0?44+80*u*u:mode===1?44:44*Math.exp(-6*(t-abShock));
}
function abPoint(t,mode){
 return [abX(t),abY(t)+abOffset(t,mode)];
}
function abFace(x,y,happy,opacity,color){
 const eyes=happy?'<path d="M-6 -2q2 -3 4 0M2 -2q2 -3 4 0"/>':'<path d="M-6 -3l4 1M2 -2l4 -1"/>';
 const mouth=happy?'<path d="M-5 3q5 7 10 0"/>':'<path d="M-5 6q5 -6 10 0"/>';
 const tear=happy?'':'<path d="M7 0C6 3 5 4 6 6C7 8 10 7 10 5C10 3 8 2 7 0Z" fill="#7cacc2" stroke="none"/>';
 return `<g class="ab-face" data-expression="${happy?'happy':'crying'}" aria-hidden="true" transform="translate(${x} ${y-26})" opacity="${opacity}"><circle r="13" fill="${happy?'#fff4dd':'#f0f5f6'}" stroke="${color}" stroke-width="1.8"/><g fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round">${eyes}${mouth}</g>${tear}</g>`;
}
function abBackground(mode){
 const mid=[],top=[],bottom=[];for(let i=0;i<=80;i++){const t=i/80,x=abX(t),y=abY(t);mid.push([x,y]);top.push([x,y-57]);bottom.unshift([x,y+57]);}
 let svg=mode?`<path d="${path([...top,...bottom])}Z" fill="#e9eee6"/>`:'';
 for(let i=0;i<11;i++){const t=(i+.5)/11;for(const r of mode?[-36,0,36]:[0]){const vx=310,vy=abDY(t)-(mode===2?6*r:0),len=Math.hypot(vx,vy);svg+=arrow(abX(t)-vx/len*6,abY(t)+r-vy/len*6,vx/len*13,vy/len*13,mode?'#a9bdb3':'#91a998',1.5,4);}}
 return svg+`<path d="${path(mid)}" stroke="#879b8d" stroke-width="1.6" fill="none" stroke-dasharray="5 5"/>`;
}
for(let i=0;i<3;i++)$('#ablation-'+i).innerHTML=`<defs><clipPath id="ab-clip-${i}"><rect width="360" height="211"/></clipPath></defs>`+abBackground(i)+`<g class="ab-trace" clip-path="url(#ab-clip-${i})"></g><g class="ab-state"></g>`;
function drawAblation(ms){
 const progress=clamp((ms-450)/7350),fade=ms>10100?clamp((11000-ms)/900):1;
 $('#ablationStage').textContent=progress<abShock?tr('Learning on and around the demonstration','学习示范及其邻域中的演化'):progress<.44?tr('Neighborhood supervision and correction','邻域监督与校正'):tr('Their roles in action evolution','两项设计在动作演化中的作用');
 for(let mode=0;mode<3;mode++){
  const before=[],after=[];const count=Math.max(2,Math.ceil(progress*90));
  for(let i=0;i<=count;i++){const t=progress*i/count;const point=abPoint(t,mode);(t<abShock?before:after).push(point);}
  const col=mode===2?C.orange:mode===0?C.blue:'#718e84';
  let svg=`<path d="${path(before)}" stroke="${col}" stroke-width="3.4" fill="none"/>`;
  if(progress>=abShock){const x=abX(abShock),y=abY(abShock);svg+=arrow(x,y,0,44,C.gold,2,6)+`<path d="${path([[x,y+44],...after])}" stroke="${col}" stroke-width="3.4" fill="none" ${mode===0?'stroke-dasharray="5 5" opacity=".65"':''}/>`;}
  const [x,y]=abPoint(progress,mode);
  svg+=`<circle cx="${x}" cy="${y}" r="6.5" fill="${col}" stroke="var(--bg)" stroke-width="2"/>`;
  if(mode===2&&progress>=abShock&&progress<.85)svg+=arrow(x,y,0,-abOffset(progress,mode)*.8,C.gold,2.2,5,true);
  const expressionTime=mode===2?abShock+Math.log(44/4)/6:.58;
  if(progress>expressionTime)svg+=abFace(x,y,mode===2,clamp((progress-expressionTime)/.05),col);
  const state=progress<abShock?tr('On the path','沿路径推进'):mode===0?tr('Beyond path-only supervision','离开路径监督范围'):mode===1?tr('Offset persists','偏移持续存在'):tr('Recovering toward the path','逐步回到路径附近');
  $('#ablation-'+mode+' .ab-state').innerHTML=label(180,232,state,col,16,'middle');const trace=$('#ablation-'+mode+' .ab-trace');trace.innerHTML=svg;trace.setAttribute('opacity',fade);
 }
}
const ablationLoop=makeLoop('#ablationFigure',11000,drawAblation,'#ablationPlay',9200);
$('#ablationReplay').onclick=ablationLoop.restart;

const paperMetadata={"created_at": "2026-11-09T15:02:54.174059+08:00", "title": "ODEAction: From Predicting Chunks to Evolving Actions", "source": "sources/company_report/", "abstract": "content/abstract.txt", "metadata": "sources/company_report/metadata.tex", "authors": [{"name": "Qishen Wang", "affiliations": [1, 2], "role": null}, {"name": "Pengxiang Ding", "affiliations": [1, 3, 4], "role": "Project Lead"}, {"name": "Shifeng Bao", "affiliations": [5], "role": null}, {"name": "Mingyang Sun", "affiliations": [1, 3, 4], "role": null}, {"name": "Hengtao Li", "affiliations": [1], "role": null}, {"name": "Yi Gao", "affiliations": [1], "role": null}, {"name": "Baohua Yin", "affiliations": [1], "role": null}, {"name": "Yang Liu", "affiliations": [4], "role": null}, {"name": "Jiajun Fu", "affiliations": [1, 6], "role": null}, {"name": "Jiacheng Liu", "affiliations": [1, 3, 4], "role": null}, {"name": "Changjing He", "affiliations": [1, 6], "role": null}, {"name": "Peiyang Li", "affiliations": [1, 7], "role": null}, {"name": "Runze Suo", "affiliations": [8], "role": null}, {"name": "Yan Wang", "affiliations": [6], "role": null}, {"name": "Xiaobo Wang", "affiliations": [9], "role": null}, {"name": "Yonghao Dang", "affiliations": [10], "role": null}, {"name": "Cheng Chi", "affiliations": [5], "role": "Corresponding Author"}], "affiliations": [{"id": 1, "name": "Symbiosis Robotics"}, {"id": 2, "name": "University of Science and Technology of China"}, {"id": 3, "name": "Zhejiang University"}, {"id": 4, "name": "Westlake University"}, {"id": 5, "name": "Renmin University of China"}, {"id": 6, "name": "Tsinghua University"}, {"id": 7, "name": "Beijing University of Posts and Telecommunications"}, {"id": 8, "name": "Fudan University"}, {"id": 9, "name": "Shenzhen University of Advanced Technology"}, {"id": 10, "name": "Central University of Finance and Economics"}], "main_sections": [{"name": "Abstract", "source": "sources/company_report/sections/00_abstract.tex"}, {"name": "Introduction", "source": "sources/company_report/sections/01_introduction.tex"}, {"name": "Method", "source": "sources/company_report/sections/03_method.tex"}, {"name": "Experiments", "source": "sources/company_report/sections/04_experiments.tex"}, {"name": "Related Work", "source": "sources/company_report/sections/02_related_work.tex"}, {"name": "Conclusion", "source": "sources/company_report/sections/05_conclusion.tex"}], "main_tables": ["sources/company_report/tables/table1_main_results.tex", "sources/company_report/tables/table2_generality.tex", "sources/company_report/tables/table3_continuation.tex", "sources/company_report/tables/table4_ablation.tex"], "appendix_sections": ["sources/company_report/appendix/sections/a_implementation.tex", "sources/company_report/appendix/sections/b_protocols.tex", "sources/company_report/appendix/sections/c_metrics.tex", "sources/company_report/appendix/sections/d_statistics.tex", "sources/company_report/appendix/sections/e_per_task_results.tex", "sources/company_report/appendix/sections/f_direct_next_action.tex", "sources/company_report/appendix/sections/g_recursive_behavior.tex"], "bibliography": "sources/company_report/references.bib", "results": [{"label": "LIBERO mean SR", "base": "96.85%", "odeaction": "98.25%", "absolute_gain": "1.40 pp", "source": "sources/company_report/tables/table1_main_results.tex"}, {"label": "EBench mean SR", "base": "15.28%", "odeaction": "24.72%", "absolute_gain": "9.44 pp", "reported_relative_gain": "61.8%", "source": "sources/company_report/sections/04_experiments.tex"}, {"label": "RoboTwin 50-task SR Clean/Random", "base": "85.7% / 87.3%", "odeaction": "89.4% / 89.8%", "source": "sources/company_report/tables/table2_generality.tex"}, {"label": "Real-robot mean SR", "base": "65.00%", "rtc": "63.75%", "legato": "66.25%", "odeaction": "80.00%", "absolute_gain_vs_base": "15.00 pp", "source": "sources/company_report/sections/04_experiments.tex"}], "unconfirmed_links": {"project_website": null, "arxiv_abstract": null, "public_code": null, "video": null}, "note": "Results transcribed from approved source strings; no statistics recomputed. No public project/code/arXiv link inferred."};
$('#authorList').innerHTML=paperMetadata.authors.map(a=>`<span>${a.name}<sup>${a.affiliations.join(',')}${a.role==='Project Lead'?'‡':a.role==='Corresponding Author'?'*':''}</sup></span>`).join(', ');
$('#affiliationList').innerHTML=paperMetadata.affiliations.map(a=>`<p>${a.id}. ${a.name}</p>`).join('');
const citation="@misc{wang2026odeactionpredictingchunksevolving,\n      title={ODEAction: From Predicting Chunks to Evolving Actions},\n      author={Qishen Wang and Pengxiang Ding and Shifeng Bao and Mingyang Sun and Hengtao Li and Yi Gao and Baohua Yin and Yang Liu and Jiajun Fu and Jiacheng Liu and Changjing He and Peiyang Li and Runze Suo and Yan Wang and Xiaobo Wang and Yonghao Dang and Cheng Chi},\n      year={2026},\n      eprint={2611.09672},\n      archivePrefix={arXiv},\n      primaryClass={cs.RO},\n      url={https://arxiv.org/abs/2611.09672},\n}";
$('#citation').textContent=citation;$('#copyCitation').onclick=async()=>{try{await navigator.clipboard.writeText(citation);$('#copyCitation').textContent=tr('Copied','已复制');}catch{$('#copyCitation').textContent=tr('Select citation to copy','选中引用文字以复制');getSelection().selectAllChildren($('#citation'))}};


$$('[data-zoom]').forEach(button=>button.onclick=()=>{const img=$('#figureDialog img');img.src='assets/'+button.dataset.zoom;img.alt=button.closest('figure').querySelector('img,svg[role="img"]').getAttribute('alt')||button.closest('figure').querySelector('svg[role="img"]').getAttribute('aria-label');$('#figureDialog').showModal();});
$('#closeFigure').onclick=()=>$('#figureDialog').close();
$('#figureDialog').addEventListener('click',event=>{if(event.target===$('#figureDialog'))$('#figureDialog').close()});

function focusFigureCaption(hash){
 if(!hash)return;const target=document.getElementById(hash.slice(1));if(!target||!target.matches('.paper-caption'))return;
 const figure=target.closest('figure');figure.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 target.classList.remove('reference-highlight');void target.offsetWidth;target.classList.add('reference-highlight');
}
$$('.figure-ref').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();history.pushState(null,'',link.hash);window.dispatchEvent(new Event('hashchange'));}));
window.addEventListener('hashchange',()=>focusFigureCaption(location.hash));
if(location.hash)requestAnimationFrame(()=>focusFigureCaption(location.hash));
