(async()=>{try{
  const code=await fetch("app-v4-bundle.js",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("V4 bundle failed to load");return r.text()});
  (0,eval)(code);
}catch(e){
  console.error(e);
  document.getElementById("app").innerHTML='<div style="min-height:100vh;display:grid;place-items:center;padding:30px;background:#09080d;color:#fff;font-family:system-ui;text-align:center"><div><h1>Behbeh, it fell over 😭</h1><p>Refresh once. If it still fails, screenshot this.</p></div></div>';
}})();