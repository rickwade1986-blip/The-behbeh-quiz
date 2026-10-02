(()=>{
'use strict';
const root=document.getElementById('app');
const A=window.REBORN_ASSETS||{};
const Q=(window.REBORN_CONTENT&&window.REBORN_CONTENT.questions)||[];
const qs=new URLSearchParams(location.search);
const incomingSeed=qs.get('seed');
const incomingMode=qs.get('mode');
const incomingFrom=qs.get('from');
const incomingScore=Number(qs.get('score')||0)||null;
const savedPlayer=localStorage.getItem('reborn-player')||'Rick';
const state={player:savedPlayer,mode:'home',seed:'',rand:Math.random,events:[],i:0,score:0,correct:0,streak:0,best:0,gamePoints:0,calls:[],multiplier:1,started:0,gameResults:[]};

const $=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function clear(){root.innerHTML='';window.scrollTo(0,0)}
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hash(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,r=Math.random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function vibrate(p){try{navigator.vibrate&&navigator.vibrate(p)}catch{}}
function todaySeed(){const d=new Date();return `daily-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function topbar(label){const f=$('div');const t=$('div','topbar');const exit=$('button','', 'EXIT');exit.onclick=renderHome;const m=$('div','mode',esc(label));const sc=$('div','score',state.score.toLocaleString());t.append(exit,m,sc);f.append(t);const pr=$('div','progress');const i=$('i');i.style.width=(state.events.length?state.i/state.events.length*100:0)+'%';pr.append(i);f.append(pr);return f}
function setPlayer(p){state.player=p;localStorage.setItem('reborn-player',p);renderHome()}
function modeName(){if(state.mode==='episode')return 'EPISODE';if(state.mode==='quiz')return 'QUIZ';if(state.mode==='games')return 'SIDE QUESTS';if(state.mode==='head')return 'HEAD TO HEAD';return state.mode.toUpperCase()}

function renderHome(){
 clear();state.mode='home';const s=$('main','screen');
 const hero=$('section','hero');const im=$('img');im.src=A.hero;hero.append(im);
 const copy=$('div','heroCopy');copy.innerHTML='<div class="eyebrow">RICK + LAURA</div><h1>SIDE <span>QUESTS</span></h1><p>A little gameshow built out of the things you actually like.</p>';hero.append(copy);
 hero.append($('div','heroStamp','MUSIC / WEIRD SHIT / FILMS / BAD PLANS'));
 s.append(hero);
 const players=$('div','playerRow');['Rick','Laura'].forEach(p=>{const b=$('button',state.player===p?'on':'',`I'M ${p.toUpperCase()}`);b.onclick=()=>setPlayer(p);players.append(b)});s.append(players);
 if(incomingSeed){const n=$('button','modeCard primary');n.innerHTML=`<b>${esc(incomingFrom||'THE OTHER ONE')} SENT A RUN</b><span>Same questions, same games. Their score stays hidden until the end.</span>`;n.onclick=()=>launchIncoming();s.append(n)}
 const head=$('div','sectionHead');head.innerHTML='<h2>START HERE</h2><span>Pick a mood. They are deliberately different.</span>';s.append(head);
 const grid=$('div','modeGrid');
 const modes=[
  ['primary','TONIGHT','A proper mixed episode: questions, calls, games and cameos.',()=>startEpisode()],
  ['','QUIZ ONLY','Twelve good questions. No games. No nonsense.',()=>startQuiz()],
  ['games','SIDE QUESTS','Four actual skill games. Score attack.',()=>startGames()],
  ['head','HEAD TO HEAD','Opinion calls and predictions. Best when you both play.',()=>startHead()]
 ];
 modes.forEach(([c,n,d,fn])=>{const b=$('button','modeCard '+c,`<b>${n}</b><span>${d}</span>`);b.onclick=fn;grid.append(b)});s.append(grid);
 const ch=$('div','sectionHead');ch.innerHTML='<h2>RABBIT HOLES</h2><span>Questions shaped around the stuff you both actually talk about.</span>';s.append(ch);
 const strip=$('div','categoryStrip');['MUSIC','FILM + ACTING','BRAIN + BODY','WEIRD + DARK','FOOD + COFFEE','TRAVEL + FESTIVALS','OUR WORLD'].forEach(cat=>{const b=$('button','cat',cat);b.onclick=()=>startQuiz(cat);strip.append(b)});s.append(strip);
 s.append($('div','homeFooter','LATE NIGHTS · BAD PLANS · GOOD MUSIC · SAME TWO IDIOTS'));
 root.append(s)
}

function reset(mode,seed){state.mode=mode;state.seed=seed||`${mode}-${Date.now().toString(36)}`;state.rand=rng(state.seed);state.events=[];state.i=0;state.score=0;state.correct=0;state.streak=0;state.best=0;state.gamePoints=0;state.calls=[];state.multiplier=1;state.started=Date.now();state.gameResults=[]}
function normalQuestions(cat){return Q.filter(q=>q.cat!=='CALL'&&(!cat||q.cat===cat))}
function pickQuestions(n,cat){const pool=shuffle(normalQuestions(cat),state.rand);return pool.slice(0,Math.min(n,pool.length))}
function callQuestions(n){return shuffle(Q.filter(q=>q.type==='call'),state.rand).slice(0,n)}
function startQuiz(cat=null,seed=null){reset('quiz',seed);state.events=pickQuestions(12,cat).map(q=>({kind:'q',q}));renderEvent()}
function startHead(seed=null){reset('head',seed);const calls=callQuestions(8);const qs=pickQuestions(4,'OUR WORLD');state.events=shuffle([...calls.map(q=>({kind:'q',q})),...qs.map(q=>({kind:'q',q}))],state.rand);renderEvent()}
function startGames(seed=null){reset('games',seed);state.events=shuffle(['beat','pour','m6','pack'],state.rand).map(id=>({kind:'game',id}));renderEvent()}
function startEpisode(seed=null){
 reset('episode',seed);const q=pickQuestions(7);const calls=callQuestions(2);const games=shuffle(['beat','pour','m6','pack'],state.rand).slice(0,2);const cameo=['dad','denise','fats'][Math.floor(state.rand()*3)];
 state.events=[{kind:'q',q:q[0]},{kind:'q',q:q[1]},{kind:'game',id:games[0]},{kind:'q',q:calls[0]},{kind:'q',q:q[2]},{kind:'interrupt',id:cameo},{kind:'q',q:q[3]},{kind:'q',q:q[4]},{kind:'game',id:games[1]},{kind:'q',q:calls[1]},{kind:'q',q:q[5]},{kind:'q',q:q[6]}];renderEvent()
}
function launchIncoming(){if(incomingMode==='games')return startGames(incomingSeed);if(incomingMode==='head')return startHead(incomingSeed);if(incomingMode==='quiz')return startQuiz(null,incomingSeed);return startEpisode(incomingSeed)}
function renderEvent(){if(state.i>=state.events.length)return renderResults();const e=state.events[state.i];if(e.kind==='q')return renderQuestion(e.q);if(e.kind==='game')return runGame(e.id);if(e.kind==='interrupt')return renderInterrupt(e.id)}
function award(base){const pts=Math.round(base*state.multiplier);state.score+=pts;state.multiplier=1;return pts}
function continueBtn(parent){const b=$('button','next','NEXT');b.onclick=()=>{state.i++;renderEvent()};parent.append(b)}

function renderQuestion(q){
 clear();const s=$('main','screen');s.append(topbar(q.cat==='CALL'?'YOUR CALL':q.cat));const wrap=$('div','qWrap');
 const card=$('section','qCard');card.innerHTML=`<div class="qCat">${esc(q.cat)}</div><h1>${esc(q.q)}</h1>`;wrap.append(card);
 if(q.type==='estimate') renderEstimate(q,wrap,s);
 else if(q.type==='order') renderOrder(q,wrap,s);
 else if(q.type==='call') renderCall(q,wrap,s);
 else renderChoice(q,wrap,s);
 s.append(wrap);root.append(s)
}
function renderChoice(q,wrap,s){const grid=$('div','answerGrid');let locked=false;(q.o||[]).forEach((o,i)=>{const b=$('button','answer',`<i>${String.fromCharCode(65+i)}</i><span>${esc(o)}</span>`);b.onclick=()=>{if(locked)return;locked=true;const ok=i===q.a;[...grid.children].forEach((x,j)=>{x.disabled=true;if(j===q.a)x.classList.add('correct');if(j===i&&!ok)x.classList.add('wrong')});if(ok){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);award(100+state.streak*12);vibrate(18)}else{state.streak=0;vibrate([35,25,35])}const rv=$('div','reveal');rv.innerHTML=`<b>${ok?'CORRECT':'NOPE'}</b><p>${esc(q.r||'')}</p>`;wrap.append(rv);continueBtn(wrap);setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}),50)};grid.append(b)});wrap.append(grid)}
function renderEstimate(q,wrap,s){const box=$('div','estimate');const val=$('div','value',`${Math.round((q.min+q.max)/2)} ${q.unit||''}`);const inp=$('input');inp.type='range';inp.min=q.min;inp.max=q.max;inp.step=(q.max-q.min)>50?1:.1;inp.value=(q.min+q.max)/2;inp.oninput=()=>val.textContent=`${Number(inp.value).toFixed((q.max-q.min)<20?1:0)} ${q.unit||''}`;const go=$('button','next','LOCK IT');go.onclick=()=>{const v=Number(inp.value),d=Math.abs(v-q.target),ratio=Math.max(0,1-d/((q.max-q.min)/2));const pts=award(40+Math.round(ratio*160));if(d<=q.tol)state.correct++;go.disabled=true;inp.disabled=true;const rv=$('div','reveal');rv.innerHTML=`<b>${d<=q.tol?'BANG ON':'ANSWER: '+q.target+' '+(q.unit||'')}</b><p>${esc(q.r||'')} +${pts} points.</p>`;wrap.append(rv);continueBtn(wrap)};box.append(val,inp,go);wrap.append(box)}
function renderOrder(q,wrap,s){let picked=[];const list=$('div','orderList');const options=shuffle(q.items,state.rand);options.forEach(item=>{const b=$('button','orderItem',esc(item));b.onclick=()=>{if(picked.includes(item)){picked=picked.filter(x=>x!==item);b.classList.remove('selected');b.removeAttribute('data-n');}else{picked.push(item);b.classList.add('selected');b.dataset.n=picked.length;b.textContent=`${picked.length}. ${item}`;}if(picked.length===q.items.length){[...list.children].forEach(x=>x.disabled=true);const ok=picked.every((x,i)=>x===q.answer[i]);if(ok){state.correct++;award(180)}else award(50);const rv=$('div','reveal');rv.innerHTML=`<b>${ok?'PERFECT ORDER':'THE ORDER'}</b><p>${esc(q.answer.join(' → '))}. ${esc(q.r||'')}</p>`;wrap.append(rv);continueBtn(wrap)}};list.append(b)});wrap.append(list)}
function renderCall(q,wrap,s){const grid=$('div','callSplit');q.o.forEach(o=>{const b=$('button','callBtn',esc(o));b.onclick=()=>{state.calls.push({id:q.id,pick:o});award(60);[...grid.children].forEach(x=>x.disabled=true);b.style.outline='3px solid var(--acid)';const rv=$('div','reveal');rv.innerHTML='<b>LOCKED</b><p>No “correct” answer. This gets interesting when the other person plays the same run.</p>';wrap.append(rv);continueBtn(wrap)};grid.append(b)});wrap.append(grid)}

function renderInterrupt(id){
 clear();const s=$('main','screen');s.append(topbar('INTERRUPTION'));
 const data={
  dad:{img:A.dad,ey:'TAP O’CLOCK',title:'Dad has entered the chat.',p:'Take a safe 80 points, or let the next question ride at double value.',a:['BANK 80','DOUBLE NEXT']},
  denise:{img:A.denise,ey:'KENDAL ENERGY',title:'Denise has acquired a plan.',p:'Take 60 now, or make the next side quest worth 1.5×.',a:['TAKE 60','BOOST GAME']},
  fats:{img:A.fats,ey:'FATS INCIDENT',title:'A freebie has appeared.',p:'Take 50 points, or gamble the next answer at 2×. No roast dinner involved.',a:['TAKE 50','GAMBLE']}
 }[id];
 const box=$('section','interrupt');const top=$('div','interruptTop');const im=$('img');im.src=data.img;top.append(im);box.append(top);const cp=$('div','interruptCopy');cp.innerHTML=`<div class="eyebrow">${data.ey}</div><h2>${data.title}</h2><p>${data.p}</p>`;const ch=$('div','interruptChoices');data.a.forEach((x,i)=>{const b=$('button','',x);b.onclick=()=>{if(i===0){state.score+=id==='dad'?80:id==='denise'?60:50}else{state.multiplier=id==='denise'?1.5:2}state.i++;renderEvent()};ch.append(b)});cp.append(ch);box.append(cp);s.append(box);root.append(s)
}

function gameShell(title,sub){clear();const s=$('main','screen');s.append(topbar('SIDE QUEST'));const gt=$('div','gameTitle');gt.innerHTML=`<div class="eyebrow">PLAY IT</div><h1>${title}</h1><p>${sub}</p>`;s.append(gt);const stage=$('section','gameStage');s.append(stage);root.append(s);return{stage,s}}
function gameDone(stage,pts,title,copy){state.gamePoints+=pts;state.score+=pts;state.gameResults.push({pts,title});const o=$('div','gameResult');o.innerHTML=`<div><b>${esc(title)}</b><p>${esc(copy)}</p><p>+${pts.toLocaleString()} points</p></div>`;const b=$('button','', 'CONTINUE');b.onclick=()=>{state.i++;renderEvent()};o.firstChild.append(b);stage.append(o)}
function runGame(id){if(id==='beat')return gameBeat();if(id==='pour')return gamePour();if(id==='m6')return gameM6();if(id==='pack')return gamePack()}

function beep(freq=220,dur=.08){try{const C=window.AudioContext||window.webkitAudioContext;const ctx=beep.ctx||(beep.ctx=new C());const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.11,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur)}catch{}}
function gameBeat(){
 const {stage}=gameShell('BEAT GRID','Listen once, then play the eight-hit pattern back on the pads.');const board=$('div','beatBoard');const display=$('div','beatDisplay','TAP LISTEN WHEN YOU ARE READY');const pads=$('div','pads');const freqs=[180,240,320,420];const seq=Array.from({length:8},()=>Math.floor(state.rand()*4));let user=[],playing=false,started=0;const steps=$('div','beatSteps');seq.forEach(()=>steps.append($('i')));
 const buttons=[];for(let i=0;i<4;i++){const b=$('button','pad');b.onclick=()=>{if(playing||!started)return;b.classList.add('lit');setTimeout(()=>b.classList.remove('lit'),120);beep(freqs[i]);user.push(i);steps.children[user.length-1]?.classList.add('on');if(user[user.length-1]!==seq[user.length-1]){const pts=Math.max(40,user.length*20);return gameDone(stage,pts,'OFF BEAT',`You got ${user.length-1} hits before the groove collapsed.`)}if(user.length===seq.length){const ms=performance.now()-started;const pts=Math.max(180,420-Math.round(ms/35));gameDone(stage,pts,'LOCKED IN',`Eight hits clean. ${Math.round(ms)} ms from first tap to finish.`)}};buttons.push(b);pads.append(b)}
 const listen=$('button','next','LISTEN');listen.style.marginTop='15px';listen.onclick=async()=>{if(playing)return;playing=true;user=[];[...steps.children].forEach(x=>x.classList.remove('on'));display.textContent='LISTEN';for(let k=0;k<seq.length;k++){const i=seq[k];buttons[i].classList.add('lit');beep(freqs[i]);await new Promise(r=>setTimeout(r,260));buttons[i].classList.remove('lit');await new Promise(r=>setTimeout(r,150))}display.textContent='YOUR TURN';playing=false;started=performance.now();listen.remove()};board.append(display,pads,steps,listen);stage.append(board)
}

function gamePour(){
 const {stage}=gameShell('POUR PRESSURE','Tilt the bottle with your finger. Release when the glass hits the line.');const wrap=$('div','canvasWrap');const c=$('canvas');c.width=720;c.height=1090;wrap.append(c);wrap.append($('div','canvasHint','DRAG DOWN TO TILT · RELEASE TO STOP THE POUR'));stage.append(wrap);const ctx=c.getContext('2d');let angle=-.25,fill=0,drag=false,lastY=0,done=false,start=performance.now();
 function xy(e){const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]}
 c.onpointerdown=e=>{drag=true;lastY=xy(e)[1];c.setPointerCapture?.(e.pointerId)};c.onpointermove=e=>{if(!drag||done)return;const y=xy(e)[1],dy=y-lastY;lastY=y;angle=clamp(angle+dy*.0025,-.3,1.25)};c.onpointerup=c.onpointercancel=()=>{if(!drag||done)return;drag=false;if(fill>.15)finish()};
 function finish(){if(done)return;done=true;const d=Math.abs(fill-.76),pts=fill>1?25:Math.max(45,340-Math.round(d*650));setTimeout(()=>gameDone(stage,pts,fill>1?'OVER THE TOP':d<.035?'NAILED THE LINE':d<.1?'PUB STANDARD':'STILL DRINKABLE',fill>1?'You have watered the table.':d<.035?'A genuinely elite pour.':'Close enough that nobody is sending it back.'),260)}
 function draw(t){const dt=Math.min(.04,(t-(draw.last||t))/1000);draw.last=t;if(!done&&angle>.42)fill+=dt*(angle-.36)*.22;if(fill>1.06)finish();ctx.clearRect(0,0,c.width,c.height);const g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,'#111a21');g.addColorStop(1,'#070a0d');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
  // glass
  const gx=355,gy=520,gw=205,gh=400;ctx.lineWidth=11;ctx.strokeStyle='rgba(245,250,255,.82)';ctx.beginPath();ctx.roundRect(gx,gy,gw,gh,25);ctx.stroke();const level=clamp(fill,0,1)* (gh-20);const lg=ctx.createLinearGradient(0,gy+gh-level,0,gy+gh);lg.addColorStop(0,'#f6df8d');lg.addColorStop(1,'#cc9e2e');ctx.fillStyle=lg;ctx.beginPath();ctx.roundRect(gx+7,gy+gh-level-7,gw-14,level,18);ctx.fill();ctx.setLineDash([14,12]);ctx.strokeStyle='#caff36';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(gx-12,gy+gh*.24);ctx.lineTo(gx+gw+12,gy+gh*.24);ctx.stroke();ctx.setLineDash([]);
  // bottle
  ctx.save();ctx.translate(215,245);ctx.rotate(angle);ctx.fillStyle='#1e5a38';ctx.strokeStyle='#85c49a';ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(-54,-125,108,275,22);ctx.fill();ctx.stroke();ctx.fillStyle='#f2e9d4';ctx.fillRect(-43,-30,86,88);ctx.fillStyle='#151a17';ctx.font='bold 26px ui-monospace';ctx.textAlign='center';ctx.fillText('SAVVY',0,7);ctx.fillText('B',0,40);ctx.fillStyle='#285d3d';ctx.beginPath();ctx.roundRect(-22,-200,44,82,9);ctx.fill();ctx.stroke();ctx.restore();
  if(!done&&angle>.42){const sx=215+Math.sin(angle)*150,sy=245-Math.cos(angle)*150;ctx.strokeStyle='rgba(246,220,118,.92)';ctx.lineWidth=9+Math.sin(t/70)*2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(310,390,455,520);ctx.stroke()}
  ctx.fillStyle='#f4ead7';ctx.font='900 32px Impact';ctx.textAlign='right';ctx.fillText(Math.round(fill*100)+'%',665,70);if(!done&&performance.now()-start>10000)finish();if(!done)requestAnimationFrame(draw)}requestAnimationFrame(draw)
}

function gameM6(){
 const {stage}=gameShell('M6 SLIPSTREAM','Drag left and right. Survive ten seconds without becoming the traffic report.');const c=$('canvas','roadCanvas');c.width=720;c.height=1090;stage.append(c);stage.append($('div','roadLegend','10 SECONDS · DRAG TO STEER'));const ctx=c.getContext('2d');let car={x:360,y:900,w:66,h:120},obs=[],last=performance.now(),start=last,done=false,drag=false;function px(e){const r=c.getBoundingClientRect();return(e.clientX-r.left)*c.width/r.width}c.onpointerdown=e=>{drag=true;car.x=px(e);c.setPointerCapture?.(e.pointerId)};c.onpointermove=e=>{if(drag)car.x=clamp(px(e),135,585)};c.onpointerup=c.onpointercancel=()=>drag=false;let spawn=0;
 function collide(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.43&&Math.abs(a.y-b.y)<(a.h+b.h)*.43}
 function frame(t){if(done)return;const dt=Math.min(.04,(t-last)/1000);last=t;spawn-=dt;if(spawn<=0){spawn=.55+state.rand()*.42;const lane=[180,360,540][Math.floor(state.rand()*3)];obs.push({x:lane,y:-100,w:70,h:120,v:440+state.rand()*170,c:state.rand()>.5?'#ff5968':'#d0d7de'})}obs.forEach(o=>o.y+=o.v*dt);obs=obs.filter(o=>o.y<1200);for(const o of obs)if(collide(car,o)){done=true;return gameDone(stage,45,'GRIDLOCK','A completely avoidable motorway incident.')}
  ctx.fillStyle='#0d1218';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#171e26';ctx.fillRect(95,0,530,c.height);ctx.strokeStyle='#d5dde3';ctx.lineWidth=5;ctx.setLineDash([38,34]);for(const x of [270,450]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke()}ctx.setLineDash([]);ctx.fillStyle='#4d5864';ctx.fillRect(86,0,8,c.height);ctx.fillRect(626,0,8,c.height);
  const drawCar=(o,color)=>{ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-o.w/2,-o.h/2,o.w,o.h,16);ctx.fill();ctx.fillStyle='#9edcf5';ctx.beginPath();ctx.roundRect(-o.w*.30,-o.h*.25,o.w*.6,o.h*.24,8);ctx.fill();ctx.fillStyle='#06090c';ctx.fillRect(-o.w/2-5,-o.h*.27,8,30);ctx.fillRect(o.w/2-3,-o.h*.27,8,30);ctx.restore()};obs.forEach(o=>drawCar(o,o.c));drawCar(car,'#42d8ff');const elapsed=(t-start)/1000;ctx.fillStyle='#f4ead7';ctx.font='900 34px Impact';ctx.textAlign='right';ctx.fillText(Math.max(0,10-elapsed).toFixed(1),680,55);if(elapsed>=10){done=true;return gameDone(stage,320,'CLEAR ROAD','Ten seconds on the M6 without an existential crisis.')}requestAnimationFrame(frame)}requestAnimationFrame(frame)
}

function gamePack(){
 const {stage}=gameShell('PACK THE WEEKEND','Fit the essentials into the bag. Bad choices waste space.');const a=$('div','packArea');const bag=$('div','bag');for(let i=0;i<25;i++)bag.append($('div','bagSlot'));a.append(bag);const items=$('div','packItems');const defs=[['TENT',3,2,true],['GAFFER',2,1,true],['POWER',1,2,true],['HOODIE',2,2,true],['THIRD PAIR OF JEANS',2,2,false],['GIANT PILLOW',3,2,false],['RANDOM MUG',1,1,false]];shuffle(defs,state.rand).forEach(d=>{const b=$('button','packItem',esc(d[0]));b.dataset.w=d[1];b.dataset.h=d[2];b.dataset.good=d[3]?'1':'0';enablePackDrag(b);items.append(b)});a.append(items);const sc=$('div','packScore','ESSENTIALS PACKED: 0 / 4');a.append(sc);stage.append(a);let grid=Array(25).fill(null),ess=0,placed=0,start=performance.now(),finished=false;
 function enablePackDrag(b){let clone=null;const move=e=>{if(!clone)return;clone.style.left=(e.clientX-37)+'px';clone.style.top=(e.clientY-29)+'px'};b.onpointerdown=e=>{e.preventDefault();clone=b.cloneNode(true);clone.classList.add('dragging');document.body.append(clone);move(e);b.setPointerCapture?.(e.pointerId)};b.onpointermove=move;b.onpointerup=e=>{if(!clone)return;const br=bag.getBoundingClientRect();const x=e.clientX-br.left,y=e.clientY-br.top;clone.remove();clone=null;if(x<0||y<0||x>br.width||y>br.height)return;const col=Math.floor(x/(br.width/5)),row=Math.floor(y/(br.height/5)),w=+b.dataset.w,h=+b.dataset.h;if(col+w>5||row+h>5)return flash('DOESN’T FIT');const cells=[];for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)cells.push((row+yy)*5+col+xx);if(cells.some(i=>grid[i]))return flash('SPACE ALREADY USED');cells.forEach(i=>{grid[i]=b.textContent;bag.children[i].classList.add('filled')});b.disabled=true;b.style.opacity=.35;placed++;if(b.dataset.good==='1')ess++;sc.textContent=`ESSENTIALS PACKED: ${ess} / 4`;if(ess>=4){finished=true;const pts=Math.max(180,430-Math.round((performance.now()-start)/90)-Math.max(0,placed-4)*35);setTimeout(()=>gameDone(stage,pts,'BAG CLOSED',placed===4?'Four essentials. Zero nonsense.':'Essentials secured. A little nonsense also made it in.'),350)}};b.onpointercancel=()=>{clone?.remove();clone=null}}
 function flash(txt){sc.textContent=txt;setTimeout(()=>sc.textContent=`ESSENTIALS PACKED: ${ess} / 4`,600)}
 setTimeout(()=>{if(!finished)gameDone(stage,Math.max(40,ess*65),'ZIP FAILURE',`${ess} of 4 essentials made it into the bag.`)},16000)
}

function renderResults(){
 clear();const s=$('main','screen');const hero=$('div','resultsHero');const im=$('img');im.src=A.festival||A.hero;hero.append(im);s.append(hero);const panel=$('div','resultsScore');const pct=state.events.filter(e=>e.kind==='q').length?Math.round(state.correct/state.events.filter(e=>e.kind==='q'&&e.q.type!=='call').length*100):0;panel.innerHTML=`<div class="eyebrow">${esc(modeName())} COMPLETE</div><div class="big">${state.score.toLocaleString()}</div><p>${state.score>1600?'Dangerously competent.':state.score>900?'Respectable behaviour.':'Plenty of room for revenge.'}</p>`;const stats=$('div','statRow');stats.innerHTML=`<div class="stat"><small>CORRECT</small><b>${state.correct}</b></div><div class="stat"><small>BEST STREAK</small><b>${state.best}</b></div><div class="stat"><small>GAME PTS</small><b>${state.gamePoints}</b></div>`;panel.append(stats);if(incomingScore){const d=state.score-incomingScore;panel.append($('div','reveal',`<b>${d===0?'DRAW':d>0?'YOU WON':'THEY WON'}</b><p>${Math.abs(d).toLocaleString()} points in it.</p>`))}const again=$('button','share','PLAY AGAIN');again.onclick=renderHome;panel.append(again);const share=$('button','share','SEND SAME RUN');share.onclick=shareRun;panel.append(share);s.append(panel);root.append(s)
}
async function shareRun(){const u=new URL(location.href);u.search='';u.searchParams.set('seed',state.seed);u.searchParams.set('mode',state.mode);u.searchParams.set('from',state.player);u.searchParams.set('score',String(state.score));const text=`I scored ${state.score.toLocaleString()} on Side Quests. Same run. Your turn.`;try{if(navigator.share)await navigator.share({title:'Rick + Laura: Side Quests',text,url:u.toString()});else await navigator.clipboard.writeText(u.toString())}catch{}}

renderHome();
})();