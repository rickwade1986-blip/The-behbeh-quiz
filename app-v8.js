(()=>{
'use strict';
const root=document.getElementById('app');
const ART=window.V7_ASSETS||{};
const PEOPLE=window.V5_ASSETS||{};
const CURATED=window.V7_CURATED||[];
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

const STRONG_GENERAL=new Set([
 'g003','g004','g006','g007','g008','g009','g011','g012','g015',
 'g023','g024','g025','g026','g027','g028','g029','g030','g031','g032','g033','g034',
 'g041','g042','g043','g044','g045','g046','g048','g051','g052','g057','g060','g066','g070','g071','g072'
]);
function questionPool(cat){
 if(cat){
  let p=CURATED.filter(q=>q.cat===cat);
  if(p.length<10)p=[...p,...OLD_NORMAL.filter(q=>q.cat===cat)];
  return p;
 }
 return CURATED;
}
function pickQuestions(cat,count,r){
 if(cat){
  let pool=shuffle(questionPool(cat),r);
  if(pool.length<count){
   const ids=new Set(pool.map(q=>q.id));
   pool=pool.concat(shuffle([...CURATED,...OLD_NORMAL].filter(q=>!ids.has(q.id)),r));
  }
  return pool.slice(0,count);
 }
 const personal=shuffle(CURATED.filter(q=>String(q.id||'').startsWith('us')),r);
 const strange=shuffle(CURATED.filter(q=>STRONG_GENERAL.has(q.id)),r);
 const personalCount=Math.min(personal.length,Math.max(1,Math.ceil(count*.7)));
 let out=[...personal.slice(0,personalCount),...strange.slice(0,Math.max(0,count-personalCount))];
 if(out.length<count){
  const ids=new Set(out.map(q=>q.id));
  out=out.concat(shuffle(CURATED.filter(q=>!ids.has(q.id)),r).slice(0,count-out.length));
 }
 return shuffle(out,r).slice(0,count);
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
  const specials=$('div','specialStrip');
  [['WHO IS MORE LIKELY',()=>startCalls()],['FINISH THE MESSAGE',()=>startFinish()],['FATS BOSS',()=>startFatsBoss()]].forEach(x=>{const b=$('button','specialBtn',x[0]);b.onclick=x[1];specials.append(b)});s.append(specials);
 }
 root.append(s);
}

function renderCategories(){
 clear();const s=$('main','phone categoryScreen');s.append(header('CHOOSE A CATEGORY'));
 const grid=$('div','categoryGrid');
 const cats=[['US',ART.cat_us],['MUSIC',ART.cat_music],['TRAVEL',ART.cat_travel],['ANIMALS',ART.cat_animals],['HUMAN BODY',ART.cat_body],['PSYCHOLOGY',ART.cat_psych],['HISTORY',ART.cat_history],['FOOD + DRINK',ART.cat_food],['WEIRD SHIT',ART.cat_random],['FATS FILES',ART.cat_fats]];
 cats.forEach(([c,img])=>{const b=$('button','categoryTile');const im=$('img');im.src=img;b.append(im);b.onclick=()=>c==='FATS FILES'?startFatsBoss():startQuiz(c,10);grid.append(b)});s.append(grid);
 const more=$('div','extraModes');
 const a=$('button','extraMode','TAP + FRIENDS');a.onclick=()=>startQuiz('TAP + FRIENDS',10);more.append(a);
 const b=$('button','extraMode','ARCHIVE DIVE');b.onclick=()=>startArchive();more.append(b);
 s.append(more);root.append(s);
}

function reset(mode,seed){state.mode=mode;state.seed=seed||`${mode}-${Date.now().toString(36)}`;state.rand=rng(state.seed);state.events=[];state.i=0;state.score=0;state.correct=0;state.streak=0;state.best=0;state.mini=0;state.started=Date.now()}
function startQuiz(cat,count=10,seed=null,challenge=false){reset('quiz:'+(cat||'mixed'),seed);state.challenge=!!challenge;state.events=pickQuestions(cat,count,state.rand).map(q=>({kind:'q',q}));renderEvent()}
function startEpisode(){reset('episode');const q=pickQuestions(null,9,state.rand),m=shuffle(['tap','minnies','keys','memory'],state.rand).slice(0,3);state.events=[{kind:'q',q:q[0]},{kind:'q',q:q[1]},{kind:'mini',id:m[0]},{kind:'q',q:q[2]},{kind:'q',q:q[3]},{kind:'mini',id:m[1]},{kind:'q',q:q[4]},{kind:'q',q:q[5]},{kind:'q',q:q[6]},{kind:'mini',id:m[2]},{kind:'q',q:q[7]},{kind:'q',q:q[8]}];renderEvent()}
function startChaos(){reset('chaos');const q=pickQuestions(null,3,state.rand),m=shuffle(['tap','minnies','keys','memory'],state.rand);state.events=[{kind:'mini',id:m[0]},{kind:'q',q:q[0]},{kind:'mini',id:m[1]},{kind:'q',q:q[1]},{kind:'mini',id:m[2]},{kind:'q',q:q[2]},{kind:'mini',id:m[3]}];renderEvent()}
function startFinish(){reset('finish');state.events=shuffle(FINISH,state.rand).map(q=>({kind:'finish',q}));renderEvent()}
function startCalls(){reset('calls');state.events=shuffle(CALLS,state.rand).slice(0,6).map(q=>({kind:'call',q}));renderEvent()}
function startArchive(){reset('archive');const p=shuffle(OLD.archive||[],state.rand).filter(x=>x&&x.q&&x.o).slice(0,10).map((x,i)=>({id:x.id||'a'+i,cat:'ARCHIVE DIVE',q:x.q,o:x.o,a:x.a||0,r:x.r||'Pulled from the actual chat archive.'}));state.events=p.map(q=>({kind:'q',q}));renderEvent()}
function startFatsBoss(){reset('fats');state.events=[{kind:'fats'}];renderEvent()}
function launchIncoming(){if(!incomingMode)return startQuiz(null,10,incomingSeed);if(incomingMode.startsWith('quiz:'))return startQuiz(incomingMode.split(':')[1]==='mixed'?null:incomingMode.split(':')[1],10,incomingSeed);if(incomingMode==='episode'){reset('episode',incomingSeed);const q=pickQuestions(null,9,state.rand),m=shuffle(['tap','minnies','keys','memory'],state.rand).slice(0,3);state.events=[{kind:'q',q:q[0]},{kind:'q',q:q[1]},{kind:'mini',id:m[0]},{kind:'q',q:q[2]},{kind:'q',q:q[3]},{kind:'mini',id:m[1]},{kind:'q',q:q[4]},{kind:'q',q:q[5]},{kind:'q',q:q[6]},{kind:'mini',id:m[2]},{kind:'q',q:q[7]},{kind:'q',q:q[8]}];return renderEvent()}if(incomingMode==='chaos'){reset('chaos',incomingSeed);const q=pickQuestions(null,3,state.rand),m=shuffle(['tap','minnies','keys','memory'],state.rand);state.events=[{kind:'mini',id:m[0]},{kind:'q',q:q[0]},{kind:'mini',id:m[1]},{kind:'q',q:q[1]},{kind:'mini',id:m[2]},{kind:'q',q:q[2]},{kind:'mini',id:m[3]}];return renderEvent()}startQuiz(null,10,incomingSeed)}

function renderEvent(){if(state.i>=state.events.length)return renderResults();const e=state.events[state.i];if(e.kind==='q')return renderQuestion(e.q);if(e.kind==='finish')return renderQuestion({...e.q,id:'f'+state.i,cat:'FINISH THE MESSAGE'});if(e.kind==='call')return renderCall(e.q);if(e.kind==='mini')return runMini(e.id);if(e.kind==='fats')return runFatsBoss()}
function next(points=0){state.score+=points;state.i++;renderEvent()}

function artFor(cat){if(cat==='US')return ART.q_us_scene;if(cat==='TAP + FRIENDS')return PEOPLE.dad||PEOPLE.denise||ART.q_us_scene;if(CAT[cat])return CAT[cat].img;if(/FATS/.test(cat||''))return ART.cat_fats;return ART.cat_random}
function renderQuestion(q){
 clear();const s=$('main','phone questionScreen');s.append(header(q.cat||'QUESTION'));
 const paper=$('section','questionPaper cleanQuestion');paper.innerHTML=`<div class="paperCat">${esc(q.cat||'QUESTION')}</div><h1>${esc(q.q)}</h1>`;s.append(paper);
 const answers=$('div','answerList');let locked=false;
 (q.o||[]).forEach((o,i)=>{const b=$('button','answer',`<span>${String.fromCharCode(65+i)}</span><b>${esc(o)}</b>`);b.onclick=()=>{if(locked)return;locked=true;const ok=i===(q.a||0);[...answers.children].forEach((x,j)=>{x.disabled=true;if(j===(q.a||0))x.classList.add('correct');if(j===i&&!ok)x.classList.add('wrong')});if(ok){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);state.score+=100+state.streak*15;vibrate(20)}else{state.streak=0;vibrate([40,30,40])}const fb=$('section','feedback '+(ok?'good':'bad'),`<b>${ok?'CORRECT':'NOPE'}</b><p>${esc(q.r||'')}</p>`);s.append(fb);const n=$('button','nextQuestion','NEXT');n.onclick=()=>{state.i++;renderEvent()};s.append(n);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})};answers.append(b)});s.append(answers);root.append(s)
}

function renderCall(row){
 clear();const s=$('main','phone callScreen');s.append(header('WHO IS MORE LIKELY'));
 const card=$('section','callCard',`<div class="paperCat">NO CORRECT ANSWER</div><h1>${esc(row[0])}</h1><p>Choose first. Argue later.</p>`);s.append(card);
 const g=$('div','callChoices');['Rick','Laura','Both'].forEach((x,i)=>{const b=$('button','callChoice');const img=$('img');img.src=x==='Rick'?(PEOPLE.rick_art||PEOPLE.silly_rick||ART.home_art):x==='Laura'?(PEOPLE.laura_art||ART.home_art):ART.home_art;b.append(img);b.append($('b','',x.toUpperCase()));b.onclick=()=>{state.score+=40;state.i++;renderEvent()};g.append(b)});s.append(g);root.append(s)
}

function miniShell(title,sub,cls=''){
 clear();const s=$('main','phone miniScreen '+cls);s.append(header('MINI GAME'));const h=$('section','miniTitle',`<span>DO THE THING</span><h1>${title}</h1><p>${sub}</p>`);s.append(h);const stage=$('section','miniStage');s.append(stage);root.append(s);return{screen:s,stage};
}
function miniResult(score,title,copy){state.mini+=score;state.score+=score;clear();const s=$('main','phone miniResultScreen');s.append(header('MINI GAME'));const card=$('section','miniResultCard',`<span>ROUND CLEAR</span><h1>${esc(title)}</h1><strong>+${score}</strong><p>${esc(copy)}</p>`);const b=$('button','nextQuestion','KEEP GOING');b.onclick=()=>{state.i++;renderEvent()};card.append(b);s.append(card);root.append(s)}
function runMini(id){return ({savvy:miniSavvy,m6:miniM6,greggs:miniGreggs,minnies:miniMinnies,keys:miniKeys,tap:miniTap,slugs:miniSlugs,memory:miniMemory}[id]||miniMinnies)()}

function miniSavvy(){
 const {stage}=miniShell('SAVE THE SAVVY B','Keep the balance needle in the safe zone for ten seconds.','savvyGame');
 const bg=$('img','savvyBg');bg.src=ART.savvy_scene;stage.append(bg);
 const hud=$('div','balanceHud','<div class="safeZone"></div><i class="needle"></i>');stage.append(hud);
 const time=$('div','miniTimer','10.0');stage.append(time);
 const controls=$('div','balanceControls');const l=$('button','balanceBtn','LEFT');const r=$('button','balanceBtn','RIGHT');controls.append(l,r);stage.append(controls);
 let pos=0,vel=.015,inside=0,last=performance.now(),start=last,run=true;const needle=hud.querySelector('.needle');let leftDown=false,rightDown=false;
 const bind=(b,set)=>{b.onpointerdown=e=>{e.preventDefault();set(true);b.setPointerCapture&&b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>set(false)};bind(l,v=>leftDown=v);bind(r,v=>rightDown=v);
 function tick(t){if(!run)return;const dt=Math.min(.035,(t-last)/1000);last=t;vel+=(state.rand()-.5)*.09*dt;if(leftDown)vel-=.75*dt;if(rightDown)vel+=.75*dt;vel*=.985;pos+=vel;pos=clamp(pos,-1,1);if(Math.abs(pos)<.29)inside+=dt;needle.style.left=((pos+1)/2*100)+'%';const remain=Math.max(0,10-(t-start)/1000);time.textContent=remain.toFixed(1);if(remain<=0){run=false;const pts=Math.round(80+inside/10*220);miniResult(pts,inside>7?'SAVVY B SAVED':'MOSTLY IN THE GLASS',inside>7?'Laura would accept this pour.':'A respectable amount survived the journey.');return}requestAnimationFrame(tick)}requestAnimationFrame(tick)
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
 const {stage}=miniShell("TAP O'CLOCK",'Hold the tap to pour Dad a Swan Blonde. Release when the pint is right.','tapGame');
 const scene=$('div','tapVisual');
 scene.innerHTML=`
  <div class="dadWatch"><img alt="" src="${PEOPLE.dad||ART.home_art||''}"><span>DAD IS WATCHING</span></div>
  <svg class="tapSvg" viewBox="0 0 400 500" role="img" aria-label="Animated beer tap pouring a pint">
   <defs>
    <linearGradient id="chrome" x1="0" x2="1"><stop offset="0" stop-color="#737d85"/><stop offset=".28" stop-color="#eef4f7"/><stop offset=".52" stop-color="#8d979f"/><stop offset=".78" stop-color="#f7fbfd"/><stop offset="1" stop-color="#626b72"/></linearGradient>
    <linearGradient id="beer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd767"/><stop offset=".35" stop-color="#e8aa24"/><stop offset="1" stop-color="#b96e09"/></linearGradient>
    <clipPath id="pintClip"><path d="M235 205 L350 205 L339 443 Q337 462 319 466 L266 466 Q247 462 245 443 Z"/></clipPath>
    <filter id="glow"><feGaussianBlur stdDeviation="2.6"/></filter>
   </defs>
   <rect x="0" y="0" width="400" height="500" fill="#17120e"/>
   <rect x="0" y="360" width="400" height="140" fill="#4a2d18"/>
   <rect x="0" y="360" width="400" height="12" fill="#81552e"/>
   <g class="tapRig">
    <rect x="58" y="74" width="77" height="280" rx="34" fill="url(#chrome)" stroke="#eaf2f6" stroke-width="3"/>
    <ellipse cx="96" cy="82" rx="38" ry="14" fill="#dce5e9" stroke="#f8fbfc" stroke-width="3"/>
    <rect x="69" y="122" width="55" height="74" rx="11" fill="#101417" stroke="#cbd4d9" stroke-width="3"/>
    <text x="96" y="147" text-anchor="middle" fill="#b7f33e" font-size="12" font-family="Arial Black,Arial">SWAN</text>
    <text x="96" y="164" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial Black,Arial">BLONDE</text>
    <rect x="86" y="24" width="20" height="72" rx="8" fill="#171a1c" stroke="#dbe3e8" stroke-width="3"/>
    <circle cx="96" cy="22" r="18" fill="#b7f33e" stroke="#f0ffd2" stroke-width="3"/>
    <path d="M128 225 H238 Q250 225 250 237 V251" fill="none" stroke="url(#chrome)" stroke-width="23" stroke-linecap="round"/>
    <path d="M250 247 v28" stroke="#e9eff2" stroke-width="12" stroke-linecap="round"/>
   </g>
   <path class="beerStream" d="M250 271 C253 320 274 336 286 365" fill="none" stroke="#efb52f" stroke-width="9" stroke-linecap="round"/>
   <path class="beerGlow" d="M250 271 C253 320 274 336 286 365" fill="none" stroke="#ffe28d" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
   <g class="pint">
    <g clip-path="url(#pintClip)">
     <rect class="beerLiquid" x="236" y="466" width="114" height="0" fill="url(#beer)"/>
     <g class="beerBubbles" opacity=".72">
      <circle cx="266" cy="418" r="3" fill="#fff6c4"/><circle cx="292" cy="439" r="2.5" fill="#fff6c4"/>
      <circle cx="320" cy="403" r="2" fill="#fff6c4"/><circle cx="278" cy="385" r="2.2" fill="#fff6c4"/>
      <circle cx="307" cy="370" r="3" fill="#fff6c4"/><circle cx="329" cy="431" r="1.8" fill="#fff6c4"/>
     </g>
     <g class="foam" transform="translate(0 470)">
      <rect x="238" y="-9" width="111" height="19" rx="9" fill="#fff4d8"/>
      <circle cx="250" cy="-7" r="8" fill="#fff9e9"/><circle cx="270" cy="-10" r="10" fill="#fff9e9"/>
      <circle cx="294" cy="-8" r="12" fill="#fff9e9"/><circle cx="320" cy="-9" r="10" fill="#fff9e9"/><circle cx="340" cy="-7" r="7" fill="#fff9e9"/>
     </g>
    </g>
    <path d="M235 205 L350 205 L339 443 Q337 462 319 466 L266 466 Q247 462 245 443 Z" fill="rgba(255,255,255,.035)" stroke="rgba(240,248,255,.92)" stroke-width="6" stroke-linejoin="round"/>
    <path d="M250 226 L337 226" stroke="rgba(255,255,255,.24)" stroke-width="3"/>
    <line class="fillTarget" x1="242" y1="253" x2="343" y2="253" stroke="#b7f33e" stroke-width="4" stroke-dasharray="10 9"/>
    <text x="341" y="244" text-anchor="end" fill="#d8ff8b" font-size="11" font-family="Arial Black,Arial">PERFECT PINT</text>
   </g>
  </svg>
  <div class="pourHint">HOLD • WATCH THE HEAD • RELEASE</div>`;
 stage.append(scene);
 const hold=$('button','pourButton','HOLD TO POUR');stage.append(hold);
 const liquid=scene.querySelector('.beerLiquid'),foam=scene.querySelector('.foam');
 let fill=0,pouring=false,done=false,last=performance.now();
 function paint(){
  const h=238*fill,y=466-h;
  liquid.setAttribute('y',y.toFixed(1));liquid.setAttribute('height',h.toFixed(1));
  foam.setAttribute('transform',`translate(0 ${Math.max(220,y+2).toFixed(1)})`);
  scene.classList.toggle('nearPerfect',fill>.78&&fill<.86);
 }
 const stop=()=>{
  if(done||!pouring)return;
  pouring=false;scene.classList.remove('pouring');done=true;
  const d=Math.abs(fill-.82),pts=Math.max(30,320-Math.round(d*650));
  const perfect=d<.035,good=d<.09;
  setTimeout(()=>miniResult(pts,perfect?'PUB-GRADE PINT':good?'DAD NODS':'DAD HAS NOTES',perfect?'Clean line, proper head. Denise would serve it.':good?'Close enough for Tap O’Clock. No complaints from Dad.':fill>.91?'You have built a Swan Blonde iceberg.':'A little shy. Dad is already pointing at the tap.'),350);
 };
 hold.onpointerdown=e=>{if(done)return;e.preventDefault();pouring=true;scene.classList.add('pouring');hold.textContent='POURING…';hold.setPointerCapture&&hold.setPointerCapture(e.pointerId)};
 hold.onpointerup=hold.onpointercancel=()=>{hold.textContent='HOLD TO POUR';stop()};
 function tick(t){
  const dt=Math.min(.04,(t-last)/1000);last=t;
  if(pouring&&!done){
   fill=clamp(fill+dt*.19,0,1);paint();
   if(fill>=1){done=true;pouring=false;scene.classList.remove('pouring');return miniResult(20,'FOAM APOCALYPSE','Dad asked for a pint, not a bath.')}
  }
  if(!done)requestAnimationFrame(tick);
 }
 paint();requestAnimationFrame(tick)
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