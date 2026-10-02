
(()=>{
'use strict';

const A=window.BEHBEH_ASSETS||{};
const BANK=window.BEHBEH_CONTENT||[];
const root=document.getElementById('app');

const qs=new URLSearchParams(location.search);
const incomingSeed=qs.get('seed');
const incomingMode=qs.get('mode');
const incomingFrom=qs.get('from');
const incomingScore=Number(qs.get('score')||0)||null;
let incomingCalls={};
try{incomingCalls=JSON.parse(atob(qs.get('calls')||''))||{}}catch{}

const state={
  player:localStorage.getItem('behbeh_player')||'Rick',
  mode:'home',seed:null,rng:Math.random,queue:[],step:0,score:0,correct:0,
  streak:0,best:0,micro:0,nextMult:1,timeBonus:0,shield:0,
  started:0,coupleAnswers:{},challenge:false
};

const cats=[
 ['OUR WORLD','us','The actual two of you, minus the obvious memory-test stuff.'],
 ['MUSIC','music','Hip-hop, metal, production, samples and rabbit holes.'],
 ['MIND + BODY','mind','Training, sleep, brains and human weirdness.'],
 ['WEIRD WORLD','weird','Things that sound invented but annoyingly are not.'],
 ['HISTORY','history','Humanity behaving like a badly moderated group chat.'],
 ['ANIMALS','animals','Nature showing off and occasionally being disgusting.'],
 ['FOOD + DRINK','food','Coffee, booze, food science and training-adjacent nonsense.'],
 ['FILM + ACTING','acting','Performance, cinema and why a face means something in an edit.'],
 ['TRAVEL + CHAOS','travel','Trains, tents, traffic and the logistics of leaving the house.'],
 ['DARK + STRANGE','dark','Macabre without becoming grim.']
];

function el(tag,cls,html){
 const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n;
}
function clear(){root.innerHTML='<div class="noise"></div>'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hash(seed);return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,r=Math.random){arr=[...arr];for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function todaySeed(){return 'daily-'+new Date().toISOString().slice(0,10)}
function vibrate(x){try{navigator.vibrate&&navigator.vibrate(x)}catch{}}
function setPlayer(p){state.player=p;localStorage.setItem('behbeh_player',p);renderHome()}
function getSeen(){try{return new Set(JSON.parse(localStorage.getItem('behbeh_seen')||'[]'))}catch{return new Set()}}
function addSeen(id){const s=getSeen();s.add(id);localStorage.setItem('behbeh_seen',JSON.stringify([...s].slice(-400)))}
function categoryArtClass(id){return 'art'+({music:'Music',mind:'Mind',weird:'Weird',history:'History',animals:'Animals',food:'Food',acting:'Acting',travel:'Travel',dark:'Dark'}[id]||'Weird')}
function playerName(){return state.player}
function scoreFmt(n){return Math.round(n).toLocaleString('en-GB')}

function renderHome(){
 clear();state.mode='home';
 const s=el('main','shell');
 const brand=el('div','brand');
 brand.innerHTML='<div class="brandMark">BEHBEH<i>AFTER HOURS</i></div><div class="brandMeta">A PRIVATE LITTLE GAME FOR TWO PEOPLE WITH FAR TOO MUCH LORE.</div>';
 s.append(brand);

 const hero=el('section','hero');
 const img=el('img','heroPhoto');img.src=A.couple||'';hero.append(img);
 const copy=el('div','heroCopy','<div class="eyebrow">RICK + LAURA</div><h1>NOT A<br><span>QUIZ APP</span></h1><p>Questions worth arguing about, private jokes used sparingly, and games that actually ask you to do something.</p>');
 hero.append(copy);
 hero.append(el('div','heroSticker','NO DEV NOTES. NO RANDOM AI HISTORY ART.'));
 s.append(hero);

 if(incomingSeed){
   const notice=el('section','interruptCard');
   notice.innerHTML='<div class="interruptBody"><div class="interruptKicker">CHALLENGE RECEIVED</div><h2>'+esc(incomingFrom||'SOMEONE')+' SENT A RUN</h2><p>Same seed. Same questions. Same games. Their score stays hidden until the end.</p></div>';
   const b=el('button','interruptAction','PLAY THEIR RUN');
   b.onclick=()=>launchMode(incomingMode||'quick',incomingSeed,true);
   notice.querySelector('.interruptBody').append(b);s.append(notice);
   root.append(s);return;
 }

 const pr=el('div','playerRow');
 ['Rick','Laura'].forEach(p=>{const b=el('button','playerBtn '+(state.player===p?'active':''),"I'M "+p.toUpperCase());b.onclick=()=>setPlayer(p);pr.append(b)});
 s.append(pr);

 s.append(el('div','sectionTitle','<b>START HERE</b><span>Different moods, not one giant mode pretending to be everything.</span>'));
 const mg=el('div','modeGrid');
 const modes=[
  ['quick','QUICK MIX','10 varied rounds. Questions only. No arcade detours.'],
  ['episode','EPISODE','Questions, three grown-up microgames and surprise cameos.'],
  ['holes','RABBIT HOLES','Pick the subject you actually fancy tonight.'],
  ['challenge','CHALLENGE','Play first, then send Laura the exact same run.']
 ];
 modes.forEach(([id,title,desc])=>{const b=el('button','modeCard primary '+id,'<div class="modeStamp"></div><h3>'+title+'</h3><p>'+desc+'</p>');b.onclick=()=>launchMode(id);mg.append(b)});
 s.append(mg);

 const row=el('div','miniModeRow');
 const late=el('button','miniMode','<b>LATE NIGHT</b><span>Weird, dark, psychology, bodies.</span>');late.onclick=()=>startQuiz(['DARK + STRANGE','WEIRD WORLD','MIND + BODY'],10);
 const us=el('button','miniMode','<b>OUR WORLD</b><span>Real lore, plausible lies, no “who said it?”.</span>');us.onclick=()=>startQuiz(['OUR WORLD','US'],10);
 row.append(late,us);s.append(row);

 s.append(el('div','homeFooter','DAD, DENISE, FATS, GREGGS, 43 MINNIES AND OTHER SIDE CHARACTERS APPEAR WHEN THE GAME DECIDES THEY SHOULD.'));
 root.append(s);
}

function renderCategories(){
 clear();const s=el('main','shell');
 s.append(topbar('RABBIT HOLES'));
 s.append(el('div','sectionTitle','<b>PICK A RABBIT HOLE</b><span>Each one has its own question pool. No random picture slapped above it.</span>'));
 const grid=el('div','catGrid');
 cats.forEach(([name,id,desc])=>{
   const b=el('button','catCard '+(id==='us'?'us':''));
   const art=el('div','catArt '+(id==='us'?'':categoryArtClass(id)));
   if(id==='us'){art.style.backgroundImage='url("'+A.couple+'")'}
   b.append(art,el('div','catShade'),el('div','catCopy','<b>'+name+'</b><span>'+desc+'</span>'));
   b.onclick=()=>startQuiz([name],10);
   grid.append(b);
 });
 s.append(grid);root.append(s);
}

function topbar(label){
 const t=el('div','topbar');
 const b=el('button','back','EXIT');b.onclick=renderHome;
 t.append(b,el('div','topTitle',label),el('div','topScore',scoreFmt(state.score)));
 return t;
}
function progress(){
 const p=el('div','progress');const i=el('i');i.style.width=((state.step/Math.max(1,state.queue.length))*100)+'%';p.append(i);return p;
}

function reset(mode,seed=null,challenge=false){
 state.mode=mode;
 state.seed=seed||mode+'-'+Date.now().toString(36);
 state.rng=rng(state.seed);
 state.queue=[];state.step=0;state.score=0;state.correct=0;state.streak=0;state.best=0;state.micro=0;
 state.nextMult=1;state.timeBonus=0;state.shield=0;state.started=Date.now();state.coupleAnswers={};state.challenge=challenge;
}

function launchMode(mode,seed=null,incoming=false){
 if(String(mode||'').startsWith('quiz:')){
   const cats=String(mode).slice(5).split('|').filter(Boolean);
   return startQuiz(cats.length?cats:null,10,seed,incoming);
 }
 if(mode==='holes')return renderCategories();
 if(mode==='quick'||mode==='challenge')return startQuiz(null,10,seed,mode==='challenge'||incoming);
 if(mode==='late')return startQuiz(['DARK + STRANGE','WEIRD WORLD','MIND + BODY'],10,seed,incoming);
 if(mode==='us')return startQuiz(['OUR WORLD','US'],10,seed,incoming);
 if(mode==='episode')return startEpisode(seed,incoming);
 if(mode==='chaos')return startChaos(seed,incoming);
 return startQuiz(null,10,seed,incoming);
}

function chooseQuestions(categories,count,r,seeded=false){
 const seen=seeded?new Set():getSeen();
 const poolFor=names=>shuffle(BANK.filter(q=>names.includes(q.cat)&&!seen.has(q.id)),r);
 if(!categories && count>=8){
   const recipe=[
     [['OUR WORLD','US'],2],
     [['MUSIC'],2],
     [['MIND + BODY'],1],
     [['FILM + ACTING'],1],
     [['FOOD + DRINK','TRAVEL + CHAOS'],1],
     [['WEIRD WORLD','HISTORY','ANIMALS','DARK + STRANGE'],count-7]
   ];
   const out=[],used=new Set();
   recipe.forEach(([names,n])=>{
     const p=poolFor(names);
     for(const item of p){if(used.has(item.id))continue;out.push(item);used.add(item.id);if(--n<=0)break}
   });
   if(out.length<count){
     const fill=shuffle(BANK.filter(q=>!used.has(q.id)&&!seen.has(q.id)),r);
     out.push(...fill.slice(0,count-out.length));
   }
   return shuffle(out,r);
 }
 let pool=BANK.filter(q=>!categories||categories.includes(q.cat));
 pool=shuffle(pool,r);
 if(!seeded){
   const fresh=pool.filter(q=>!seen.has(q.id)),old=pool.filter(q=>seen.has(q.id));
   pool=fresh.concat(old);
 }
 const out=[],usedCats=new Map();
 for(const item of pool){
   const c=usedCats.get(item.cat)||0;
   if(c>=4&&out.length<count-2)continue;
   out.push(item);usedCats.set(item.cat,c+1);
   if(out.length===count)break;
 }
 return out;
}

function startQuiz(categories=null,count=10,seed=null,challenge=false){
 const modeKey=categories&&categories.length?'quiz:'+categories.join('|'):'quick';
 reset(modeKey,seed,challenge);
 const q=chooseQuestions(categories,count,state.rng,!!seed);
 state.queue=q.map(x=>({kind:'question',data:x}));
 renderStep();
}

function startEpisode(seed=null,challenge=false){
 reset('episode',seed,challenge);
 const q=chooseQuestions(null,8,state.rng,!!seed);
 const games=shuffle(['pour','beat','tab','train','pack'],state.rng).slice(0,3);
 const ints=shuffle(['dad','denise','fats','greggs','workable'],state.rng).slice(0,2);
 state.queue=[
  {kind:'question',data:q[0]},{kind:'game',id:games[0]},{kind:'question',data:q[1]},
  {kind:'interrupt',id:ints[0]},{kind:'question',data:q[2]},{kind:'question',data:q[3]},
  {kind:'game',id:games[1]},{kind:'question',data:q[4]},{kind:'interrupt',id:ints[1]},
  {kind:'question',data:q[5]},{kind:'game',id:games[2]},{kind:'question',data:q[6]},{kind:'question',data:q[7]}
 ];
 renderStep();
}

function startChaos(seed=null,challenge=false){
 reset('chaos',seed,challenge);
 const q=chooseQuestions(null,5,state.rng,!!seed);
 const games=shuffle(['pour','beat','tab','train','pack'],state.rng);
 const ints=shuffle(['dad','denise','fats','greggs','workable'],state.rng).slice(0,3);
 state.queue=[
  {kind:'game',id:games[0]},{kind:'question',data:q[0]},{kind:'interrupt',id:ints[0]},
  {kind:'game',id:games[1]},{kind:'question',data:q[1]},{kind:'game',id:games[2]},
  {kind:'interrupt',id:ints[1]},{kind:'question',data:q[2]},{kind:'game',id:games[3]},
  {kind:'question',data:q[3]},{kind:'interrupt',id:ints[2]},{kind:'game',id:games[4]},{kind:'question',data:q[4]}
 ];
 renderStep();
}

function renderStep(){
 if(state.step>=state.queue.length)return renderResults();
 const e=state.queue[state.step];
 if(e.kind==='question')return renderQuestion(e.data);
 if(e.kind==='game')return runGame(e.id);
 if(e.kind==='interrupt')return renderInterrupt(e.id);
}

function baseGame(label){
 clear();const s=el('main','shell gameShell');s.append(topbar(label),progress());const stage=el('div','questionStage');s.append(stage);root.append(s);return {s,stage}
}


function makeQuestionVisual(cat){
 const v=el('div','qVisual');v.dataset.word=cat;
 if(cat==='OUR WORLD'||cat==='US'){v.classList.add('photo');v.style.backgroundImage='url("'+A.festival+'")';return v}
 const id=({ 'MUSIC':'music','MIND + BODY':'mind','WEIRD WORLD':'weird','HISTORY':'history','ANIMALS':'animals','FOOD + DRINK':'food','FILM + ACTING':'acting','TRAVEL + CHAOS':'travel','DARK + STRANGE':'dark' })[cat]||'weird';
 v.classList.add(categoryArtClass(id));
 return v;
}

function renderQuestion(q){
 if(!q)return advance();
 addSeen(q.id);
 if(q.type==='order')return renderOrder(q);
 if(q.type==='couple')return renderCouple(q);
 if(q.type==='bluff')return renderBluff(q);
 return renderMCQ(q);
}

function renderMCQ(q){
 const {stage}=baseGame(q.cat);
 stage.append(makeQuestionVisual(q.cat));
 const card=el('section','qCard','<div class="qMeta">'+esc(q.cat)+'</div><h1>'+esc(q.prompt)+'</h1>');
 stage.append(card);
 const grid=el('div','answerGrid');let locked=false;
 q.options.forEach((o,i)=>{
  const b=el('button','answer','<span class="key">'+String.fromCharCode(65+i)+'</span><b>'+esc(o)+'</b>');
  b.onclick=()=>{
   if(locked)return;locked=true;
   const ok=i===q.answer;
   const mult=state.nextMult;state.nextMult=1;
   if(ok){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);state.score+=Math.round((100+state.streak*12)*mult);vibrate(18)}
   else if(state.shield>0){state.shield--;state.score+=20}
   else{state.streak=0;vibrate([40,25,40])}
   [...grid.children].forEach((x,j)=>{x.disabled=true;if(j===q.answer)x.classList.add('good');else if(j===i&&!ok)x.classList.add('bad');else x.classList.add('dim')});
   showReveal(stage,ok,q.reveal);
  };
  grid.append(b);
 });
 stage.append(grid);
}

function renderBluff(q){
 const {stage}=baseGame(q.cat);
 stage.append(makeQuestionVisual(q.cat));
 stage.append(el('section','qCard','<div class="qMeta">'+esc(q.cat)+'</div><h1>'+esc(q.prompt)+'</h1><div class="bluffNote">ONE OF THESE IS BULLSHIT. PICK IT.</div>'));
 const g=el('div','bluffGrid');let lock=false;
 q.options.forEach((o,i)=>{
  const b=el('button','bluffCard','<b>'+esc(o)+'</b>');b.dataset.n=String(i+1);
  b.onclick=()=>{if(lock)return;lock=true;const ok=i===q.answer;if(ok){state.correct++;state.score+=120*state.nextMult;state.streak++}else if(state.shield>0){state.shield--;state.score+=20}else state.streak=0;state.nextMult=1;[...g.children].forEach((x,j)=>{x.disabled=true;if(j===q.answer)x.classList.add('bad');else if(j===i&&ok)x.classList.add('good')});showReveal(stage,ok,q.reveal)};
  g.append(b);
 });
 stage.append(g);
}

function renderOrder(q){
 const {stage}=baseGame(q.cat);
 stage.append(makeQuestionVisual(q.cat));
 stage.append(el('section','qCard','<div class="qMeta">'+esc(q.cat)+'</div><h1>'+esc(q.prompt)+'</h1><p>Drag them into order, earliest at the top.</p>'));
 const list=el('div','orderList');
 shuffle(q.items,state.rng).forEach(txt=>list.append(makeDraggableOrder(txt,list)));
 stage.append(list);
 const c=el('button','checkOrder','LOCK IT IN');
 c.onclick=()=>{
   const got=[...list.children].map(x=>x.dataset.value);
   const ok=got.every((x,i)=>x===q.answer[i]);
   if(ok){state.correct++;state.score+=150*state.nextMult;state.streak++}else if(state.shield>0){state.shield--;state.score+=20}else state.streak=0;
   state.nextMult=1;c.disabled=true;showReveal(stage,ok,q.reveal);
 };
 stage.append(c);
}
function makeDraggableOrder(txt,list){
 const item=el('div','orderItem',esc(txt));item.dataset.value=txt;
 let startY=0,orig=0;
 item.onpointerdown=e=>{startY=e.clientY;orig=[...list.children].indexOf(item);item.classList.add('dragging');item.setPointerCapture&&item.setPointerCapture(e.pointerId)};
 item.onpointermove=e=>{
   if(!item.classList.contains('dragging'))return;
   const dy=e.clientY-startY;const h=item.getBoundingClientRect().height+9;const target=Math.max(0,Math.min(list.children.length-1,orig+Math.round(dy/h)));
   const children=[...list.children].filter(x=>x!==item);
   if(target>=children.length)list.append(item);else list.insertBefore(item,children[target]);
 };
 const end=()=>item.classList.remove('dragging');item.onpointerup=end;item.onpointercancel=end;
 return item;
}

function renderCouple(q){
 const {stage}=baseGame('COUPLE CALL');
 stage.append(makeQuestionVisual(q.cat));
 stage.append(el('section','qCard','<div class="qMeta">NO CORRECT ANSWER</div><h1>'+esc(q.prompt)+'</h1><p>Pick independently. If this came from a challenge, you will find out whether you matched at the end.</p>'));
 const grid=el('div','coupleGrid');
 q.options.forEach((o,i)=>{
  const b=el('button','coupleChoice','<b>'+esc(o)+'</b><small>LOCK THIS ANSWER</small>');
  b.onclick=()=>{state.coupleAnswers[q.id]=i;state.score+=40;[...grid.children].forEach(x=>x.disabled=true);b.style.borderColor='var(--cyan)';showReveal(stage,true,q.reveal||'Locked.')};
  grid.append(b);
 });stage.append(grid);
}
function showReveal(stage,ok,text){
 const r=el('section','reveal '+(ok?'good':'bad'),'<strong>'+(ok?'CORRECT':'NOPE')+'</strong><p>'+esc(text)+'</p>');
 const n=el('button','next','NEXT');
 n.onclick=advance;r.append(n);stage.append(r);setTimeout(()=>r.scrollIntoView({behavior:'smooth',block:'end'}),30);
}

function advance(){state.step++;renderStep()}

/* interruptions */
const interruptData={
 dad:{name:"TAP O'CLOCK",photo:()=>A.dad,body:"Dad has arrived with the punctuality of a Swiss railway and the spiritual certainty of Swan Blonde.",effect:"Your next question is worth double.",apply:()=>{state.nextMult=2}},
 denise:{name:"DENISE HAS A PLAN",photo:()=>A.denise,body:"This is how festivals happen. One minute you're having a drink, the next Denise has logistics.",effect:"Take 90 safe points or make the next question worth triple.",choice:true},
 fats:{name:"FATS RAIL BULLETIN",photo:()=>A.fats,body:"Fats is fuming at the trains. This appears to be a recurring department of government.",effect:"You get three bonus seconds on the next timed game.",apply:()=>{state.timeBonus+=3}},
 greggs:{name:"GREGGS SUMMONS",photo:()=>A.rick_silly,body:"Greggs is not a choice. It is a summons. The game has accepted this as constitutional law.",effect:"Instant 75 points.",apply:()=>{state.score+=75}},
 workable:{name:"ALL IS WORKABLE",photo:()=>A.festival,body:"Broken tent pole. Slugs. Parking. General decay. Nevertheless: all is workable.",effect:"The next wrong answer will be forgiven.",apply:()=>{state.shield=1}}
};
function renderInterrupt(id){
 clear();const d=interruptData[id];const wrap=el('main','interrupt');const card=el('section','interruptCard');
 const im=el('img','interruptPhoto');im.src=d.photo();card.append(im);
 const body=el('div','interruptBody','<div class="interruptKicker">SIDE CHARACTER INTERRUPTION</div><h2>'+d.name+'</h2><p>'+d.body+'</p><p><b>'+d.effect+'</b></p>');
 if(d.choice){
   const safe=el('button','interruptAction','TAKE 90 POINTS');safe.onclick=()=>{state.score+=90;advance()};
   const risk=el('button','interruptAction','TRIPLE THE NEXT QUESTION');risk.style.background='var(--hot)';risk.style.color='#1b0711';risk.onclick=()=>{state.nextMult=3;advance()};
   body.append(safe,risk);
 }else{
   const b=el('button','interruptAction','CARRY ON');b.onclick=()=>{d.apply&&d.apply();advance()};body.append(b);
 }
 card.append(body);wrap.append(card);root.append(wrap);
}

/* microgame common */
function microShell(title,desc,cls){
 clear();const s=el('main','shell micro');s.append(topbar('MICROGAME'),progress());
 const h=el('section','microHead','<div class="eyebrow">DO SOMETHING, NOT JUST ANSWER</div><h1>'+title+'</h1><p>'+desc+'</p>');s.append(h);
 const st=el('section','microStage '+cls);s.append(st);root.append(s);return {s,st}
}
function finishGame(st,points,title,text){
 state.micro++;state.score+=points;
 const r=el('div','microResult','<div><h2>'+title+'</h2><b>+'+scoreFmt(points)+'</b><p>'+text+'</p></div>');
 const b=el('button',null,'CONTINUE');b.onclick=advance;r.firstElementChild.append(b);st.append(r);
}
function countdown(st,seconds,onTick,onEnd){
 let start=performance.now(),last=start;const badge=el('div','microTimer');st.append(badge);
 const extra=state.timeBonus;state.timeBonus=0;seconds+=extra;
 function frame(t){const left=Math.max(0,seconds-(t-start)/1000);badge.textContent=left.toFixed(1);onTick&&onTick(t,last,left);last=t;if(left<=0){onEnd&&onEnd();return}requestAnimationFrame(frame)}requestAnimationFrame(frame)
}
function runGame(id){
 if(id==='pour')return gamePour();
 if(id==='beat')return gameBeat();
 if(id==='tab')return gameTab();
 if(id==='train')return gameTrain();
 if(id==='pack')return gamePack();
 return advance();
}

/* POUR PRESSURE */
function gamePour(){
 const {st}=microShell('POUR PRESSURE','Drag the bottle to tilt it. Stop inside the gold band without baptising the table.','pourScene');
 st.append(el('div','barGlow'));
 const bottle=el('div','bottle','<div class="bottleLabel">SAVVY B</div>');
 const stream=el('div','stream');const glass=el('div','glass','<div class="wine"></div><div class="targetBand"></div>');
 const pct=el('div','pourPct','0%');const hint=el('div','pourHint','DRAG UP OR DOWN ON THE BOTTLE TO CONTROL THE POUR');
 st.append(bottle,stream,glass,pct,hint);
 const wine=glass.querySelector('.wine');
 let angle=-18,drag=false,lastY=0,fill=0,ended=false,last=performance.now();
 function setAngle(a){angle=Math.max(-18,Math.min(72,a));bottle.style.transform='rotate('+angle+'deg)';stream.classList.toggle('on',angle>27)}
 bottle.onpointerdown=e=>{drag=true;lastY=e.clientY;bottle.setPointerCapture&&bottle.setPointerCapture(e.pointerId)};
 bottle.onpointermove=e=>{if(!drag||ended)return;const dy=e.clientY-lastY;lastY=e.clientY;setAngle(angle+dy*.6)};
 bottle.onpointerup=bottle.onpointercancel=()=>{drag=false};
 countdown(st,10,(t,prev)=>{if(ended)return;const dt=Math.min(.04,(t-last)/1000);last=t;if(angle>27)fill+=((angle-27)/45)*.19*dt;fill=Math.min(fill,1.08);wine.style.height=(Math.min(1,fill)*100)+'%';pct.textContent=Math.round(fill*100)+'%';if(fill>=1.03){ended=true;finishGame(st,20,'TABLE SERVICE','You have poured wine onto a horizontal surface. Strong choice.')}},()=>{if(ended)return;ended=true;const d=Math.abs(fill-.76);const pts=Math.max(30,340-Math.round(d*650));finishGame(st,pts,d<.035?'PERFECT POUR':d<.11?'PUB STANDARD':'TECHNICALLY WINE',d<.035?'That is irritatingly precise.':'The glass contains wine. The brief has been broadly met.')});
 setAngle(angle);
}

/* BEAT LAB */
function gameBeat(){
 const {st}=microShell('BEAT LAB','Listen once. Then reproduce the six-hit pattern on the four pads.','beatScene');
 const deck=el('div','beatDeck');const wave=el('div','waveLine');for(let i=0;i<24;i++){const x=el('i');x.style.left=(i*4.2)+'%';x.style.height=(10+state.rng()*48)+'px';wave.append(x)}deck.append(wave);
 const prompt=el('div','beatPrompt','PATTERN PLAYS ONCE. THEN IT IS YOUR TURN.');deck.append(prompt);
 const pads=el('div','padGrid');['KICK','SNARE','CLAP','HAT'].forEach((n,i)=>{const b=el('button','pad',n);b.dataset.pad=i;pads.append(b)});deck.append(pads);st.append(deck);
 const seq=Array.from({length:6},()=>Math.floor(state.rng()*4));let input=[],ready=false,done=false;
 let audio=null;
 function tone(i,d=.09){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=[95,180,310,520][i];g.gain.setValueAtTime(.16,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
 function flash(i){const p=pads.children[i];p.classList.add('flash');tone(i);setTimeout(()=>p.classList.remove('flash'),160)}
 function play(){seq.forEach((n,i)=>setTimeout(()=>flash(n),i*430));setTimeout(()=>{ready=true;prompt.textContent='YOUR TURN. SIX HITS.'},seq.length*430+250)}
 [...pads.children].forEach((b,i)=>b.onclick=()=>{if(!ready||done)return;flash(i);input.push(i);if(input.length===seq.length){done=true;const hits=input.reduce((n,x,j)=>n+(x===seq[j]),0);const pts=50+hits*45;setTimeout(()=>finishGame(st,pts,hits===6?'LOCKED IN':hits>=4?'MOSTLY ON GRID':'VERY EXPERIMENTAL',hits===6?'Six for six. Producer behaviour.':hits+' of 6 landed in the right place.'),300)}});
 const start=el('button','interruptAction','PLAY THE PATTERN');start.style.margin='12px 0 0';start.onclick=()=>{start.remove();play()};deck.append(start);
}

/* ROUND RECALL */
function gameTab(){
 const {st}=microShell('ROUND RECALL','You get three seconds to remember the order. Then the receipt disappears.','tabScene');
 const drinks=['Swan Blonde','Red wine','Tequila soda','Espresso','Lime soda','IPA','Flat white','Sparkling water'];
 const order=shuffle(drinks,state.rng).slice(0,4);
 const receipt=el('div','receipt','<h3>THE ROUND</h3><div class="receiptList"></div>');const list=receipt.querySelector('.receiptList');
 order.forEach((x,i)=>list.append(el('div',null,'<span>'+(i+1)+'. '+x+'</span><span>'+['£4.90','£6.20','£5.80','£3.10'][i]+'</span>')));st.append(receipt);
 const opts=el('div','recallOptions');st.append(opts);
 setTimeout(()=>{receipt.classList.add('hide');const target=Math.floor(state.rng()*4);const decoys=shuffle(drinks.filter(x=>!order.includes(x)),state.rng).slice(0,3);const choices=shuffle([order[target],...decoys],state.rng);const q=el('div','beatPrompt','WHAT WAS ITEM '+(target+1)+'?');q.style.position='absolute';q.style.left='18px';q.style.bottom='168px';st.append(q);choices.forEach(x=>{const b=el('button','recallOption',x);b.onclick=()=>{[...opts.children].forEach(z=>z.disabled=true);finishGame(st,x===order[target]?260:55,x===order[target]?'ROUND REMEMBERED':'BARTENDER DISAPPOINTED','The missing item was '+order[target]+'.')};opts.append(b)})},3000);
}

/* TRAIN BOARD */
function gameTrain(){
 const {st}=microShell('CONNECTIONS','Three routes. One cancellation. Pick the earliest arrival before the board changes again.','trainScene');
 const base=60+Math.floor(state.rng()*15);
 const routes=[
  {name:'DIRECT',depart:'17:'+(10+Math.floor(state.rng()*8)),mins:base,status:'ON TIME'},
  {name:'VIA WIGAN',depart:'17:'+(5+Math.floor(state.rng()*8)),mins:base-4,status:'ON TIME'},
  {name:'VIA MANCHESTER',depart:'17:'+(2+Math.floor(state.rng()*9)),mins:base-9,status:'ON TIME'}
 ];
 const cancel=Math.floor(state.rng()*3);routes[cancel].status='CANCELLED';
 const valid=routes.filter(x=>x.status!=='CANCELLED');const best=valid.reduce((a,b)=>a.mins<b.mins?a:b);
 const board=el('div','board','<div class="boardHead"><span>TIME</span><span>ROUTE</span><span>STATUS</span></div>');
 routes.forEach(r=>board.append(el('div','boardRow '+(r.status==='CANCELLED'?'cancel':''),'<span>'+r.depart+'</span><span>'+r.name+'</span><span class="status">'+r.status+'</span>')));st.append(board);
 const choices=el('div','routeChoices');routes.filter(x=>x.status!=='CANCELLED').forEach(r=>{const b=el('button','routeBtn','<b>'+r.name+'</b><span>EST. '+r.mins+' MINUTES</span>');b.onclick=()=>{[...choices.children].forEach(x=>x.disabled=true);finishGame(st,r===best?280:90,r===best?'CONNECTION MADE':'YOU LIVE HERE NOW',r===best?'Fastest surviving route selected.':'Technically still a route, just not the clever one.')};choices.append(b)});st.append(choices);
}

/* FESTIVAL PACK */
function gamePack(){
 const {st}=microShell('PACK THE WEEKEND','Get the useful stuff inside the bag before the timer goes. Ignore the ridiculous decoy.','packScene');
 const bag=el('div','backpack');st.append(bag);
 const score=el('div','packScore','PACKED 0 / 5');st.append(score);
 const items=[
  ['GAFFER TAPE',80,48,1],['RAINCOAT',90,55,1],['POWER BANK',72,46,1],['SUNSCREEN',62,52,1],['WATER',66,70,1],['CERAMIC VASE',82,92,0]
 ];
 let packed=0,ended=false;
 const startPositions=[[12,380],[112,395],[224,382],[316,405],[32,455],[280,474]];
 items.forEach((it,idx)=>{
   const d=el('div','packItem',it[0]);d.style.width=it[1]+'px';d.style.height=it[2]+'px';d.style.left=startPositions[idx][0]+'px';d.style.top=startPositions[idx][1]+'px';d.dataset.good=it[3];
   let offX=0,offY=0;
   d.onpointerdown=e=>{if(ended)return;const r=d.getBoundingClientRect();offX=e.clientX-r.left;offY=e.clientY-r.top;d.classList.add('drag');d.setPointerCapture&&d.setPointerCapture(e.pointerId)};
   d.onpointermove=e=>{if(!d.classList.contains('drag')||ended)return;const sr=st.getBoundingClientRect();d.style.left=(e.clientX-sr.left-offX)+'px';d.style.top=(e.clientY-sr.top-offY)+'px'};
   const end=()=>{if(!d.classList.contains('drag')||ended)return;d.classList.remove('drag');const r=d.getBoundingClientRect(),br=bag.getBoundingClientRect();const inside=r.left>br.left&&r.right<br.right&&r.top>br.top&&r.bottom<br.bottom;if(inside&&!d.dataset.packed){d.dataset.packed='1';if(d.dataset.good==='1'){packed++;score.textContent='PACKED '+packed+' / 5';d.style.borderColor='var(--acid)'}else{d.style.borderColor='var(--danger)'}}};
   d.onpointerup=end;d.onpointercancel=end;st.append(d);
 });
 countdown(st,12,null,()=>{if(ended)return;ended=true;const vase=[...st.querySelectorAll('.packItem')].find(x=>x.textContent==='CERAMIC VASE');const bad=vase&&vase.dataset.packed;const pts=Math.max(30,packed*60-(bad?90:0));finishGame(st,pts,packed===5&&!bad?'FESTIVAL COMPETENCE':packed>=4?'GOOD ENOUGH FOR KENDAL':'WE ARE BUYING THINGS THERE',packed+'/5 useful items made it. '+(bad?'You also packed a ceramic vase for reasons unknown.':''))});
}

function renderResults(){
 clear();const s=el('main','shell');
 const hero=el('section','resultHero');const img=el('img');img.src=A.couple||'';hero.append(img);
 const minutes=Math.max(1,Math.round((Date.now()-state.started)/60000));
 const title=state.score>1700?'DISTURBINGLY COMPETENT':state.score>1100?'SOLID BEHBEH ENERGY':'A BEAUTIFUL MESS';
 hero.append(el('div','resultTitle',title));s.append(hero);
 const panel=el('section','resultPanel');panel.append(el('div','eyebrow',state.mode.toUpperCase()),el('div','bigScore',scoreFmt(state.score)));
 const stats=el('div','resultStats');
 stats.append(el('div','stat','<small>CORRECT</small><b>'+state.correct+'</b>'),el('div','stat','<small>MICROGAMES</small><b>'+state.micro+'</b>'),el('div','stat','<small>BEST STREAK</small><b>'+state.best+'</b>'),el('div','stat','<small>MINUTES</small><b>'+minutes+'</b>'));
 panel.append(stats);

 if(incomingScore!==null){
   const diff=state.score-incomingScore;
   panel.append(el('div','reveal '+(diff>=0?'good':'bad'),'<strong>'+(diff>=0?'YOU TOOK IT':'THEY TOOK IT')+'</strong><p>'+playerName()+': '+scoreFmt(state.score)+' · '+esc(incomingFrom||'Them')+': '+scoreFmt(incomingScore)+'</p>'));
   const shared=Object.keys(state.coupleAnswers).filter(id=>incomingCalls[id]!==undefined);
   if(shared.length){const matches=shared.filter(id=>String(state.coupleAnswers[id])===String(incomingCalls[id])).length;panel.append(el('div','reveal','<strong>'+matches+'/'+shared.length+' COUPLE CALLS MATCHED</strong><p>The disagreements are arguably the better bit.</p>'))}
 }

 const share=el('button','share','CHALLENGE LAURA WITH THIS RUN');
 share.onclick=shareRun;panel.append(share);
 const again=el('button','again','BACK TO MENU');again.onclick=()=>{history.replaceState(null,'',location.pathname);renderHome()};panel.append(again);
 s.append(panel);root.append(s);
}
async function shareRun(){
 const u=new URL(location.href);u.search='';u.searchParams.set('seed',state.seed);u.searchParams.set('mode',state.mode);u.searchParams.set('from',playerName());u.searchParams.set('score',state.score);
 if(Object.keys(state.coupleAnswers).length)u.searchParams.set('calls',btoa(JSON.stringify(state.coupleAnswers)));
 const txt='I scored '+scoreFmt(state.score)+' on Behbeh. Same run, no excuses.';
 try{if(navigator.share)await navigator.share({title:'Behbeh challenge',text:txt,url:u.href});else{await navigator.clipboard.writeText(u.href);alert('Challenge link copied.')}}catch{}
}

renderHome();
})();