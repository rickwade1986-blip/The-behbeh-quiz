
(() => {
'use strict';
const BANK = Array.isArray(window.BEHBEH_QUESTIONS) ? window.BEHBEH_QUESTIONS : [];
const A = window.V5_ASSETS || {};
const KEY = 'behbeh-files-progress-v1';
const ACTS = [
 {first:'BEFORE THE', second:'BEHBEH', desc:'A first drink, 2am music and several immediate warning signs that normality was over.', motifs:['4 JUNE','A PINT OF WHAT?','THE RABBIT HOLE']},
 {first:'THE SUPPORTING',second:'CAST',desc:'A dad with inexplicable produce, Fats-based incidents and festival meeting arrangements.',motifs:['DAD','FATS','KENDAL']},
 {first:'ALL IS',second:'WORKABLE',desc:'Pink hands, haircuts, pastry crimes and highly questionable engineering.',motifs:['PINK HANDS','MARIO KART','GAFFER TAPE']},
 {first:'THE LANGUAGE',second:'HAS COLLAPSED',desc:'Private vocabulary is a slippery slope. These two have fallen right down it.',motifs:['43 MINNIE’S','BABY CAKES','WEALTHY PIGS']},
 {first:'THE DEEP',second:'CUTS',desc:'Frogs for rent. The sentimental tub. A final interrogation of all the evidence.',motifs:['BEHBEH ADMIN','THE SINK TUB','TWO TRUTHS']}
];
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pick = (items) => { const a = items.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a; };
const snippets = (q) => (q.lead||[]).slice(0,2).map(([who,line]) => ({who,text:line}));
const escapeLines = (v) => escapeHtml(v).replace(/\n/g,'<br>');
let state = null;
let selected = [];
let locked = false;

function show(id){
 document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active',el.id===id));
 window.scrollTo(0,0);
}
function loadSave(){
 try{
   const o=JSON.parse(localStorage.getItem(KEY)||'null');
   if(o && Array.isArray(o.order) && o.order.length===BANK.length && o.order.every(id=>BANK.some(q=>q.id===id)) && Number.isInteger(o.qi) && o.qi>=0 && o.qi<BANK.length) return o;
 }catch(e){}
 return null;
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({qi:state.qi,score:state.score,correct:state.correct,streak:state.streak,best:state.best,order:state.order}))}catch(e){}
}
function clearSave(){try{localStorage.removeItem(KEY)}catch(e){}}
function refreshHome(){
 const old=loadSave();
 $('startBtn').innerHTML=old?'CONTINUE THE FILE <span aria-hidden="true">→</span>':'OPEN THE FILE <span aria-hidden="true">→</span>';
 $('newBtn').hidden=!old;
}
function newRun(){
 state={qi:0,score:0,correct:0,streak:0,best:0,order:ACTS.flatMap((a,i)=>pick(BANK.filter(q=>q.act===i)).map(q=>q.id))};
 save();showAct(0);
}
function resumeRun(){
 state=loadSave();
 if(!state){newRun();return}
 if(state.qi%6===0)showAct(Math.floor(state.qi/6));else render();
}
function current(){return BANK.find(q=>q.id===state.order[state.qi])}
function showAct(num){
 const d=ACTS[num];
 $('actCard').dataset.number=String(num+1).padStart(2,'0');
 $('actCounter').textContent='CHAPTER '+String(num+1).padStart(2,'0')+' / 05';
 $('actTitle').innerHTML=escapeHtml(d.first)+' <span>'+escapeHtml(d.second)+'</span>';
 $('actText').textContent=d.desc;
 $('actMotifs').innerHTML=d.motifs.map(x=>'<span>'+escapeHtml(x)+'</span>').join('');
 $('actFoot').textContent='Six actual incidents. One questionable chapter.';
 $('actGo').textContent=num===0?'OPEN CHAPTER ONE →':'CONTINUE THE MADNESS →';
 show('act');
}
function stageFrame(q,content){
 return '<div class="stageTop"><span class="fileLabel">EXHIBIT '+String(state.qi+1).padStart(2,'0')+'</span><span class="fileDate">'+escapeHtml(q.date)+'</span></div>'+content;
}
function chatHTML(q){
 return '<div class="chatStage">'+
 snippets(q).map(({who,text})=>{
  const cls=who==='Rick'?' out':who==='Mystery'?' mystery':'';
  return '<div class="bubble'+cls+'"><span class="sender">'+escapeHtml(who)+'</span>'+escapeLines(text)+'</div>';
 }).join('')+'</div>';
}
function imageFor(kind){
 if(kind==='dad')return A.dad||A.couple_real||'';
 if(kind==='fats')return A.fats_solo||A.fats||A.couple_real||'';
 if(kind==='festival')return A.couple_fest||A.couple_real||'';
 return A.couple_real||A.couple_fest||'';
}
function renderStage(q){
 let html='';
 const chat=chatHTML(q);
 switch(q.view){
 case 'chat':
   html=chat; break;
 case 'polaroid':{
   const src=imageFor(q.photo);
   const title=q.photo==='dad'?'DAD. NO CONTEXT.':q.photo==='fats'?'THE FATS FILES':'MEET AT THE FESTIVAL';
   html='<div class="photoBg">'+(src?'<img src="'+src+'" alt="Photo from the Rick and Laura archive">':'')+'</div><div class="photoBig">'+escapeHtml(title)+'<mark>ONE VERY SPECIFIC MEMORY.</mark></div>';break;
 }
 case 'festival':{
   const src=imageFor('festival');
   html='<div class="festivalBg">'+(src?'<img src="'+src+'" alt="Rick and Laura at a festival">':'')+'</div><div class="festivalTitle">KENDAL:<br>INCIDENT REPORT<br><span style="font-size:16px;color:#ffe486">STATUS: DISASTER PENDING</span></div>';break;
 }
 case 'vinyl':
   html='<div class="vinylStage"><div class="record"></div><div class="musicType"><small>NOW PLAYING</small>THE 1AM<br>RABBIT<br>HOLE</div></div>';break;
 case 'invoice': case 'receipt':{
   const tags={
     'origin-5':['INHERITANCE CLAIM','BAD DECISIONS','DUSTY RUM','ADMIN: ???'],
     'chaos-4':['PASTRY TRIBUNAL','BEAN MELT','SAUSAGE ROLL','VERDICT: ???'],
     'language-5':['LADIES DAY','MODGE JOHNSON','FLOM PONGE','DRINKS: ???'],
     'deep-3':['PURCHASE ORDER','ONE GREEN RIZLA','FORMAL REQUEST','RESPONSE: ???']
   };
   const data=tags[q.id]||['BEHBEH RECEIPT','QUESTIONABLE ITEM','ASSORTED CHAOS','TOTAL: ???'];
   html='<div class="receiptStage"><div class="receiptInner"><div class="brand">'+escapeHtml(data[0])+'</div><span class="date">A VERY OFFICIAL TRANSACTION</span>'+data.slice(1).map((r,i)=>'<div class="rline"><span>'+escapeHtml(r)+'</span><span>'+(i===2?'???':'✓')+'</span></div>').join('')+'<div class="stamp">PENDING</div></div></div>';break;
 }
 case 'case':{
   const head=q.mode==='pair'?'TWO TRUTHS. TWO LIES.':q.mode==='verdict'?'WHICH PART IS BULLSHIT?':q.tag;
   html='<div class="caseStage"><h3>'+escapeHtml(head)+'</h3><p>'+escapeHtml(snippets(q).map(x=>x.text).join(' / ').slice(0,160))+'</p><div class="caseStamp">CASE OPEN</div></div>';break;
 }
 case 'evidence':
   html='<div class="evidenceStage"><h3>'+escapeHtml(q.tag)+'</h3>'+snippets(q).map(x=>'<div class="check">'+escapeHtml(x.text)+'</div>').join('')+'<div class="eStamp">SEALED?</div></div>';break;
 case 'script':
   html='<div class="scriptStage"><b>INT. THE BLAG LAB – DAY</b><p>LAURA has devised another cunning professional strategy.</p><em>LAURA</em><p>'+escapeHtml(snippets(q)[0]?.text||'')+'</p><p style="font-size:10px">(An award-winning performance, allegedly.)</p></div>';break;
 case 'arcade':
   html='<div class="arcadeStage"><div class="arcTitle">MARIO<br>KART<br>MASTERPLAN</div><div class="arcSub">OBJECTIVE: WIND UP EVERYONE</div></div>';break;
 case 'map':
   html='<div class="travelStage"><div class="ticket"><div class="code">FIRST-DATE EMERGENCY EXIT</div><div class="route">PLAN A<br>→ PLAN ???</div><div class="tag">REASON: EMPTY BAR</div></div></div>';break;
 case 'travel':
   html='<div class="travelStage"><div class="ticket"><div class="code">ONE WAY · TRANSFER REQUEST</div><div class="route">PARTY BUS<br>→ ???</div><div class="tag">DEPARTURE: WHEN WE GROW UP</div></div></div>';break;
 case 'postcard':
   html='<div class="postStage"><div class="holiday">Greetings from somewhere disgustingly beautiful…</div><small>BUDGET: VERY CHEAP</small></div>';break;
 case 'timeline':
   html='<div class="timelineStage"><div><b>THE EARLY DAYS</b></div><div><b>SOMEWHERE IN BETWEEN</b></div><div><b>THE LATE ARCHIVE</b></div></div>';break;
 default:
   html=chat;
 }
 $('stage').innerHTML=stageFrame(q,html)+'<div class="stageBottom">'+escapeHtml(q.tag)+'</div>';
}
function render(){
 const q=current();if(!q){finish();return}
 selected=[];locked=false;
 show('quiz');
 $('caseIndex').firstChild.textContent='FILE '+String(state.qi+1).padStart(3,'0')+' / '+String(BANK.length).padStart(3,'0')+' ';
 $('caseCategory').textContent=ACTS[q.act].first+' '+ACTS[q.act].second;
 $('score').textContent=state.score.toLocaleString();
 $('streak').textContent=state.streak+' STREAK';
 $('progressFill').style.width=((state.qi/BANK.length)*100)+'%';
 $('qType').textContent=q.mode==='verdict'?'SPOT THE BULLSHIT':q.mode==='order'?'CHRONOLOGY TEST':q.mode==='pair'?'SELECT TWO':q.mode==='who'?'IDENTIFY THE SUSPECT':'RECONSTRUCT THE MEMORY';
 $('promptText').textContent=q.q;
 $('answerPanel').className='answerPanel';
 $('submitBtn').hidden=!['order','pair'].includes(q.mode);
 $('submitBtn').disabled=true;
 $('submitBtn').textContent=q.mode==='order'?'CHECK THE TIMELINE':'LOCK IN TWO ANSWERS';
 $('hintText').textContent=q.mode==='order'?'Tap the moments in chronological order. Tap again to undo.':q.mode==='pair'?'Select exactly two answers.':q.mode==='verdict'?'Only one is fabricated.':'Choose the answer that belongs in the archive.';
 renderStage(q);
 const options=pick(q.o.map((label,i)=>({label,i})));
 $('options').className='options'+(q.mode==='order'?' vertical':'');
 $('options').replaceChildren();
 options.forEach(c=>{
   const b=document.createElement('button');b.type='button';b.className='option';b.textContent=c.label;
   b.dataset.orig=String(c.i);b.setAttribute('aria-pressed','false');
   b.onclick=()=>choose(c.i);$('options').appendChild(b);
 });
}
function choose(i){
 if(locked)return;
 const q=current();
 if(q.mode==='order'||q.mode==='pair'){
   const pos=selected.indexOf(i);
   if(pos>=0)selected.splice(pos,1);
   else if(selected.length<(q.mode==='order'?q.o.length:2))selected.push(i);
   $('options').querySelectorAll('.option').forEach(b=>{
     const p=selected.indexOf(Number(b.dataset.orig));
     b.classList.toggle('selected',p>=0);
     b.dataset.rank=p>=0?String(p+1):'';
     b.setAttribute('aria-pressed',String(p>=0));
   });
   $('submitBtn').disabled=selected.length!==(q.mode==='order'?q.o.length:2);
   return;
 }
 selected=[i];evaluate();
}
function evaluate(){
 if(locked)return;
 const q=current();
 if(q.mode==='pair'&&selected.length!==2)return;
 if(q.mode==='order'&&selected.length!==q.o.length)return;
 locked=true;
 const answer=Array.isArray(q.a)?q.a:[q.a];
 const ok=q.mode==='order'?selected.every((v,i)=>v===answer[i]):
    q.mode==='pair'?selected.length===answer.length&&selected.every(v=>answer.includes(v)):
    selected[0]===answer[0];
 if(ok){
   state.correct++;state.streak++;
   state.best=Math.max(state.best,state.streak);
   state.score+=1000+Math.min(400,Math.max(0,state.streak-1)*100);
 }else{state.streak=0}
 $('score').textContent=state.score.toLocaleString();
 $('streak').textContent=state.streak+' STREAK';
 $('options').querySelectorAll('.option').forEach(b=>{
  const i=Number(b.dataset.orig);
  b.disabled=true;
  b.classList.add('answered');
  if(q.mode==='order'){
    const p=selected.indexOf(i);
    b.classList.toggle('correct',p===answer.indexOf(i));
    b.classList.toggle('incorrect',p!==answer.indexOf(i));
  }else if(answer.includes(i))b.classList.add('correct');
  else if(selected.includes(i))b.classList.add('incorrect');
 });
 $('submitBtn').hidden=true;
 $('answerPanel').className='answerPanel visible'+(ok?'':' wrong');
 $('answerHead').textContent=ok?(state.streak>=4?'ABSOLUTELY ON FIRE.':'THAT’S IN THE FILE.'):'NOT QUITE, BEHBEH.';
 $('answerExplain').textContent=q.after;
 $('answerSource').textContent='SOURCE: LAURA WHATSAPP · '+q.src;
 $('nextBtn').textContent=state.qi===BANK.length-1?'OPEN THE FINAL REPORT →':((state.qi+1)%6===0?'NEXT CHAPTER →':'NEXT CASE →');
 $('progressFill').style.width=(((state.qi+1)/BANK.length)*100)+'%';
 save();
 // Ensure feedback is reachable on smaller phone viewports.
 requestAnimationFrame(()=>{$('answerPanel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'})});
}
function next(){
 state.qi++;selected=[];locked=false;
 if(state.qi>=BANK.length){finish();return}
 save();
 if(state.qi%6===0)showAct(Math.floor(state.qi/6));else render();
}
function finish(){
 clearSave();
 $('finalCount').textContent=state.correct+'/'+BANK.length;
 $('finalPoints').textContent=state.score.toLocaleString()+' PTS';
 $('finalStreak').textContent='BEST STREAK: '+state.best;
 const p=state.correct/BANK.length;
 $('finalTitle').textContent=p>.85?'LAURA WOULD BE IMPRESSED.':p>.60?'A QUALIFIED BEHBEH EXPERT.':p>.35?'YOU MAY NEED A REFRESHER.':'WHO EVEN ARE YOU?';
 $('finalCopy').textContent=p>.85?'An alarming amount of nonsense retained. The archive salutes you.':p>.6?'Strong work. A couple of incidents have evidently been lost to history.':'There are some extremely memorable incidents in this relationship. Please consult your records.';
 show('results');
}
function init(){
 $('coverImage').src=A.couple_real||A.couple_fest||'';
 $('startBtn').onclick=()=>{if(loadSave())resumeRun();else newRun()};
 $('newBtn').onclick=()=>{clearSave();newRun()};
 $('actGo').onclick=render;
 $('exitBtn').onclick=()=>{save();refreshHome();show('home')};
 $('submitBtn').onclick=evaluate;
 $('nextBtn').onclick=next;
 $('againBtn').onclick=()=>{clearSave();newRun()};
 document.addEventListener('keydown',e=>{
  if(!$('quiz').classList.contains('active')||locked||e.altKey||e.ctrlKey||e.metaKey)return;
  const opts=[...$('options').querySelectorAll('.option')];
  if(/^[1-4]$/.test(e.key)){const b=opts[Number(e.key)-1];if(b)b.click()}
  else if(e.key==='Enter'&&!$('submitBtn').hidden&&!$('submitBtn').disabled) evaluate();
 });
 refreshHome();
 if(BANK.length!==30){
   console.error('Unexpected question count',BANK.length);
   document.querySelector('.coverTitle p').textContent='Question bank unavailable. Please refresh.';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
