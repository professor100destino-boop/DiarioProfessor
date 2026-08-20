(()=>{
  const MAIN_KEY='professorControlV1';

  function allLocalStorage(){
    const out={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k!=null) out[k]=localStorage.getItem(k);
    }
    return out;
  }

  function dataSummary(){
    try{
      const d=JSON.parse(localStorage.getItem(MAIN_KEY)||'{}');
      return {
        escolas:Array.isArray(d.escolas)?d.escolas.length:0,
        turmas:Array.isArray(d.turmas)?d.turmas.length:0,
        alunos:Array.isArray(d.alunos)?d.alunos.length:0,
        frequencias:Array.isArray(d.frequencias)?d.frequencias.length:0,
        avaliacoes:Array.isArray(d.avaliacoes)?d.avaliacoes.length:0,
        planejamentos:Array.isArray(d.planejamentos)?d.planejamentos.length:0,
        conteudos:Array.isArray(d.conteudos)?d.conteudos.length:0,
        horarios:Array.isArray(d.horarios)?d.horarios.length:0,
        advertencias:Array.isArray(d.advertencias)?d.advertencias.length:0
      };
    }catch(e){ return {}; }
  }

  function buildPayload(){
    return {
      app:'Professor Control / Docência Fácil',
      format:1,
      createdAt:new Date().toISOString(),
      localStorage:allLocalStorage(),
      summary:dataSummary()
    };
  }

  function backupData(){
    const payload=buildPayload();
    const date=new Date().toISOString().slice(0,10);
    const filename=`backup-professor-control-${date}.json`;
    const text=JSON.stringify(payload,null,2);
    const file=new File([text],filename,{type:'application/json'});
    return {payload,text,file,filename};
  }

  function exportBackupRapido(){
    const {file}=backupData();
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');
    a.href=url;
    a.download=file.name;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    alert('Backup criado. Se o navegador não perguntou onde salvar, use o botão “Escolher local / nuvem”.');
  }

  async function escolherLocalOuNuvem(){
    const {text,file,filename}=backupData();

    // APK Docência Fácil: usa o seletor nativo do Android (Downloads, Drive, OneDrive etc.).
    try{
      if(window.Android && typeof window.Android.chooseBackupLocation==='function'){
        window.Android.chooseBackupLocation(text,filename);
        return;
      }
    }catch(e){console.error(e)}

    // Navegadores com File System Access API.
    if(typeof window.showSaveFilePicker==='function'){
      try{
        const handle=await window.showSaveFilePicker({
          suggestedName:filename,
          types:[{description:'Backup do Professor Control',accept:{'application/json':['.json']}}]
        });
        const writable=await handle.createWritable();
        await writable.write(text);
        await writable.close();
        alert('Backup salvo no local escolhido.');
        return;
      }catch(e){
        if(e?.name==='AbortError')return;
        console.error(e);
      }
    }

    // Android/iOS: abre o menu de compartilhamento; Drive/OneDrive podem aparecer como destino.
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({
          title:'Backup Professor Control',
          text:'Salvar backup do Professor Control / Docência Fácil',
          files:[file]
        });
        return;
      }
    }catch(e){
      if(e?.name==='AbortError')return;
      console.error(e);
    }

    // Último recurso: download normal.
    exportBackupRapido();
  }

  async function importBackup(file){
    if(!file)return;
    try{
      const txt=await file.text();
      const payload=JSON.parse(txt);
      if(!payload || payload.app!=='Professor Control / Docência Fácil' || !payload.localStorage || typeof payload.localStorage!=='object'){
        alert('Este arquivo não é um backup válido do Professor Control.');
        return;
      }
      const raw=payload.localStorage[MAIN_KEY];
      if(!raw){alert('O backup não contém os dados principais do Professor Control.');return;}
      let parsed; try{parsed=JSON.parse(raw)}catch(e){alert('Os dados principais do backup estão inválidos.');return;}
      const s=payload.summary||{};
      const msg=[
        'Restaurar este backup?',
        '',
        `Escolas: ${s.escolas??(parsed.escolas||[]).length}`,
        `Turmas: ${s.turmas??(parsed.turmas||[]).length}`,
        `Alunos: ${s.alunos??(parsed.alunos||[]).length}`,
        `Chamadas/frequências: ${s.frequencias??(parsed.frequencias||[]).length}`,
        `Planejamentos: ${s.planejamentos??(parsed.planejamentos||[]).length}`,
        '',
        'Os dados atuais deste aparelho serão substituídos pelos dados do backup.'
      ].join('\n');
      if(!confirm(msg))return;
      Object.entries(payload.localStorage).forEach(([k,v])=>{
        if(typeof v==='string') localStorage.setItem(k,v);
      });
      sessionStorage.setItem('professor_control_session_ok','1');
      alert('Backup restaurado com sucesso. O aplicativo será recarregado agora.');
      location.reload();
    }catch(e){
      console.error(e);
      alert('Não foi possível ler o backup. Verifique se selecionou o arquivo JSON correto.');
    }
  }

  function inject(){
    if(document.getElementById('backupProfessorControl'))return;
    const config=document.querySelector('#view-config .panel') || document.querySelector('#view-config');
    if(!config)return;
    const box=document.createElement('div');
    box.id='backupProfessorControl';
    box.style.cssText='margin-top:22px;padding-top:20px;border-top:1px solid #dce5f1';
    box.innerHTML=`
      <h3 style="margin:0 0 8px">Backup e restauração</h3>
      <p class="muted" style="margin:0 0 14px">Faça uma cópia completa dos dados e escolha onde deseja guardar.</p>
      <div class="button-row" style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="primary" id="pcChooseBackup" style="background:#168f4d">☁️ Escolher local / nuvem</button>
        <button type="button" class="primary ghost" id="pcExportBackup">⬇ Backup rápido</button>
        <label class="primary ghost" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:12px 16px;border-radius:12px">⬆ Restaurar backup
          <input type="file" id="pcImportBackup" accept="application/json,.json" hidden>
        </label>
      </div>
      <div class="notice" style="margin-top:12px"><b>Escolher local / nuvem:</b> no APK abre o seletor do Android, permitindo escolher armazenamento interno, Google Drive, OneDrive ou outros provedores instalados. O backup inclui todos os dados do Professor Control deste aparelho.</div>`;
    config.appendChild(box);
    document.getElementById('pcChooseBackup').onclick=escolherLocalOuNuvem;
    document.getElementById('pcExportBackup').onclick=exportBackupRapido;
    document.getElementById('pcImportBackup').onchange=e=>{const f=e.target.files?.[0];importBackup(f);e.target.value='';};
  }

  window.professorControlExportBackup=exportBackupRapido;
  window.professorControlChooseBackup=escolherLocalOuNuvem;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else setTimeout(inject,0);
})();