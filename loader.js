(async()=>{
  async function ungzip(path){
    const b64=await fetch(path,{cache:"no-store"}).then(r=>{
      if(!r.ok) throw new Error(path+" failed to load");
      return r.text();
    });
    const bytes=Uint8Array.from(atob(b64.trim()),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
  try{
    const [bank,app,image]=await Promise.all([
      ungzip("bank.dat"),
      ungzip("app.dat"),
      fetch("couple.b64",{cache:"no-store"}).then(r=>r.text())
    ]);
    window.ODD_BANK_DATA=bank;
    window.ODD_COUPLE_IMAGE="data:image/jpeg;base64,"+image.trim();
    (0,eval)(app);
  }catch(err){
    console.error(err);
    document.getElementById("app").innerHTML='<div style="min-height:100vh;padding:30px;background:#0b0910;color:#fff;font-family:system-ui"><h1>Behbeh, the game fell over 😭</h1><p>Refresh once. If it still fails, screenshot this for Rick.</p></div>';
  }
})();