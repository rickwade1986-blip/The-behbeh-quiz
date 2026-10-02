(()=>{
'use strict';
const A=window.V5_ASSETS||{};
const BANK=window.V5_BANK||{personal:[],general:[],archive:[]};
const root=document.getElementById('app');
const qs=new URLSearchParams(location.search);
const incomingSeed=qs.get('seed');
const incomingFrom=qs.get('from');
const incomingScore=Number(qs.get('score')||0)||null;
const other=p=>p==='Rick'?'Laura':'Rick';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=s=>{let a=hash(s);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
const shuffle=(arr,r=Math.random)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const el=(tag,cls,html='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n};
const clear=()=>root.replaceChildren();
const vibrate=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch{}};
const escapeHtml=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const state={
 player:localStorage.getItem('v5-player')|| (incomingFrom?other(incomingFrom):'Rick'),
 seed:'', mode:'chaos', rand:null, events:[], index:0, score:0, streak:0,best:0, correct:0,
 microScore:0, bossScore:0, started:0, seen:new Set(JSON.parse(localStorage.getItem('v5-seen')||'[]')),
 boss:null, challenger:incomingFrom||null, challengerScore:incomingScore
};

function saveSeen(id){state.seen.add(id);const all=[...state.seen];if(all.length>500)all.splice(0,all.length-500);localStorage.setItem('v5-seen',JSON.stringify(all));}
function setPlayer(p){state.player=p;localStorage.setItem('v5-player',p);renderHome();}
function artFor(q){const c=(q.cat||'').toUpperCase();if(c.includes('FATS'))return A.fats;if(c.includes('DENISE'))return A.denise;if(c.includes('TAP'))return A.dad;if(c.includes('FESTIVAL'))return A.couple_fest;if(c.includes('RICK'))return A.silly_rick||A.rick_art;if(c.includes('LAURA'))return A.laura_art;if(c.includes('MUSIC'))return A.couple_art;return A.couple_real||A.couple_art}

function renderHome(){
 clear(); const s=el('main','v5 screen home');
 const hero=el('section','homeHero');
 const art=el('img','homeArt');art.src=A.couple_art||A.couple_real||'';hero.append(art);
 const badge=el('div','homeBadge','RICK + LAURA');hero.append(badge);s.append(hero);
 const title=el('section','titleBlock');title.innerHTML='<h1>CHAOS<br><span>DECK</span></h1><p>Your actual nonsense, turned into a game.</p>';s.append(title);
 if(incomingSeed){const b=el('div','challengeNotice',`<b>${escapeHtml(incomingFrom||'Someone')} has sent you an episode.</b><span>Same questions. Same games. Their score stays hidden until the end.</span>`);s.append(b)}
 const who=el('div','playerPick');['Rick','Laura'].forEach(p=>{const b=el('button','player '+(state.player===p?'selected':''),`I'M ${p.toUpperCase()}`);b.onclick=()=>setPlayer(p);who.append(b)});s.append(who);
 const actions=el('div','homeActions');
 const play=el('button','action primaryAction','<b>PLAY CHAOS</b><span>Questions, skill games, interruptions and a random boss.</span>');play.onclick=()=>startRun(incomingSeed?'challenge':'chaos',incomingSeed||null);actions.append(play);
 if(!incomingSeed){
  const daily=el('button','action','<b>DAILY EPISODE</b><span>One shared run for both of you today.</span>');daily.onclick=()=>startRun('daily');actions.append(daily);
  const modes=el('button','action secondaryAction','<b>PICK A FLAVOUR</b><span>Our world, music and weirdness, or archive dive.</span>');modes.onclick=renderModes;actions.append(modes);
 }
 s.append(actions);
 const strip=el('div','loreStrip','<span>TAP O\'CLOCK</span><i></i><span>43 MINNIES</span><i></i><span>WEALTHY LITTLE PIGS</span><i></i><span>SILLY BULLSHIT BITCH</span>');s.append(strip);
 root.append(s);
}

function renderModes(){
 clear();const s=el('main','v5 screen');s.append(topBar('CHOOSE A FLAVOUR',renderHome));
 const h=el('div','modeIntro','<h2>Pick your particular flavour of bullshit.</h2><p>The game still interrupts you with skill rounds. These just tilt the questions.</p>');s.append(h);
 const modes=[
  ['ourworld','OUR WORLD','People, places, chat lore and things that genuinely happened.',A.couple_real],
  ['music','MUSIC + CULTURE','Hip-hop, metal, odd music history and your own music rabbit holes.',A.couple_art],
  ['weird','WEIRD SHIT','Psychology, animals, history and facts worth actually arguing about.',A.silly_rick],
  ['archive','ARCHIVE DIVE','A smaller dose of “what actually came next?” from the chat.',A.couple_fest]
 ];
 const grid=el('div','modeGrid');
 modes.forEach(([id,name,desc,img])=>{const b=el('button','modeCard');if(img){const im=el('img','modeArt');im.src=img;b.append(im)}const tx=el('div','modeCopy',`<b>${name}</b><span>${desc}</span>`);b.append(tx);b.onclick=()=>startRun(id);grid.append(b)});s.append(grid);root.append(s);
}

function topBar(label,onBack){const d=el('div','topbar');const b=el('button','backBtn','BACK');b.onclick=onBack;d.append(b);const t=el('div','topTitle',label);d.append(t);const sc=el('div','topScore',state.score.toLocaleString());d.append(sc);return d}
function todaySeed(){const d=new Date();return `daily-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}

const micros=['m6','savvy','greggs','minnies','rap','tapshift','tent'];
const bosses=['fats','kendal','tapboss'];
function chooseQuestions(mode,count,r){
 let personal=shuffle(BANK.personal,r),general=shuffle(BANK.general,r),archive=shuffle(BANK.archive,r);
 if(mode!=='daily'&&mode!=='challenge'){
   const unseen=a=>a.filter(q=>!state.seen.has(q.id));
   personal=[...unseen(personal),...personal.filter(q=>state.seen.has(q.id))];
   general=[...unseen(general),...general.filter(q=>state.seen.has(q.id))];
   archive=[...unseen(archive),...archive.filter(q=>state.seen.has(q.id))];
 }
 let q=[];
 if(mode==='ourworld')q=[...personal.slice(0,count-1),...archive.slice(0,1)];
 else if(mode==='music'){
   const m=[...BANK.personal.filter(x=>/MUSIC/.test(x.cat)),...BANK.general.filter(x=>/MUSIC/.test(x.cat))];
   q=[...shuffle(m,r).slice(0,Math.min(count,m.length)),...general.slice(0,count)].slice(0,count);
 } else if(mode==='weird')q=general.slice(0,count);
 else if(mode==='archive')q=[...archive.slice(0,Math.ceil(count*.65)),...personal.slice(0,Math.floor(count*.35))].slice(0,count);
 else q=[...personal.slice(0,Math.ceil(count*.65)),...general.slice(0,Math.floor(count*.35))].slice(0,count);
 return shuffle(q,r);
}

function startRun(mode,providedSeed){
 state.mode=mode;state.seed=providedSeed||(mode==='daily'?todaySeed():`${mode}-${Date.now().toString(36)}`);state.rand=rng(state.seed);
 state.score=0;state.streak=0;state.best=0;state.correct=0;state.microScore=0;state.bossScore=0;state.index=0;state.started=Date.now();
 const questions=chooseQuestions(mode,6,state.rand);
 const mg=shuffle(micros,state.rand).slice(0,4);
 state.boss=shuffle(bosses,state.rand)[0];
 state.events=[
   {kind:'question',data:questions[0]},
   {kind:'micro',data:mg[0]},
   {kind:'question',data:questions[1]},
   {kind:'micro',data:mg[1]},
   {kind:'question',data:questions[2]},
   {kind:'question',data:questions[3]},
   {kind:'micro',data:mg[2]},
   {kind:'question',data:questions[4]},
   {kind:'micro',data:mg[3]},
   {kind:'question',data:questions[5]},
   {kind:'boss',data:state.boss}
 ];
 renderEvent();
}

function progress(){return Math.round((state.index/state.events.length)*100)}
function gameHeader(label){const wrap=el('div','gameHeader');const line=el('div','gameHeadLine');const quit=el('button','quitBtn','EXIT');quit.onclick=()=>{if(confirm('Quit this run?'))renderHome()};line.append(quit);line.append(el('div','runLabel',label));line.append(el('div','runScore',state.score.toLocaleString()));wrap.append(line);const p=el('div','runProgress');p.innerHTML=`<i style="width:${progress()}%"></i>`;wrap.append(p);return wrap}

function renderEvent(){
 if(state.index>=state.events.length)return renderResult();
 const ev=state.events[state.index];
 if(ev.kind==='question')return renderQuestion(ev.data);
 if(ev.kind==='micro')return renderMicroIntro(ev.data);
 if(ev.kind==='boss')return renderBossIntro(ev.data);
}
function nextEvent(){state.index++;renderEvent()}

function renderQuestion(q){
 clear();const s=el('main','v5 screen gameScreen');s.append(gameHeader(q.cat));
 const body=el('section','questionScene');
 const img=artFor(q);if(img){const artWrap=el('div','questionArt');const im=el('img');im.src=img;artWrap.append(im);body.append(artWrap)}
 const card=el('div',q.type==='archive'?'archiveCard':'questionCard');
 if(q.type==='archive'){
   card.innerHTML=`<div class="archiveMeta">${escapeHtml(q.speaker||'CHAT')} · ${escapeHtml(q.date||'')}</div><div class="archivePrompt">${escapeHtml(q.q)}</div><div class="archiveAsk">WHAT ACTUALLY CAME NEXT?</div>`;
 } else card.innerHTML=`<div class="questionTag">${escapeHtml(q.cat)}</div><h2>${escapeHtml(q.q)}</h2>`;
 body.append(card);
 const answers=el('div','answerGrid');let locked=false;
 q.o.forEach((opt,i)=>{const b=el('button','answerBtn',`<span>${String.fromCharCode(65+i)}</span><b>${escapeHtml(opt)}</b>`);b.onclick=()=>{if(locked)return;locked=true;const ok=i===q.a;[...answers.children].forEach((x,j)=>{x.disabled=true;if(j===q.a)x.classList.add('correct');if(j===i&&!ok)x.classList.add('wrong')});if(ok){state.streak++;state.best=Math.max(state.best,state.streak);state.correct++;state.score+=120+state.streak*20;vibrate(25)}else{state.streak=0;vibrate([40,35,40])}saveSeen(q.id);const r=el('div','answerReveal '+(ok?'good':'bad'),`<b>${ok?'NAILED IT':'ABSOLUTE RUBBISH'}</b><p>${escapeHtml(q.r)}</p>`);body.append(r);const n=el('button','nextBtn','NEXT ROUND');n.onclick=nextEvent;body.append(n);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})};answers.append(b)});body.append(answers);s.append(body);root.append(s);
}

const microMeta={
 m6:['ESCAPE THE M6','Drag the car. Survive the traffic long enough to earn points.'],
 savvy:['SAVE THE SAVVY B','Drag the glass under the falling pour. Catch enough without missing everything.'],
 greggs:['GREGGS DOCTRINE','The belt is moving. Take sausage rolls. Leave the impostors alone.'],
 minnies:['43 MINNIES','Stop the dial as close to 43 as you can. Three attempts.'],
 rap:['PRESTON NATE DOGG','Hit the beat line as the bars arrive. Timing matters.'],
 tapshift:['TAP SHIFT','Denise is working. Drag the right drink to the right regular.'],
 tent:['FIX THE FESTIVAL','Drag the three poles into their matching sockets before the wind wins.']
};
function renderMicroIntro(id){clear();const [name,desc]=microMeta[id];const s=el('main','v5 screen interScreen');const box=el('section','interCard');box.innerHTML=`<div class="interKicker">MICROGAME</div><h1>${name}</h1><p>${desc}</p>`;const art=el('img','interArt');art.src=id==='tapshift'?A.denise:id==='tent'?A.couple_fest:id==='m6'?A.couple_real:id==='savvy'?A.laura_art:id==='rap'?A.rick_art:A.couple_art;box.append(art);const go=el('button','startBtn','GO');go.onclick=()=>runMicro(id);box.append(go);s.append(box);root.append(s)}
function microDone(points,title,copy){state.microScore+=points;state.score+=points;clear();const s=el('main','v5 screen interScreen');const box=el('section','microResult');box.innerHTML=`<div class="microResultKicker">MICROGAME CLEAR</div><h1>${escapeHtml(title)}</h1><div class="microPoints">+${points}</div><p>${escapeHtml(copy)}</p>`;const n=el('button','nextBtn','KEEP GOING');n.onclick=nextEvent;box.append(n);s.append(box);root.append(s)}
function failMicro(points,title,copy){state.microScore+=points;state.score+=points;clear();const s=el('main','v5 screen interScreen');const box=el('section','microResult fail');box.innerHTML=`<div class="microResultKicker">SURVIVED, TECHNICALLY</div><h1>${escapeHtml(title)}</h1><div class="microPoints">+${points}</div><p>${escapeHtml(copy)}</p>`;const n=el('button','nextBtn','MOVE ON QUICKLY');n.onclick=nextEvent;box.append(n);s.append(box);root.append(s)}
function runMicro(id){({m6:microM6,savvy:microSavvy,greggs:microGreggs,minnies:microMinnies,rap:microRap,tapshift:microTapShift,tent:microTent}[id]||microMinnies)()}

function microShell(title,sub){clear();const s=el('main','v5 screen microScreen');s.append(gameHeader('MICROGAME'));const h=el('div','microHead',`<div class="microKicker">DO THE THING</div><h1>${title}</h1><p>${sub}</p>`);s.append(h);const stage=el('div','microStage');s.append(stage);root.append(s);return{screen:s,stage}}

function microM6(){
 const {screen,stage}=microShell('ESCAPE THE M6','Drag left and right. Eight seconds. Try not to become stationary traffic.');stage.classList.add('roadStage');
 const car=el('div','playerCar','R');stage.append(car);let x=.5;let running=true;let score=0;let obs=[];let start=performance.now(),lastSpawn=0;
 const setX=e=>{const r=stage.getBoundingClientRect();const px=('touches'in e?e.touches[0].clientX:e.clientX)-r.left;x=clamp(px/r.width,.08,.92);car.style.left=`calc(${x*100}% - 24px)`};stage.onpointerdown=e=>{stage.setPointerCapture(e.pointerId);setX(e)};stage.onpointermove=e=>{if(e.buttons)setX(e)};
 function spawn(){const o=el('div','trafficCar');const lane=Math.floor(state.rand()*3);o.style.left=`calc(${(lane+.5)/3*100}% - 22px)`;o.style.top='-85px';stage.append(o);obs.push({el:o,y:-85,lane});}
 function tick(t){if(!running)return;const dt=(t-start)/1000;if(t-lastSpawn>600){spawn();lastSpawn=t}const rect=stage.getBoundingClientRect();obs.forEach(o=>{o.y+=3.2;o.el.style.top=o.y+'px';const ox=parseFloat(o.el.style.left)||0;const or=o.el.getBoundingClientRect(),cr=car.getBoundingClientRect();if(!(cr.right<or.left||cr.left>or.right||cr.bottom<or.top||cr.top>or.bottom)){running=false;vibrate([60,30,60]);setTimeout(()=>failMicro(Math.max(40,Math.round(score)),'M6 WINS AGAIN','You made progress, which is more than the actual motorway can promise.'),250)}});obs=obs.filter(o=>{if(o.y>rect.height){o.el.remove();score+=30;return false}return true});if(dt>=8&&running){running=false;microDone(220+Math.round(score),'MOTORWAY DEFEATED','For eight glorious seconds, Lancashire transport infrastructure did not control you.');return}requestAnimationFrame(tick)}
 requestAnimationFrame(tick)
}

function microSavvy(){
 const {stage}=microShell('SAVE THE SAVVY B','Drag the glass. Catch the falling pour for nine seconds.');stage.classList.add('savvyStage');
 const bottle=el('div','bottleShape');bottle.innerHTML='<i></i>';stage.append(bottle);const glass=el('div','glassShape');glass.innerHTML='<i></i>';stage.append(glass);const fill=glass.querySelector('i');let gx=.5,caught=0,miss=0,drops=[],run=true,start=performance.now(),spawnAt=0;
 const move=e=>{const r=stage.getBoundingClientRect();const px=e.clientX-r.left;gx=clamp(px/r.width,.12,.88);glass.style.left=`calc(${gx*100}% - 36px)`};stage.onpointerdown=e=>{stage.setPointerCapture(e.pointerId);move(e)};stage.onpointermove=e=>{if(e.buttons)move(e)};
 function addDrop(){const d=el('div','wineDrop');const bx=.18+state.rand()*.64;d.style.left=(bx*100)+'%';d.style.top='80px';stage.append(d);drops.push({el:d,x:bx,y:80})}
 function tick(t){if(!run)return;const sec=(t-start)/1000;bottle.style.left=`calc(${(50+Math.sin(t/450)*27)}% - 34px)`;if(t-spawnAt>310){addDrop();spawnAt=t}const sr=stage.getBoundingClientRect(),gr=glass.getBoundingClientRect();drops.forEach(d=>{d.y+=4.2;d.el.style.top=d.y+'px';const dr=d.el.getBoundingClientRect();if(d.y>sr.height-125){if(!(dr.right<gr.left||dr.left>gr.right)){caught++;d.y=9999;d.el.remove();fill.style.height=Math.min(90,caught*8)+'%';vibrate(8)}else if(d.y>sr.height-55){miss++;d.el.remove();d.y=9999}}});drops=drops.filter(d=>d.y<9000);if(sec>=9){run=false;const pts=Math.max(40,caught*28-miss*4);(caught>=8?microDone:failMicro)(pts,caught>=8?'POUR SAVED':'MOSTLY TABLE','Caught '+caught+' pours. Denise would have opinions about the wastage.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function microGreggs(){
 const {stage}=microShell('GREGGS DOCTRINE','Tap sausage rolls as they cross the belt. Do not be seduced by the bean melt.');stage.classList.add('beltStage');
 const belt=el('div','belt');stage.append(belt);const scoreBox=el('div','beltScore','0');stage.append(scoreBox);let points=0,items=[],running=true,start=performance.now(),spawnAt=0;const foods=['SAUSAGE ROLL','STEAK BAKE','BEAN MELT','VEGAN BAKE','DOUGHNUT'];
 function spawn(){const name=foods[Math.floor(state.rand()*foods.length)];const x=el('button','foodItem',name);x.dataset.good=String(name==='SAUSAGE ROLL');x.onclick=()=>{if(x.dataset.hit)return;x.dataset.hit='1';if(name==='SAUSAGE ROLL'){points+=1;x.classList.add('hit');vibrate(10)}else{points=Math.max(0,points-1);x.classList.add('miss');vibrate(30)}scoreBox.textContent=points};belt.append(x);items.push({el:x,x:110})}
 function tick(t){if(!running)return;if(t-spawnAt>670){spawn();spawnAt=t}items.forEach(it=>{it.x-=.45;it.el.style.left=it.x+'%';if(it.x<-40){it.el.remove();it.x=-999}});items=items.filter(x=>x.x>-900);if((t-start)/1000>=10){running=false;const pts=points*45;(points>=4?microDone:failMicro)(Math.max(30,pts),points>=4?'DOCTRINE PRESERVED':'GREGGS DISCIPLINARY','You secured '+points+' legitimate sausage rolls.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function microMinnies(){
 const {stage}=microShell('43 MINNIES','Stop the dial near 43. Three attempts.');stage.classList.add('minniesStage');const dial=el('div','minnieDial','00');stage.append(dial);const stop=el('button','stopDial','STOP');stage.append(stop);const tries=el('div','tries','ATTEMPT 1 OF 3');stage.append(tries);let attempt=1,total=0,active=true,start=performance.now();
 function frame(t){if(!active)return;const n=Math.floor(((t-start)/22)%60);dial.textContent=String(n).padStart(2,'0');requestAnimationFrame(frame)}
 stop.onclick=()=>{if(!active)return;const n=Number(dial.textContent),diff=Math.abs(n-43),pts=Math.max(0,100-diff*6);total+=pts;dial.classList.add(diff<=2?'near':'off');active=false;setTimeout(()=>{if(attempt>=3){(total>=220?microDone:failMicro)(Math.round(total),'43 MINNIES',total>=220?'Suspiciously precise. Laura time has been briefly domesticated.':'Time remains a concept rather than a promise.')}else{attempt++;tries.textContent=`ATTEMPT ${attempt} OF 3`;dial.className='minnieDial';start=performance.now();active=true;requestAnimationFrame(frame)}},650)};requestAnimationFrame(frame)
}

function microRap(){
 const {stage}=microShell('PRESTON NATE DOGG','Tap the pad when each bar reaches the beat line.');stage.classList.add('rhythmStage');const line=el('div','beatLine');stage.append(line);const pad=el('button','beatPad','HIT');stage.append(pad);let notes=[],hits=0,miss=0,start=performance.now(),spawn=0,running=true;
 function add(){const n=el('div','beatBar');n.style.left='100%';stage.append(n);notes.push({el:n,x:100,hit:false})}
 pad.onclick=()=>{let best=null,dist=999;notes.forEach(n=>{if(!n.hit){const d=Math.abs(n.x-18);if(d<dist){dist=d;best=n}}});if(best&&dist<10){best.hit=true;best.el.classList.add('hit');hits++;vibrate(12)}else{miss++;pad.classList.add('badHit');setTimeout(()=>pad.classList.remove('badHit'),120)}};
 function tick(t){if(!running)return;if(t-spawn>820&&((t-start)/1000)<7.5){add();spawn=t}notes.forEach(n=>{n.x-=.75;n.el.style.left=n.x+'%';if(n.x<4&&!n.hit){n.hit=true;n.el.classList.add('missed');miss++}});if((t-start)/1000>=9){running=false;const pts=Math.max(30,hits*45-miss*8);(hits>=6?microDone:failMicro)(pts,hits>=6?'PRESTON NATE DOGG':'RHYTHM UNDER REVIEW',`Clean hits: ${hits}. Misses: ${miss}.`);return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function microTapShift(){
 const {stage}=microShell('TAP SHIFT','Drag the correct drink onto each regular. Denise is judging this.');stage.classList.add('tapStage');const den=el('img','deniseBar');den.src=A.denise;stage.append(den);const orders=[['Dad','SWAN BLONDE',A.dad],['Laura','SAVVY B',A.laura_art],['Rick','PINT OF WHATEVER',A.silly_rick]];let step=0,score=0;
 function round(){stage.querySelectorAll('.orderCard,.drinkRack').forEach(x=>x.remove());if(step>=orders.length){(score===3?microDone:failMicro)(score*90,score===3?'DENISE APPROVES':'BAR TRAINING REQUIRED',`${score} of 3 orders reached the right person.`);return}const [name,want,img]=orders[step];const c=el('div','orderCard');const im=el('img');im.src=img;c.append(im);c.append(el('div','orderText',`<b>${name.toUpperCase()}</b><span>${want}</span>`));stage.append(c);const rack=el('div','drinkRack');const drinks=shuffle(['SWAN BLONDE','SAVVY B','PINT OF WHATEVER'],state.rand);drinks.forEach(d=>{const chip=el('div','drinkChip',d);chip.draggable=false;let drag=false;const move=e=>{if(!drag)return;chip.style.position='fixed';chip.style.zIndex='999';chip.style.left=(e.clientX-55)+'px';chip.style.top=(e.clientY-24)+'px'};chip.onpointerdown=e=>{drag=true;chip.setPointerCapture(e.pointerId);move(e)};chip.onpointermove=move;chip.onpointerup=e=>{if(!drag)return;drag=false;const r=c.getBoundingClientRect();const hit=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;if(hit&&d===want){score++;vibrate(15)}else vibrate(35);step++;round()};rack.append(chip)});stage.append(rack)}round()
}

function microTent(){
 const {stage}=microShell('FIX THE FESTIVAL','Drag each coloured pole tip into the matching socket.');stage.classList.add('tentStage');const tent=el('div','tentCanvas');stage.append(tent);const colors=['pink','blue','lime'];let done=0;colors.forEach((c,i)=>{const target=el('div','poleTarget '+c);target.style.left=(20+i*30)+'%';target.style.top=(22+i*12)+'%';tent.append(target);const pole=el('div','tentPole '+c);pole.style.left=(12+i*28)+'%';pole.style.top=(72-i*5)+'%';tent.append(pole);let dragging=false;const move=e=>{if(!dragging)return;const r=tent.getBoundingClientRect();pole.style.left=clamp((e.clientX-r.left)/r.width*100,5,92)+'%';pole.style.top=clamp((e.clientY-r.top)/r.height*100,8,88)+'%'};pole.onpointerdown=e=>{dragging=true;pole.setPointerCapture(e.pointerId)};pole.onpointermove=move;pole.onpointerup=e=>{dragging=false;const a=pole.getBoundingClientRect(),b=target.getBoundingClientRect(),cx=a.left+a.width/2,cy=a.top+a.height/2;if(cx>b.left&&cx<b.right&&cy>b.top&&cy<b.bottom){pole.classList.add('locked');target.classList.add('locked');pole.style.pointerEvents='none';done++;vibrate(12);if(done===3)setTimeout(()=>microDone(280,'TENT SECURED','The festival infrastructure survives. Denise may now safely invite you again.'),250)}else{vibrate(25)}}});
}

const bossNames={fats:'FATS: PRESTON INCIDENT',kendal:'KENDAL CALLING',tapboss:'TAP O’CLOCK'};
function renderBossIntro(id){clear();const s=el('main','v5 screen bossIntro');const art=el('img','bossIntroArt');art.src=id==='fats'?A.fats:id==='kendal'?A.couple_fest:A.dad;s.append(art);const tx=el('div','bossIntroCopy');tx.innerHTML=`<div class="bossKicker">BOSS ROUND</div><h1>${bossNames[id]}</h1><p>${id==='fats'?'Three separate Fats problems. None involve a roast.':id==='kendal'?'Survive the festival logistics that somehow became a lifestyle.':'It is 4pm. Dad has arrived. Denise is working. Do not embarrass the family.'}</p>`;const b=el('button','startBtn','START BOSS');b.onclick=()=>runBoss(id);tx.append(b);s.append(tx);root.append(s)}
function runBoss(id){if(id==='fats')bossFats();else if(id==='kendal')bossKendal();else bossTap()}
function bossResult(points,title,copy){state.bossScore+=points;state.score+=points;clear();const s=el('main','v5 screen bossResult');const art=el('img','bossResultArt');art.src=state.boss==='fats'?A.fats:state.boss==='kendal'?A.couple_fest:A.dad;s.append(art);const c=el('div','bossResultCard',`<div class="bossKicker">BOSS CLEARED</div><h1>${escapeHtml(title)}</h1><div class="bossPts">+${points}</div><p>${escapeHtml(copy)}</p>`);const n=el('button','nextBtn','SHOW RESULTS');n.onclick=nextEvent;c.append(n);s.append(c);root.append(s)}

function bossFats(){
 // Three fast phases: train switches, location triangulation, freebies catch
 clear();const s=el('main','v5 screen bossScreen');s.append(gameHeader('FATS: PRESTON INCIDENT'));const stage=el('div','bossStage fatsBoss');s.append(stage);root.append(s);let total=0,phase=0;
 function phase1(){stage.innerHTML='<div class="bossPhase">PHASE 1 OF 3</div><h2>TRAIN RAGE</h2><p>Keep Fats off the closed lines. Switch lanes before each red block reaches him.</p><div class="trainTrack"><div class="trainToken">F</div></div><div class="trackButtons"><button>LEFT</button><button>CENTRE</button><button>RIGHT</button></div>';let lane=1,obstacles=[],start=performance.now(),spawn=0,alive=true,passed=0;const train=stage.querySelector('.trainToken'),track=stage.querySelector('.trainTrack');[...stage.querySelectorAll('.trackButtons button')].forEach((b,i)=>b.onclick=()=>{lane=i;train.style.left=`calc(${(i+.5)/3*100}% - 20px)`});function tick(t){if(!alive)return;if(t-spawn>650){const l=Math.floor(state.rand()*3);const o=el('div','trackBlock');o.style.left=`calc(${(l+.5)/3*100}% - 22px)`;o.style.top='-50px';track.append(o);obstacles.push({el:o,l,y:-50});spawn=t}obstacles.forEach(o=>{o.y+=4;o.el.style.top=o.y+'px';if(o.y>260&&o.y<330&&o.l===lane){alive=false;vibrate(60);setTimeout(()=>{total+=Math.max(20,passed*20);phase2()},350)}if(o.y>350){passed++;o.el.remove();o.y=9999}});obstacles=obstacles.filter(o=>o.y<9000);if((t-start)/1000>7&&alive){alive=false;total+=180+passed*15;phase2();return}requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 function phase2(){stage.innerHTML='<div class="bossPhase">PHASE 2 OF 3</div><h2>SHARE YOUR LOCATION</h2><p>Laura is trying to find Fats. Watch the three signal pulses, then tap where you think he is.</p><div class="mapBoard"></div>';const map=stage.querySelector('.mapBoard');const target={x:20+state.rand()*60,y:25+state.rand()*50};let pulses=0;function pulse(){if(pulses>=3){map.classList.add('armed');const hint=el('div','mapHint','TAP THE MAP');map.append(hint);map.onclick=e=>{map.onclick=null;const r=map.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100,d=Math.hypot(x-target.x,y-target.y);total+=Math.max(20,180-Math.round(d*4));const dot=el('div','actualDot');dot.style.left=target.x+'%';dot.style.top=target.y+'%';map.append(dot);setTimeout(phase3,800)};return}const ring=el('div','signalRing');ring.style.left=(target.x-12+state.rand()*24)+'%';ring.style.top=(target.y-12+state.rand()*24)+'%';map.append(ring);setTimeout(()=>ring.remove(),900);pulses++;setTimeout(pulse,1050)}pulse()}
 function phase3(){stage.innerHTML='<div class="bossPhase">PHASE 3 OF 3</div><h2>FREEBIE RAID</h2><p>Catch the jeans and skincare Fats gave Laura. Let the random junk fall.</p><div class="catchField"><div class="catchBasket">KEEP</div></div>';const field=stage.querySelector('.catchField'),basket=stage.querySelector('.catchBasket');let bx=.5,items=[],score=0,start=performance.now(),spawn=0,run=true;const move=e=>{const r=field.getBoundingClientRect();bx=clamp((e.clientX-r.left)/r.width,.12,.88);basket.style.left=`calc(${bx*100}% - 43px)`};field.onpointerdown=e=>{field.setPointerCapture(e.pointerId);move(e)};field.onpointermove=e=>{if(e.buttons)move(e)};function tick(t){if(!run)return;if(t-spawn>480){const good=state.rand()<.56;const it=el('div','fallItem '+(good?'goodItem':'junkItem'),good?(state.rand()<.5?'JEANS':'SKINCARE'):(state.rand()<.5?'RANDOM CABLE':'OLD RECEIPT'));const x=.1+state.rand()*.8;it.style.left=(x*100)+'%';it.style.top='-40px';field.append(it);items.push({el:it,x,y:-40,good});spawn=t}const br=basket.getBoundingClientRect(),fr=field.getBoundingClientRect();items.forEach(it=>{it.y+=3.5;it.el.style.top=it.y+'px';const ir=it.el.getBoundingClientRect();if(it.y>fr.height-90){const hit=!(ir.right<br.left||ir.left>br.right);if(hit)score+=it.good?1:-1;it.el.remove();it.y=9999}});items=items.filter(i=>i.y<9000);if((t-start)/1000>8){run=false;total+=Math.max(20,score*45+100);bossResult(total,'FATS LOCATED','Trains survived, location obtained, freebies secured. A surprisingly complete evening.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 phase1()
}

function bossKendal(){
 clear();const s=el('main','v5 screen bossScreen');s.append(gameHeader('KENDAL CALLING'));const stage=el('div','bossStage kendalBoss');s.append(stage);root.append(s);let total=0;
 // phase 1 memory pack
 stage.innerHTML='<div class="bossPhase">PHASE 1 OF 3</div><h2>PACK THE FIELD</h2><p>Memorise the five things. They disappear in three seconds.</p><div class="packList"><b>TENT</b><b>WRISTBAND</b><b>POWER BANK</b><b>WATER</b><b>SUN CREAM</b></div>';
 setTimeout(()=>{const items=['TENT','WRISTBAND','POWER BANK','WATER','SUN CREAM','HAIR DRYER','DINNER PLATE','DESK LAMP'];stage.innerHTML='<div class="bossPhase">PHASE 1 OF 3</div><h2>PACK THE FIELD</h2><p>Select the five actual items.</p><div class="packChoices"></div>';let picked=new Set();const box=stage.querySelector('.packChoices');shuffle(items,state.rand).forEach(x=>{const b=el('button','packChoice',x);b.onclick=()=>{if(picked.has(x)){picked.delete(x);b.classList.remove('on')}else if(picked.size<5){picked.add(x);b.classList.add('on')}if(picked.size===5){const good=['TENT','WRISTBAND','POWER BANK','WATER','SUN CREAM'].filter(x=>picked.has(x)).length;total+=good*35;setTimeout(phase2,450)}};box.append(b)})},3000);
 function phase2(){stage.innerHTML='<div class="bossPhase">PHASE 2 OF 3</div><h2>DENISE\'S POLE</h2><p>Navigate the crowd to the meeting point. Drag Rick through the gaps.</p><div class="crowdMaze"><div class="mazePlayer">R</div><div class="mazeGoal">DENISE</div><i class="crowd c1"></i><i class="crowd c2"></i><i class="crowd c3"></i><i class="crowd c4"></i><i class="crowd c5"></i></div>';const maze=stage.querySelector('.crowdMaze'),p=stage.querySelector('.mazePlayer'),goal=stage.querySelector('.mazeGoal');let done=false;const move=e=>{if(done)return;const r=maze.getBoundingClientRect();const x=clamp(e.clientX-r.left,20,r.width-20),y=clamp(e.clientY-r.top,20,r.height-20);p.style.left=(x-18)+'px';p.style.top=(y-18)+'px';const pr=p.getBoundingClientRect(),gr=goal.getBoundingClientRect();const crowds=[...stage.querySelectorAll('.crowd')];if(crowds.some(c=>{const cr=c.getBoundingClientRect();return !(pr.right<cr.left||pr.left>cr.right||pr.bottom<cr.top||pr.top>cr.bottom)})){total=Math.max(0,total-10);vibrate(20)}if(!(pr.right<gr.left||pr.left>gr.right||pr.bottom<gr.top||pr.top>gr.bottom)){done=true;total+=170;setTimeout(phase3,350)}};maze.onpointerdown=e=>{maze.setPointerCapture(e.pointerId);move(e)};maze.onpointermove=e=>{if(e.buttons)move(e)}}
 function phase3(){stage.innerHTML='<div class="bossPhase">PHASE 3 OF 3</div><h2>FESTIVAL VERB</h2><p>The meter is going feral. Stop it inside the READY TO FESTIVAL zone.</p><div class="festivalMeter"><i class="festZone"></i><b class="festNeedle"></b></div><button class="bossStop">STOP</button>';const needle=stage.querySelector('.festNeedle'),btn=stage.querySelector('.bossStop');let run=true,start=performance.now(),pos=0;function tick(t){if(!run)return;pos=(Math.sin((t-start)/320)+1)/2*100;needle.style.left=pos+'%';requestAnimationFrame(tick)}btn.onclick=()=>{run=false;const diff=Math.abs(pos-72);total+=Math.max(20,190-Math.round(diff*5));setTimeout(()=>bossResult(total,'READY TO FESTIVAL','The field has accepted you. Grammar has not.'),450)};requestAnimationFrame(tick)}
}

function bossTap(){
 clear();const s=el('main','v5 screen bossScreen');s.append(gameHeader('TAP O’CLOCK'));const stage=el('div','bossStage tapBoss');s.append(stage);root.append(s);let total=0;
 stage.innerHTML='<div class="bossPhase">PHASE 1 OF 3</div><h2>SET TAP O’CLOCK</h2><p>Drag the minute hand to 12 and the hour hand to 4.</p><div class="clock"><i class="hourHand"></i><i class="minuteHand"></i><b></b></div><button class="clockLock">LOCK TIME</button>';const clock=stage.querySelector('.clock'),hour=stage.querySelector('.hourHand'),minute=stage.querySelector('.minuteHand');let active=hour;[hour,minute].forEach(h=>h.onpointerdown=e=>{active=h;clock.setPointerCapture(e.pointerId)});clock.onpointermove=e=>{if(!e.buttons)return;const r=clock.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,ang=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;active.style.transform=`rotate(${ang}deg)`;active.dataset.ang=ang};stage.querySelector('.clockLock').onclick=()=>{const ha=Number(hour.dataset.ang||0),ma=Number(minute.dataset.ang||0);const norm=a=>(a%360+360)%360;const dh=Math.min(Math.abs(norm(ha)-120),360-Math.abs(norm(ha)-120)),dm=Math.min(Math.abs(norm(ma)-0),360-Math.abs(norm(ma)-0));total+=Math.max(20,200-Math.round((dh+dm)*1.5));phase2()};
 function phase2(){stage.innerHTML='<div class="bossPhase">PHASE 2 OF 3</div><h2>DAD HAS ARRIVED</h2><p>Hold to pour. Release inside the Swan Blonde line.</p><div class="pint"><i></i><em>SWAN BLONDE</em></div><button class="pourBtn">HOLD TO POUR</button>';const fill=stage.querySelector('.pint i'),b=stage.querySelector('.pourBtn');let amt=0,raf=null,holding=false;function tick(){if(!holding)return;amt+=.7;fill.style.height=Math.min(100,amt)+'%';if(amt>=100)holding=false;else raf=requestAnimationFrame(tick)}b.onpointerdown=()=>{holding=true;tick()};b.onpointerup=()=>{holding=false;cancelAnimationFrame(raf);const diff=Math.abs(amt-82);total+=Math.max(20,190-Math.round(diff*5));setTimeout(phase3,450)}}
 function phase3(){stage.innerHTML='<div class="bossPhase">PHASE 3 OF 3</div><h2>DENISE\'S SHIFT</h2><p>Final order. Drag Swan Blonde to Dad, Savvy B to Laura, and “whatever” to Rick.</p><div class="tapBossServe"></div>';const box=stage.querySelector('.tapBossServe');const people=[['DAD','SWAN BLONDE',A.dad],['LAURA','SAVVY B',A.laura_art],['RICK','WHATEVER',A.silly_rick]];let idx=0,good=0;function one(){box.innerHTML='';if(idx>=people.length){total+=good*65;bossResult(total,'TAP O’CLOCK COMPLETE',good===3?'No one was served the wrong personality. Dad can relax.':'Denise has put you on retraining.');return}const [name,want,img]=people[idx];const p=el('div','servePerson');const im=el('img');im.src=img;p.append(im);p.append(el('b','',name));box.append(p);const rack=el('div','serveRack');shuffle(['SWAN BLONDE','SAVVY B','WHATEVER'],state.rand).forEach(d=>{const b=el('button','serveDrink',d);b.onclick=()=>{if(d===want)good++;idx++;one()};rack.append(b)});box.append(rack)}one()}
}

function renderResult(){
 clear();const s=el('main','v5 screen resultScreen');const hero=el('section','resultHero');const im=el('img');im.src=A.couple_art;hero.append(im);const stamp=el('div','resultStamp',verdict());hero.append(stamp);s.append(hero);const panel=el('section','resultPanel');panel.innerHTML=`<div class="resultLabel">FINAL DAMAGE</div><div class="finalScore">${state.score.toLocaleString()}</div><div class="resultStats"><div><span>QUESTIONS</span><b>${state.correct}/6</b></div><div><span>BEST STREAK</span><b>${state.best}</b></div><div><span>MICROGAMES</span><b>${state.microScore}</b></div><div><span>BOSS</span><b>${state.bossScore}</b></div></div>`;
 if(state.challengerScore!==null){const vs=el('div','versusBox',`<div><span>${escapeHtml(state.challenger||other(state.player))}</span><b>${state.challengerScore.toLocaleString()}</b></div><i>VS</i><div><span>${state.player}</span><b>${state.score.toLocaleString()}</b></div>`);panel.append(vs)}
 else{const share=el('button','shareBtn','CHALLENGE '+other(state.player).toUpperCase());share.onclick=shareChallenge;panel.append(share)}
 const again=el('button','shareBtn secondary','PLAY ANOTHER');again.onclick=()=>{history.replaceState({},'',location.pathname);state.challenger=null;state.challengerScore=null;renderHome()};panel.append(again);s.append(panel);root.append(s)
}
function verdict(){if(state.score>1700)return 'DISGUSTINGLY COMPETENT';if(state.score>1300)return 'CHAOS PROFESSIONAL';if(state.score>900)return 'VERY WORKABLE';return 'SILLY BULLSHIT PERFORMANCE'}
async function shareChallenge(){const u=new URL(location.href);u.search='';u.searchParams.set('seed',state.seed);u.searchParams.set('from',state.player);u.searchParams.set('score',String(state.score));const txt=`I scored ${state.score} on Chaos Deck. Same run. Your turn.`;try{if(navigator.share)await navigator.share({title:'Chaos Deck',text:txt,url:u.toString()});else{await navigator.clipboard.writeText(u.toString());alert('Challenge link copied.')}}catch{}}

renderHome();
})();