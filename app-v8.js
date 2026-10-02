(()=>{
'use strict';
const root=document.getElementById('app');
const ART=window.V7_ASSETS||{};
const PEOPLE=window.V5_ASSETS||{};
const CURATED=window.V7_CURATED||[];
const QUALITY=window.V8_CURATED||[];
const OLD=window.V5_BANK||{personal:[],general:[],archive:[]};
const params=new URLSearchParams(location.search);
const incomingSeed=params.get('seed');
const incomingMode=params.get('mode');
const incomingFrom=params.get('from');
const incomingScore=Number(params.get('score')||0)||null;

const $=(tag,cls,html='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n};
const clear=()=>root.replaceChildren();
const clean=s=>String(s??'').replace(/\p{Extended_Pictographic}/gu,'').replace(/[\uFE0F\u200D]/g,'').replace(/[\u{1F3FB}-\u{1F3FF}]/gu,'');
const esc=s=>clean(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=s=>{let a=hash(s);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
const shuffle=(a,r=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>{const d=new Date();return `daily-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};

const getStore=(k,d)=>{try{return localStorage.getItem(k)||d}catch{return d}};
const setStore=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const state={player:getStore('rl-player','Rick'),seed:'',rand:Math.random,mode:'quick',events:[],i:0,score:0,correct:0,streak:0,best:0,mini:0,started:0,challenger:incomingFrom,challengerScore:incomingScore};

const CAT={
 'US':{img:ART.cat_us,title:'US'},'MUSIC':{img:ART.cat_music,title:'MUSIC'},'TRAVEL':{img:ART.cat_travel,title:'TRAVEL'},'ANIMALS':{img:ART.cat_animals,title:'ANIMALS'},
 'HUMAN BODY':{img:ART.cat_body,title:'HUMAN BODY'},'PSYCHOLOGY':{img:ART.cat_psych,title:'PSYCHOLOGY'},'HISTORY':{img:ART.cat_history,title:'HISTORY'},'FOOD + DRINK':{img:ART.cat_food,title:'FOOD + DRINK'},
 'WEIRD SHIT':{img:ART.cat_random,title:'WEIRD SHIT'},'FATS FILES':{img:ART.cat_fats,title:'FATS'}
};

const CALLS=[
 ['A quick drink turns into six hours. Who is most likely to be responsible?','Rick','Laura','Both'],
 ['Who is more likely to lose three hours building a playlist and call it productive?','Rick','Laura','Both'],
 ['Who is more likely to leave a transport disaster with a brand-new friend?','Rick','Laura','Both'],
 ['Who is more likely to propose the gym and a drinking session in the same sentence?','Rick','Laura','Both'],
 ['Who is more likely to say they are leaving Tap and still be there ninety minutes later?','Rick','Laura','Both'],
 ['Who becomes more dangerous when given a festival wristband and no immediate responsibilities?','Rick','Laura','Both'],
 ['Who is more likely to turn a perfectly sensible plan into a much bigger plan?','Rick','Laura','Both'],
 ['Who is more likely to be awake at a ridiculous hour researching something that could wait?','Rick','Laura','Both']
];
const FINISH=[
 {q:'“Love going to a pretentious bar for a…”',o:['water','wine','lager','coffee'],a:0,r:'The very first date nearly started with a pint of water.'},
 {q:'“Greggs isn’t a choice baby, it’s a…”',o:['summons','calling','lifestyle','warning'],a:0,r:'A summons. The pastry has spoken.'},
 {q:'“I love your stupid…”',o:['brain','face','glasses','car'],a:0,r:'Brain. Said while Rick was hunting for his glasses.'},
 {q:'“All is…”',o:['workable','fine','chaos','fixable'],a:0,r:'Workable. Broken tent pole, slugs and all.'},
 {q:'“Take me, I…”',o:['love this','am ready','need this','trust you'],a:0,r:'Love this. The correct response to a dangerous music rabbit hole.'},
 {q:'“I’m gonna eat an entire tub of Ben & Jerry’s and then…”',o:['question my capabilities as a functioning adult','sleep','go to the gym','order Greggs'],a:0,r:'Dessert followed by a full adult-performance review.'}
];

function normaliseOld(){
 const out=[];
 for(const q of [...(OLD.personal||[]),...(OLD.general||[])]){
  if(!q||!q.q||!q.o||q.o.length<2)continue;
  let cat=q.cat||'WEIRD SHIT';
  if(/MUSIC/.test(cat))cat='MUSIC'; else if(/ANIMAL/.test(cat))cat='ANIMALS'; else if(/PSYCH/.test(cat))cat='PSYCHOLOGY'; else if(/HISTORY/.test(cat))cat='HISTORY'; else if(/BODY/.test(cat))cat='HUMAN BODY'; else if(/FOOD|DRINK/.test(cat))cat='FOOD + DRINK'; else if(/FATS/.test(cat))cat='FATS FILES'; else if(/TAP|DENISE/.test(cat))cat='TAP + FRIENDS'; else if(/TRAVEL|FESTIVAL|HOLIDAY/.test(cat))cat='TRAVEL'; else if(/ORIGIN|OUR WORLD|LAURA|RICK|FIRST WEEK|LANGUAGE|RANDOM LORE/.test(cat))cat='US'; else cat='WEIRD SHIT';
  out.push({id:q.id||('old-'+out.length),cat,type:'choice',q:q.q,o:q.o,a:q.a||0,r:q.r||''});
 }
 return out;
}
const OLD_NORMAL=normaliseOld();

function questionPool(cat){
 let p=[...QUALITY,...CURATED];
 if(cat){
   p=p.filter(q=>q.cat===cat);
   if(p.length<10)p=[...p,...OLD_NORMAL.filter(q=>q.cat===cat)];
 }else{
   const qualityFirst=[...QUALITY,...shuffle(CURATED,state.rand).slice(0,18)];
   p=qualityFirst;
 }
 return p;
}
function pickQuestions(cat,count,r){
 const primary=shuffle(QUALITY.filter(q=>!cat||q.cat===cat),r);
 const used=new Set(primary.map(q=>q.id));
 const secondary=shuffle([...CURATED,...OLD_NORMAL].filter(q=>(!cat||q.cat===cat)&&!used.has(q.id)),r);
 const takePrimary=cat?Math.min(primary.length,Math.max(6,Math.ceil(count*.7))):Math.min(primary.length,count);
 return [...primary.slice(0,takePrimary),...secondary.slice(0,count-takePrimary)];
}
function eventProgress(){return state.events.length?state.i/state.events.length:0}
function vibrate(v){try{navigator.vibrate&&navigator.vibrate(v)}catch{}}

function header(title){
 const h=$('header','gameHeader');
 const exit=$('button','exitBtn','EXIT');exit.onclick=()=>renderHome();h.append(exit);
 h.append($('div','headerTitle',esc(title)));
 h.append($('div','scoreBox',state.score.toLocaleString()));
 const p=$('div','progressTrack');p.append($('i','progressFill'));h.append(p);requestAnimationFrame(()=>p.firstChild.style.width=`${eventProgress()*100}%`);
 return h;
}

function renderHome(){
 clear();const s=$('main','phone home');
 const hero=$('section','posterHero');
 const art=$('img','posterArt');art.src=PEOPLE.couple_art||ART.home_art||'';hero.append(art);
 hero.append($('div','posterLogo','<span>RICK &amp; LAURA</span><b>CHAOS QUIZ</b>'));
 hero.append($('div','posterStrap','WEIRD QUESTIONS, STUPID GAMES, OUR WORLD'));
 s.append(hero);
 const picker=$('div','playerPicker');['Rick','Laura'].forEach(p=>{const b=$('button','pickPlayer '+(state.player===p?'on':''),`I'M ${p.toUpperCase()}`);b.onclick=()=>{state.player=p;setStore('rl-player',p);renderHome()};picker.append(b)});s.append(picker);
 if(incomingSeed){const box=$('div','incomingBox',`<b>${esc(incomingFrom||'Your opponent')} sent you a round.</b><span>Their score is hidden until you finish.</span>`);s.append(box);const go=$('button','menuBtn challengeBtn','<b>PLAY THEIR ROUND</b><span>Same questions. Same order.</span>');go.onclick=()=>launchIncoming();s.append(go)}
 else{
  const buttons=[
   ['quick','QUICK PLAY','10 proper questions. No minigames.','quickBtn',()=>startQuiz(null,10)],
   ['episode','EPISODE MODE','Questions plus three proper minigames.','episodeBtn',()=>startEpisode()],
   ['challenge','CHALLENGE '+(state.player==='Rick'?'LAURA':'RICK').toUpperCase(),'Play first, then send the same round.','challengeBtn',()=>startQuiz(null,10,null,true)],
   ['chaos','CHAOS DECK','Mostly games. Fast, stupid and competitive.','chaosBtn',()=>startChaos()],
   ['cats','CATEGORIES','Pick an obsession.','categoryBtn',renderCategories]
  ];
  buttons.forEach(x=>{const b=$('button','menuBtn '+x[3],`<b>${x[1]}</b><span>${x[2]}</span>`);b.onclick=x[4];s.append(b)});
  s.append($('div','homeWhisper','WHO IS MORE LIKELY, FINISH THE MESSAGE, FATS INCIDENTS AND OTHER NONSENSE NOW APPEAR INSIDE THE GAME.'));
 }
 root.append(s);
}

function renderCategories(){
 clear();const s=$('main','phone categoryScreen');s.append(header('CHOOSE A CATEGORY'));
 const grid=$('div','categoryGrid');
 const cats=[['US',ART.cat_us],['MUSIC',ART.cat_music],['TRAVEL',ART.cat_travel],['ANIMALS',ART.cat_animals],['HUMAN BODY',ART.cat_body],['PSYCHOLOGY',ART.cat_psych],['HISTORY',ART.cat_history],['FOOD + DRINK',ART.cat_food],['WEIRD SHIT',ART.cat_random],['TAP + FRIENDS',PEOPLE.dad||ART.cat_food]];
 cats.forEach(([c,img])=>{const b=$('button','categoryTile');const im=$('img');im.src=img;b.append(im);b.onclick=()=>startQuiz(c,10);grid.append(b)});s.append(grid);root.append(s);
}

function reset(mode,seed){state.mode=mode;state.seed=seed||`${mode}-${Date.now().toString(36)}`;state.rand=rng(state.seed);state.events=[];state.i=0;state.score=0;state.correct=0;state.streak=0;state.best=0;state.mini=0;state.started=Date.now()}
function startQuiz(cat,count=10,seed=null,challenge=false){reset('quiz:'+(cat||'mixed'),seed);state.challenge=!!challenge;state.events=pickQuestions(cat,count,state.rand).map(q=>({kind:'q',q}));renderEvent()}
function startEpisode(seed=null){reset('episode',seed);const q=pickQuestions(null,7,state.rand),m=shuffle(['savvy','m6','greggs','minnies','keys','tap','memory'],state.rand).slice(0,3),f=shuffle(FINISH,state.rand)[0],c=shuffle(CALLS,state.rand)[0];state.events=[{kind:'q',q:q[0]},{kind:'mini',id:m[0]},{kind:'q',q:q[1]},{kind:'finish',q:f},{kind:'q',q:q[2]},{kind:'mini',id:m[1]},{kind:'call',q:c},{kind:'q',q:q[3]},{kind:'fatsInterrupt'},{kind:'q',q:q[4]},{kind:'mini',id:m[2]},{kind:'q',q:q[5]},{kind:'q',q:q[6]}];renderEvent()}
function startChaos(seed=null){reset('chaos',seed);const q=pickQuestions(null,3,state.rand),m=shuffle(['savvy','m6','greggs','minnies','keys','tap','memory'],state.rand).slice(0,5),f=shuffle(FINISH,state.rand)[0],c=shuffle(CALLS,state.rand)[0];state.events=[{kind:'mini',id:m[0]},{kind:'q',q:q[0]},{kind:'call',q:c},{kind:'mini',id:m[1]},{kind:'fatsInterrupt'},{kind:'mini',id:m[2]},{kind:'q',q:q[1]},{kind:'finish',q:f},{kind:'mini',id:m[3]},{kind:'q',q:q[2]},{kind:'mini',id:m[4]}];renderEvent()}
function startFinish(){reset('finish');state.events=shuffle(FINISH,state.rand).map(q=>({kind:'finish',q}));renderEvent()}
function startCalls(){reset('calls');state.events=shuffle(CALLS,state.rand).slice(0,6).map(q=>({kind:'call',q}));renderEvent()}
function startArchive(){reset('archive');const p=shuffle(OLD.archive||[],state.rand).filter(x=>x&&x.q&&x.o).slice(0,10).map((x,i)=>({id:x.id||'a'+i,cat:'ARCHIVE DIVE',q:x.q,o:x.o,a:x.a||0,r:x.r||'Pulled from the actual chat archive.'}));state.events=p.map(q=>({kind:'q',q}));renderEvent()}
function startFatsBoss(){reset('fats');state.events=[{kind:'fats'}];renderEvent()}
function launchIncoming(){
 if(!incomingMode)return startQuiz(null,10,incomingSeed);
 if(incomingMode.startsWith('quiz:'))return startQuiz(incomingMode.split(':')[1]==='mixed'?null:incomingMode.split(':')[1],10,incomingSeed);
 if(incomingMode==='episode')return startEpisode(incomingSeed);
 if(incomingMode==='chaos')return startChaos(incomingSeed);
 return startQuiz(null,10,incomingSeed);
}

function renderEvent(){if(state.i>=state.events.length)return renderResults();const e=state.events[state.i];if(e.kind==='q')return renderQuestion(e.q);if(e.kind==='finish')return renderQuestion({...e.q,id:'f'+state.i,cat:'FINISH THE MESSAGE'});if(e.kind==='call')return renderCall(e.q);if(e.kind==='mini')return runMini(e.id);if(e.kind==='fatsInterrupt')return runFatsInterrupt();if(e.kind==='fats')return runFatsBoss()}
function next(points=0){state.score+=points;state.i++;renderEvent()}

function artFor(q){
 if(!q||!q.scene)return null;
 if(q.scene==='us')return ART.q_us_scene||PEOPLE.couple_art;
 if(q.scene==='tap')return PEOPLE.dad||PEOPLE.denise||ART.cat_food;
 if(q.scene==='fats')return PEOPLE.fats_solo||PEOPLE.fats||ART.cat_fats;
 if(q.scene==='festival')return PEOPLE.couple_fest||ART.cat_travel;
 if(q.scene==='m6')return ART.m6_scene||ART.cat_travel;
 return null;
}
function renderQuestion(q){
 clear();const s=$('main','phone questionScreen');s.append(header(q.cat||'QUESTION'));
 const src=artFor(q);
 if(src){const art=$('div','questionSceneArt relevantScene');const im=$('img');im.src=src;art.append(im);s.append(art)}else{s.classList.add('noQuestionArt')}
 const paper=$('section','questionPaper');paper.innerHTML=`<div class="paperCat">${esc(q.cat||'QUESTION')}</div><h1>${esc(q.q)}</h1>`;s.append(paper);
 const answers=$('div','answerList');let locked=false;
 (q.o||[]).forEach((o,i)=>{const b=$('button','answer',`<span>${String.fromCharCode(65+i)}</span><b>${esc(o)}</b>`);b.onclick=()=>{if(locked)return;locked=true;const ok=i===(q.a||0);[...answers.children].forEach((x,j)=>{x.disabled=true;if(j===(q.a||0))x.classList.add('correct');if(j===i&&!ok)x.classList.add('wrong')});if(ok){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);state.score+=100+state.streak*15;vibrate(20)}else{state.streak=0;vibrate([40,30,40])}const fb=$('section','feedback '+(ok?'good':'bad'),`<b>${ok?'CORRECT':'NOPE'}</b><p>${esc(q.r||'')}</p>`);s.append(fb);const n=$('button','nextQuestion','NEXT');n.onclick=()=>{state.i++;renderEvent()};s.append(n);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})};answers.append(b)});s.append(answers);root.append(s)
}

function renderCall(row){
 clear();const s=$('main','phone callScreen');s.append(header('WHO IS MORE LIKELY'));
 const card=$('section','callCard',`<div class="paperCat">NO CORRECT ANSWER</div><h1>${esc(row[0])}</h1><p>Choose first. Argue later.</p>`);s.append(card);
 const g=$('div','callChoices');['Rick','Laura','Both'].forEach((x,i)=>{const b=$('button','callChoice');const img=$('img');img.src=x==='Rick'?(PEOPLE.rick_art||PEOPLE.silly_rick||ART.home_art):x==='Laura'?(PEOPLE.laura_art||ART.home_art):ART.home_art;b.append(img);b.append($('b','',x.toUpperCase()));b.onclick=()=>{state.score+=40;state.i++;renderEvent()};g.append(b)});s.append(g);root.append(s)
}

function miniShell(title,sub,cls=''){
 clear();const s=$('main','phone miniScreen '+cls);s.append(header('MINI GAME'));const h=$('section','miniTitle',`<span>MICROGAME</span><h1>${title}</h1><p>${sub}</p>`);s.append(h);const stage=$('section','miniStage');s.append(stage);root.append(s);return{screen:s,stage};
}
function miniResult(score,title,copy){state.mini+=score;state.score+=score;clear();const s=$('main','phone miniResultScreen');s.append(header('MINI GAME'));const card=$('section','miniResultCard',`<span>ROUND CLEAR</span><h1>${esc(title)}</h1><strong>+${score}</strong><p>${esc(copy)}</p>`);const b=$('button','nextQuestion','KEEP GOING');b.onclick=()=>{state.i++;renderEvent()};card.append(b);s.append(card);root.append(s)}
function runMini(id){return ({savvy:miniSavvy,m6:miniM6,greggs:miniGreggs,minnies:miniMinnies,keys:miniKeys,tap:miniTap,slugs:miniSlugs,memory:miniMemory}[id]||miniMinnies)()}

function miniSavvy(){
 const {stage}=miniShell('SAVE THE SAVVY B','Tilt the bottle with your finger. Land the pour inside the gold line.','savvyGame v8Pour');
 stage.innerHTML='<div class="pourBackdrop"></div><div class="pourLaura"></div><div class="wineBottle"><i></i><b>SAVVY B</b></div><div class="wineStream"></div><div class="wineGlass"><div class="wineFill"><i></i><i></i><i></i></div><div class="targetPour"></div></div><div class="pourReadout">0%</div><div class="pourHint">DRAG THE BOTTLE DOWN TO POUR</div>';
 const laura=stage.querySelector('.pourLaura');laura.style.backgroundImage=`url("${PEOPLE.laura_art||ART.savvy_scene||''}")`;
 const bottle=stage.querySelector('.wineBottle'),stream=stage.querySelector('.wineStream'),fillEl=stage.querySelector('.wineFill'),readout=stage.querySelector('.pourReadout'),hint=stage.querySelector('.pourHint');
 let fill=0,angle=-18,drag=false,done=false,last=performance.now(),start=last,pointerY=0;
 const setAngle=a=>{angle=clamp(a,-18,72);bottle.style.transform=`rotate(${angle}deg)`;const pouring=angle>28&&!done;stream.classList.toggle('on',pouring);stream.style.opacity=pouring?Math.min(1,(angle-28)/28):0};
 bottle.onpointerdown=e=>{e.preventDefault();drag=true;pointerY=e.clientY;bottle.setPointerCapture&&bottle.setPointerCapture(e.pointerId);hint.textContent='TILT MORE FOR A FASTER POUR'};
 bottle.onpointermove=e=>{if(!drag||done)return;const dy=e.clientY-pointerY;pointerY=e.clientY;setAngle(angle+dy*.55)};
 bottle.onpointerup=bottle.onpointercancel=()=>{drag=false;if(angle>10){angle=Math.max(-18,angle-10);setAngle(angle)}};
 setAngle(angle);
 function finish(over=false){if(done)return;done=true;stream.classList.remove('on');bottle.classList.add('settle');const d=Math.abs(fill-.76);const pts=over?25:Math.max(50,320-Math.round(d*700));setTimeout(()=>miniResult(pts,over?'SAVVY B CASUALTY':d<.035?'ABSOLUTE PUB SCIENCE':d<.09?'CLASSY AND DRY':'MOSTLY IN THE GLASS',over?'You have created a small indoor flood.':d<.035?'The line has been respected with frightening accuracy.':'Laura would still drink it.'),450)}
 function tick(t){if(done)return;const dt=Math.min(.04,(t-last)/1000);last=t;const rate=angle>28?((angle-28)/44)*.22:0;fill+=rate*dt;fillEl.style.height=(Math.min(fill,1)*100)+'%';readout.textContent=Math.round(fill*100)+'%';if(fill>.66)stage.classList.add('nearTarget');else stage.classList.remove('nearTarget');if(fill>=1.03){stage.classList.add('spill');return finish(true)}if((t-start)>9500){finish(false);return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function miniM6(){
 const {stage}=miniShell('ESCAPE THE M6','Switch lanes. Survive eight seconds of completely normal British transport.','m6Game');
 const road=$('div','road');stage.append(road);const car=$('div','playerCar','R');road.append(car);const ctr=$('div','laneControls');const L=$('button','','LEFT'),R=$('button','','RIGHT');ctr.append(L,R);stage.append(ctr);const timer=$('div','miniTimer','8.0');stage.append(timer);
 let lane=1,obs=[],alive=true,start=performance.now(),last=start,spawnAt=0,passed=0;const setLane=n=>{lane=clamp(n,0,2);car.style.left=`calc(${(lane+.5)/3*100}% - 24px)`};L.onclick=()=>setLane(lane-1);R.onclick=()=>setLane(lane+1);setLane(1);
 function spawn(){const o=$('div','traffic','');const ln=Math.floor(state.rand()*3);o.style.left=`calc(${(ln+.5)/3*100}% - 22px)`;road.append(o);obs.push({el:o,l:ln,y:-90})}
 function tick(t){if(!alive)return;const dt=(t-last)/16.7;last=t;if(t-spawnAt>600){spawn();spawnAt=t}const rr=road.getBoundingClientRect(),cr=car.getBoundingClientRect();for(const o of obs){o.y+=5.3*dt;o.el.style.transform=`translateY(${o.y}px)`;const or=o.el.getBoundingClientRect();if(!(cr.right<or.left||cr.left>or.right||cr.bottom<or.top||cr.top>or.bottom)){alive=false;vibrate([60,30,60]);setTimeout(()=>miniResult(Math.max(40,passed*20),'M6: 1 — YOU: 0','You moved, which is more than the motorway managed.'),250);return}}obs=obs.filter(o=>{if(o.y>rr.height+20){o.el.remove();passed++;return false}return true});const remain=Math.max(0,8-(t-start)/1000);timer.textContent=remain.toFixed(1);if(remain<=0){alive=false;miniResult(250+passed*15,'M6 SURVIVOR','You escaped before becoming part of the central reservation.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function miniGreggs(){
 const {stage}=miniShell('GREGGS DASH','Tap sausage rolls as they cross the counter. Do not panic-tap the impostors.','greggsGame');
 const belt=$('div','conveyor');stage.append(belt);const timer=$('div','miniTimer','10.0');stage.append(timer);const score=$('div','liveScore','0');stage.append(score);let n=0,start=performance.now(),last=0,run=true,items=[];
 const names=[['SAUSAGE ROLL',1],['SAUSAGE ROLL',1],['STEAK BAKE',0],['DOUGHNUT',0],['BEAN MELT',0],['VEGAN BAKE',0]];
 function spawn(){const [name,good]=names[Math.floor(state.rand()*names.length)];const b=$('button','foodCard '+(good?'targetFood':''),name);belt.append(b);const it={el:b,x:-130,good};items.push(it);b.onclick=()=>{if(!run||it.hit)return;it.hit=true;n+=good?1:-1;b.classList.add(good?'got':'badTap');score.textContent=n;setTimeout(()=>b.remove(),160)}}
 function tick(t){if(!run)return;if(t-last>650){spawn();last=t}const w=belt.clientWidth;for(const it of items){it.x+=3.8;it.el.style.transform=`translateX(${it.x}px)`}items=items.filter(it=>{if(it.x>w+140){it.el.remove();return false}return !it.hit});const rem=Math.max(0,10-(t-start)/1000);timer.textContent=rem.toFixed(1);if(rem<=0){run=false;miniResult(Math.max(30,n*45+80),n>=5?'GREGGS DEVOTEE':'PASTRY CONFUSED',n>=5?'Strong sausage-roll discipline.':'You were seduced by at least one impostor.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function miniMinnies(){
 const {stage}=miniShell('43 MINNIES','Stop the dial as close to 43 as you can. Three attempts.','minniesGame');
 const dial=$('div','minnieDial','<div class="dialNeedle"></div><b>0</b><span>MINNIES</span>');stage.append(dial);const stop=$('button','bigStop','STOP');stage.append(stop);const tries=$('div','tryDots','');stage.append(tries);let round=0,value=0,last=performance.now(),run=true,best=99;
 function tick(t){if(!run)return;value=(value+(t-last)*(.020+round*.006))%60;last=t;dial.querySelector('b').textContent=Math.floor(value);dial.querySelector('.dialNeedle').style.transform=`rotate(${value/60*360}deg)`;requestAnimationFrame(tick)}
 stop.onclick=()=>{if(!run)return;const d=Math.abs(43-Math.floor(value));best=Math.min(best,d);tries.append($('i',d<=2?'hit':''));round++;if(round>=3){run=false;const pts=Math.max(40,260-best*18);setTimeout(()=>miniResult(pts,best<=2?'FORTY-THREE MINNIES':'TIME IS A CONSTRUCT',best<=2?'Suspiciously precise.':'Close enough for a unit Laura invented.'),250)}};requestAnimationFrame(tick)
}

function miniKeys(){
 const {stage}=miniShell('KEY CUTTING CHAOS','Trace the glowing key groove with your finger before the timer ends.','keyGame');
 const can=document.createElement('canvas');can.className='keyCanvas';stage.append(can);const timer=$('div','miniTimer','8.0');stage.append(timer);let ctx,pts=[],hit=new Set(),drawing=false,start=performance.now(),run=true;
 function setup(){const r=stage.getBoundingClientRect();can.width=Math.max(300,Math.floor(r.width*2));can.height=Math.max(360,Math.floor((r.height-20)*2));can.style.width=r.width+'px';can.style.height=(r.height-20)+'px';ctx=can.getContext('2d');ctx.scale(2,2);const w=r.width,h=r.height-20;pts=[];for(let x=55;x<w-90;x+=8)pts.push([x,h*.52]);[[w-90,h*.52],[w-55,h*.42],[w-32,h*.5],[w-55,h*.58],[w-90,h*.52]].forEach(p=>pts.push(p));draw()}
 function draw(){const r=stage.getBoundingClientRect();ctx.clearRect(0,0,can.width,can.height);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#39283f';ctx.lineWidth=30;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.strokeStyle='#ff3da7';ctx.lineWidth=4;ctx.setLineDash([8,8]);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.setLineDash([])}
 function mark(e){const r=can.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;pts.forEach((p,i)=>{if(Math.hypot(x-p[0],y-p[1])<24)hit.add(i)});ctx.fillStyle='rgba(77,221,255,.55)';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill()}
 can.onpointerdown=e=>{drawing=true;can.setPointerCapture(e.pointerId);mark(e)};can.onpointermove=e=>{if(drawing)mark(e)};can.onpointerup=can.onpointercancel=()=>drawing=false;requestAnimationFrame(()=>{setup();function tick(t){if(!run)return;const rem=Math.max(0,8-(t-start)/1000);timer.textContent=rem.toFixed(1);if(rem<=0){run=false;const ratio=hit.size/pts.length;miniResult(Math.round(50+ratio*250),ratio>.72?'KEY CUT':'CALL A LOCKSMITH',ratio>.72?'Laura finally has a key.':'The key now opens something. Probably not the intended door.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)})
}

function miniTap(){
 const {stage}=miniShell("TAP O'CLOCK",'Pull the tap handle. Stop the Swan Blonde before the head takes over.','tapGame v8Tap');
 stage.innerHTML='<div class="tapDad"></div><div class="beerTap"><div class="tapHandle"></div><div class="tapNozzle"></div></div><div class="beerStream"></div><div class="realPint"><div class="beerLiquid"></div><div class="beerFoam"></div><div class="beerTarget"></div></div><button class="tapPull">HOLD TAP OPEN</button><div class="beerReadout">0%</div>';
 stage.querySelector('.tapDad').style.backgroundImage=`url("${PEOPLE.dad||ART.home_art||''}")`;
 const btn=stage.querySelector('.tapPull'),handle=stage.querySelector('.tapHandle'),stream=stage.querySelector('.beerStream'),beer=stage.querySelector('.beerLiquid'),foam=stage.querySelector('.beerFoam'),read=stage.querySelector('.beerReadout');
 let down=false,done=false,fill=0,head=0,last=performance.now();
 btn.onpointerdown=e=>{e.preventDefault();down=true;handle.classList.add('open');stream.classList.add('on');btn.setPointerCapture&&btn.setPointerCapture(e.pointerId)};
 const release=()=>{if(!down||done)return;down=false;handle.classList.remove('open');stream.classList.remove('on');if(fill>.25){done=true;const effective=fill+head*.45,d=Math.abs(effective-.79);const pts=Math.max(35,300-Math.round(d*600));setTimeout(()=>miniResult(pts,d<.045?'TAP O’CLOCK PERFECT':head>.22?'FROTHY BUSINESS':'PINT ACCEPTED',d<.045?'Dad has nothing to complain about.':'It is still recognisably a Swan Blonde.'),400)}};
 btn.onpointerup=btn.onpointercancel=release;
 function tick(t){if(done)return;const dt=Math.min(.04,(t-last)/1000);last=t;if(down){fill=clamp(fill+dt*.17,0,1.05);head=clamp(head+dt*(fill>.55?.055:.02),0,.35)}beer.style.height=(Math.min(fill,1)*100)+'%';foam.style.height=(head*100)+'%';foam.style.bottom=(Math.max(0,Math.min(fill,1)-head)*100)+'%';read.textContent=Math.round(fill*100)+'%';if(fill+head>=1.08){done=true;stream.classList.remove('on');stage.classList.add('beerSpill');setTimeout(()=>miniResult(20,'FOAM EMERGENCY','Dad wanted a pint, not a bubble bath.'),350);return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function miniSlugs(){
 const {stage}=miniShell('TENT VS SLUGS','Tap the slugs before they reach the tent. Eight seconds.','slugGame');const tent=$('div','tent','TENT');stage.append(tent);const timer=$('div','miniTimer','8.0');stage.append(timer);let start=performance.now(),last=0,run=true,kills=0,slugs=[];
 function spawn(){const s=$('button','slug','SLUG');const y=60+state.rand()*(stage.clientHeight-140);s.style.top=y+'px';stage.append(s);const it={el:s,x:-80,y};slugs.push(it);s.onclick=()=>{if(it.dead)return;it.dead=true;kills++;s.classList.add('squished');setTimeout(()=>s.remove(),120)}}
 function tick(t){if(!run)return;if(t-last>700){spawn();last=t}const edge=stage.clientWidth-95;for(const x of slugs){if(x.dead)continue;x.x+=2.7;x.el.style.transform=`translateX(${x.x}px)`;if(x.x>edge){run=false;vibrate(70);miniResult(Math.max(30,kills*30),'SLUGS WIN','The tent has fallen to the soft-bodied enemy.');return}}slugs=slugs.filter(x=>!x.dead);const rem=Math.max(0,8-(t-start)/1000);timer.textContent=rem.toFixed(1);if(rem<=0){run=false;miniResult(100+kills*30,'ALL IS WORKABLE','Tent protected. Gaffer tape remains optional.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
}

function miniMemory(){
 const {stage}=miniShell('ANDREW 3000 MEMORY MIX','Watch the pads. Repeat the sequence. Three rounds.','memoryGame');const grid=$('div','memoryGrid');stage.append(grid);const pads=[];for(let i=0;i<4;i++){const p=$('button','memoryPad','');grid.append(p);pads.push(p)}let seq=[],input=[],round=0,busy=true;
 const flash=i=>new Promise(res=>{pads[i].classList.add('lit');setTimeout(()=>{pads[i].classList.remove('lit');setTimeout(res,120)},320)});
 async function show(){busy=true;input=[];seq.push(Math.floor(state.rand()*4));await new Promise(r=>setTimeout(r,400));for(const i of seq)await flash(i);busy=false}
 pads.forEach((p,i)=>p.onclick=async()=>{if(busy)return;await flash(i);input.push(i);const k=input.length-1;if(input[k]!==seq[k]){busy=true;return miniResult(50+round*60,'WRONG 3000','The remix has left the building.')}if(input.length===seq.length){round++;if(round>=3)return miniResult(300,'MEMORY MIX CLEARED','Andrew 3000 would be proud. André might ask questions.');show()}});show()
}

function runFatsInterrupt(){
 const pick=Math.floor(state.rand()*3);
 if(pick===0){
   const {stage}=miniShell('FATS INTERRUPTION: FREEBIES','Grab the two things Fats actually gave Laura. Ignore the decoys.','fatsInterrupt freebiesGame');
   const items=shuffle([['JEANS',1],['SKINCARE',1],['KETTLE',0],['LAMP',0],['TRAINERS',0],['UMBRELLA',0]],state.rand);let picked=0,score=0;
   const g=$('div','freebieGrid');stage.append(g);items.forEach(([n,good])=>{const b=$('button','freebie',n);b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.classList.add(good?'right':'wrong');picked++;score+=good?1:-1;if(picked===2)setTimeout(()=>miniResult(Math.max(40,150+score*70),score===2?'FATS DEPARTMENT STORE':'QUESTIONABLE FREEBIE JUDGEMENT','Jeans and skincare. Obviously.'),350)};g.append(b)});
 }else if(pick===1){
   const {stage}=miniShell('FATS INTERRUPTION: WHERE IS HE?','Three guesses. Hotter means closer.','fatsInterrupt locatorGame');
   const map=$('div','fatsMap');const txt=$('div','heatText','FIND FATS');stage.append(map,txt);const target={x:15+state.rand()*70,y:18+state.rand()*64};let tries=0,best=999;
   map.onclick=e=>{tries++;const r=map.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100,d=Math.hypot(x-target.x,y-target.y);best=Math.min(best,d);const dot=$('i','guessDot');dot.style.left=x+'%';dot.style.top=y+'%';map.append(dot);txt.textContent=d<9?'THAT IS LITERALLY FATS':d<20?'BOILING':d<35?'WARM':'ABSOLUTELY NOWHERE NEAR';if(d<9||tries>=3)setTimeout(()=>miniResult(Math.max(40,260-Math.round(best*4)),'FATS LOCATED','A completely normal amount of effort to locate one man.'),450)};
 }else{
   const {stage}=miniShell('FATS INTERRUPTION: TRAIN RAGE','Release inside the tiny calm zone before rail replacement fury wins.','fatsInterrupt rageGame');
   stage.innerHTML+='<div class="rageMeter"><i></i><b></b></div><button class="rageBtn">HOLD TO COMPLAIN</button>';
   const fill=stage.querySelector('.rageMeter i'),btn=stage.querySelector('.rageBtn');let v=0,down=false,done=false,last=performance.now();
   btn.onpointerdown=e=>{e.preventDefault();down=true;btn.setPointerCapture&&btn.setPointerCapture(e.pointerId)};
   btn.onpointerup=btn.onpointercancel=()=>{if(done)return;down=false;done=true;const d=Math.abs(v-.78);setTimeout(()=>miniResult(Math.max(35,280-Math.round(d*600)),d<.05?'COMPLAINT CONTAINED':'NETWORK RAIL HAS BEEN INFORMED','Fats has expressed a proportionate amount of concern.'),320)};
   function tick(t){if(done)return;const dt=(t-last)/1000;last=t;if(down)v=clamp(v+dt*.25,0,1);fill.style.width=v*100+'%';if(v>=1){done=true;return miniResult(25,'RAIL REPLACEMENT FURY','The complaint has become its own transport incident.')}requestAnimationFrame(tick)}requestAnimationFrame(tick);
 }
}

function runFatsBoss(){
 clear();const s=$('main','phone fatsBoss');s.append(header('FATS BOSS'));const hero=$('section','fatsHero');const im=$('img');im.src=PEOPLE.fats_solo||PEOPLE.fats||ART.cat_fats;hero.append(im);hero.append($('div','fatsTitle','<span>BOSS FIGHT</span><h1>WHERE IS FATS?</h1><p>No roast. Three actual Fats problems.</p>'));s.append(hero);const stage=$('section','fatsStage');s.append(stage);root.append(s);let total=0;
 function phase1(){stage.innerHTML='<div class="phase">PHASE 1 / 3</div><h2>LOCATION TRIANGULATION</h2><p>Tap the map. You get five attempts and increasingly desperate directions.</p><div class="fatsMap"></div><div class="heatText">FIND HIM</div>';const map=stage.querySelector('.fatsMap'),txt=stage.querySelector('.heatText');const target={x:15+state.rand()*70,y:18+state.rand()*64};let tries=0;map.onclick=e=>{if(tries>=5)return;tries++;const r=map.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100,d=Math.hypot(x-target.x,y-target.y);const dot=$('i','guessDot');dot.style.left=x+'%';dot.style.top=y+'%';map.append(dot);txt.textContent=d<8?'THAT IS LITERALLY FATS':d<20?'BOILING':d<35?'WARM':'ABSOLUTELY NOWHERE NEAR';if(d<8||tries===5){total+=Math.max(30,220-Math.round(d*4));setTimeout(phase2,700)}}}
 function phase2(){stage.innerHTML='<div class="phase">PHASE 2 / 3</div><h2>FREEBIE SORT</h2><p>Tap the things Fats actually gave Laura. Leave the nonsense alone.</p><div class="freebieGrid"></div>';const g=stage.querySelector('.freebieGrid');const items=[['JEANS',1],['SKINCARE',1],['DESK LAMP',0],['KETTLE',0],['OLD RECEIPTS',0],['TRAINERS',0]];let picked=0,score=0;shuffle(items,state.rand).forEach(([n,good])=>{const b=$('button','freebie',n);b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.classList.add(good?'right':'wrong');score+=good?1:-1;picked++;if(picked>=4){total+=Math.max(20,80+score*45);setTimeout(phase3,650)}};g.append(b)})}
 function phase3(){stage.innerHTML='<div class="phase">PHASE 3 / 3</div><h2>TRAIN RAGE METER</h2><p>Hold the button until the rage meter reaches the tiny safe zone. Release before Fats becomes a rail replacement bus.</p><div class="rageMeter"><i></i><b></b></div><button class="rageBtn">HOLD TO COMPLAIN</button>';const fill=stage.querySelector('.rageMeter i'),btn=stage.querySelector('.rageBtn');let v=0,down=false,done=false,last=performance.now();btn.onpointerdown=e=>{down=true;btn.setPointerCapture&&btn.setPointerCapture(e.pointerId)};btn.onpointerup=btn.onpointercancel=()=>{if(done)return;down=false;done=true;const d=Math.abs(v-.78);total+=Math.max(30,240-Math.round(d*500));setTimeout(()=>finish(),300)};function tick(t){const dt=(t-last)/1000;last=t;if(down&&!done){v=clamp(v+dt*.18,0,1);fill.style.width=v*100+'%';if(v>=1){done=true;down=false;total+=20;finish();return}}if(!done)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 function finish(){state.score+=total;state.mini+=total;stage.innerHTML=`<div class="phase">BOSS CLEARED</div><h2>FATS LOCATED</h2><div class="bossPoints">+${total}</div><p>Location acquired. Freebies secured. Train complaint contained.</p>`;const b=$('button','nextQuestion','SHOW RESULTS');b.onclick=()=>{state.i++;renderEvent()};stage.append(b)}
 const go=$('button','startBoss','START FATS');go.onclick=()=>phase1();stage.append(go)
}

function renderResults(){
 clear();const s=$('main','phone resultScreen');const hero=$('section','resultHero');const im=$('img');im.src=ART.result_scene||ART.home_art;hero.append(im);hero.append($('div','resultBurst','ROUND COMPLETE'));s.append(hero);
 const elapsed=Math.max(1,Math.round((Date.now()-state.started)/1000));const totalQ=state.events.filter(e=>e.kind==='q'||e.kind==='finish').length;const panel=$('section','resultPanel');panel.innerHTML=`<div class="resultScore">${state.score.toLocaleString()}</div><div class="stats"><div><span>QUESTIONS</span><b>${state.correct}/${totalQ}</b></div><div><span>BEST STREAK</span><b>${state.best}</b></div><div><span>TIME</span><b>${elapsed}s</b></div><div><span>GAMES</span><b>${state.mini}</b></div></div>`;
 if(state.challengerScore!==null){const v=$('div','versusResult',`<span>${esc(state.challenger||'THEM')} ${state.challengerScore}</span><b>VS</b><span>${esc(state.player)} ${state.score}</span>`);panel.append(v)}
 else{const share=$('button','resultBtn share','CHALLENGE '+(state.player==='Rick'?'LAURA':'RICK').toUpperCase());share.onclick=shareRound;panel.append(share)}
 const again=$('button','resultBtn','BACK TO MENU');again.onclick=()=>{history.replaceState({},'',location.pathname);state.challengerScore=null;state.challenger=null;renderHome()};panel.append(again);s.append(panel);root.append(s)
}
async function shareRound(){const u=new URL(location.href);u.search='';u.searchParams.set('seed',state.seed);u.searchParams.set('mode',state.mode);u.searchParams.set('from',state.player);u.searchParams.set('score',state.score);try{if(navigator.share)await navigator.share({title:'Rick & Laura Chaos Quiz',text:'Same round. Your turn.',url:u.toString()});else{await navigator.clipboard.writeText(u.toString());alert('Challenge link copied')}}catch{}}

window.__V7_TEST={runMini,startFatsBoss,startChaos,startEpisode,startQuiz,renderHome};
renderHome();
})();