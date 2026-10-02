(()=> {
  const files=["v5-assets.js?v=6.0","v5-bank.js?v=6.0","app-v5.js?v=6.0"];
  function load(i){
    if(i>=files.length) return;
    const s=document.createElement("script");
    s.src=files[i];
    s.async=false;
    s.onload=()=>load(i+1);
    s.onerror=()=>{document.getElementById("app").innerHTML='<div style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:30px;background:#09080d;color:white;font-family:system-ui"><div><h1>Behbeh, it fell over</h1><p>Refresh once. If it still fails, screenshot this.</p></div></div>';};
    document.body.appendChild(s);
  }
  load(0);
})();