(()=>{
  const MAIN_KEY='professorControlV1';
  const AUTO_KEY='professorControlLastAutoBackup';

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

  function backupData(prefix='backup-professor-control'){
    const payload=buildPayload();
    const now=new Date();
    const date=now.toISOString().slice(0,10);
    const time=now.toTimeString().slice(0,5).replace(':','-');
    const filename=`${prefix}-${date}-${time}.json`;
    const text=JSON.stringify(payload,null,2);
    const file=new File([text],filename,{type:'application/json'});
    return {payload,text,file,filename};
  }

  function downloadFallback(file){
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');
    a.href=url;
    a.download=file.name;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }

  function exportBackupRapido(){
    const {text,file,filename}=backupData();
    try{
      if(window.Android && typeof window.Android.saveBackupQuick==='function'){
        const ok=window.Android.saveBackupQuick(text,filename,false);
        if(ok===false) alert('Não foi possível salvar o backup. Tente “Escolher local / nuvem”.');
        return;
      }
    }catch(e){console.error(e)}
    downloadFallback(file);
    alert('Backup solicitado ao navegador. Verifique a pasta Downloads. Se não aparecer, use “Escolher local / nuvem”.');
  }

  async function escolherLocalOuNuvem(){
    const {text,file,filename}=backupData();
    try{
      if(window.Android && typeof window.Android.chooseBackupLocation==='function'){
        window.Android.chooseBackupLocation(text,filename);
        return;
      }
    }catch(e){console.error(e)}
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
      }catch(e){if(e?.name==='AbortError')return;console.error(e)}
    }
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:'Backup Professor Control',text:'Salvar backup do Professor Control / Docência Fácil',files:[file]});
        return;
      }
    }catch(e){if(e?.name==='AbortError')return;console.error(e)}
    downloadFallback(file);
    alert('Seu navegador não permite escolher o local. O download foi solicitado para a pasta Downloads.');
  }

  function tentarBackupAutomatico(){
    try{
      if(!(window.Android && typeof window.Android.saveBackupQuick==='function')) return;
      const hoje=new Date().toISOString().slice(0,10);
      if(localStorage.getItem(AUTO_KEY)===hoje) return;
      const {text,filename}=backupData('backup-auto-professor-control');
      const ok=window.Android.saveBackupQuick(text,filename,true);
      if(ok!==false) localStorage.setItem(AUTO_KEY,hoje);
    }catch(e){console.error('Backup automático:',e)}
  }

  function backupAntesDeFechar(){
    try{
      if(!(window.Android && typeof window.Android.saveBackupQuick==='function')) return false;
      const {text,filename}=backupData('backup-fechamento-professor-control');
      return window.Android.saveBackupQuick(text,filename,false)!==false;
    }catch(e){
      console.error('Backup ao fechar:',e);
      return false;
    }
  }

  async function importBackup(file){
    if(!file)return;
    try{
      const txt=await file.text();
      const payload=JSON.parse(txt);
      if(!payload || payload.app!=='Professor Control / Docência Fácil' || !payload.localStorage || typeof payload.localStorage!=='object'){
        alert('Este arquivo não é um backup válido do Professor Control.');return;
      }
      const raw=payload.localStorage[MAIN_KEY];
      if(!raw){alert('O backup não contém os dados principais do Professor Control.');return;}
      let parsed; try{parsed=JSON.parse(raw)}catch(e){alert('Os dados principais do backup estão inválidos.');return;}
      const s=payload.summary||{};
      const msg=['Restaurar este backup?','',`Escolas: ${s.escolas??(parsed.escolas||[]).length}`,`Turmas: ${s.turmas??(parsed.turmas||[]).length}`,`Alunos: ${s.alunos??(parsed.alunos||[]).length}`,`Chamadas/frequências: ${s.frequencias??(parsed.frequencias||[]).length}`,`Planejamentos: ${s.planejamentos??(parsed.planejamentos||[]).length}`,'','Os dados atuais deste aparelho serão substituídos pelos dados do backup.'].join('\n');
      if(!confirm(msg))return;
      Object.entries(payload.localStorage).forEach(([k,v])=>{if(typeof v==='string') localStorage.setItem(k,v)});
      sessionStorage.setItem('professor_control_session_ok','1');
      alert('Backup restaurado com sucesso. O aplicativo será recarregado agora.');
      location.reload();
    }catch(e){console.error(e);alert('Não foi possível ler o backup. Verifique se selecionou o arquivo JSON correto.')}
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
      <p class="muted" style="margin:0 0 14px">No APK, o sistema faz um backup automático por dia em <b>Downloads/DocenciaFacil</b>. Você também pode fazer uma cópia manual quando quiser.</p>
      <div class="button-row" style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="primary" id="pcChooseBackup" style="background:#168f4d">☁️ Escolher local / nuvem</button>
        <button type="button" class="primary ghost" id="pcExportBackup">⬇ Backup rápido</button>
        <label class="primary ghost" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:12px 16px;border-radius:12px">⬆ Restaurar backup<input type="file" id="pcImportBackup" accept="application/json,.json" hidden></label>
      </div>
      <div class="notice" style="margin-top:12px"><b>Backup automático:</b> no APK é salvo uma vez por dia em Downloads/DocenciaFacil. <b>Escolher local / nuvem:</b> permite selecionar armazenamento interno, Google Drive, OneDrive ou outro provedor disponível.</div>`;
    config.appendChild(box);
    document.getElementById('pcChooseBackup').onclick=escolherLocalOuNuvem;
    document.getElementById('pcExportBackup').onclick=exportBackupRapido;
    document.getElementById('pcImportBackup').onchange=e=>{const f=e.target.files?.[0];importBackup(f);e.target.value=''};
  }

  window.professorControlExportBackup=exportBackupRapido;
  window.professorControlChooseBackup=escolherLocalOuNuvem;
  window.professorControlBackupForExit=backupAntesDeFechar;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{inject();setTimeout(tentarBackupAutomatico,1800)});
  else{setTimeout(inject,0);setTimeout(tentarBackupAutomatico,1800)}
})();