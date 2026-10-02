(async()=>{try{
const names=["v4.00.part","v4.01.part","v4.02.part","v4.03.part","v4.04.part","v4.05.part","v4.06.part","v4.07.part","v4.08.part","v4.09.part"];
const parts=await Promise.all(names.map(n=>fetch(n,{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error(n);return r.text()})));
const b64=parts.join("").trim();
const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
const code=await new Response(stream).text();
(0,eval)(code);
}catch(e){console.error(e);document.getElementById("app").innerHTML='<div style="min-height:100vh;display:grid;place-items:center;padding:30px;background:#09080d;color:white;font-family:system-ui;text-align:center"><div><h1>Behbeh, it fell over 😭</h1><p>Refresh once. If it still fails, screenshot this.</p></div></div>'}})();