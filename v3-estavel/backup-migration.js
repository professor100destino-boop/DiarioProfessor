(()=>{
  const MAIN_KEY='professorControlV1';
  const AUTO_KEY='professorControlLastAutoBackup';
  const LAST_INFO_KEY='professorControlLastBackupInfo';

  function hasNative(name){
    try{return !!(window.Android && typeof window.Android[name]==='function')}catch(e){return false}
  }

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

  function saveLastInfo(ok,message,filename=''){
    const info={ok:!!ok,message:String(message||''),filename:String(filename||''),at:new Date().toISOString()};
    try{localStorage.setItem(LAST_INFO_KEY,JSON.stringify(info))}catch(e){}
    renderStatus(info);
  }

  function getLastInfo(){
    try{return JSON.parse(localStorage.getItem(LAST_INFO_KEY)||'null')}catch(e){return null}
  }

  function renderStatus(info=getLastInfo()){
    const el=document.getElementById('pcBackupStatus');
    if(!el)return;
    if(!info){
      el.textContent='Nenhum backup manual confirmado nesta instalação.';
      el.style.background='#f1f5f9';
      el.style.color='#475569';
      return;
    }
    let when='';
    try{when=new Date(info.at).toLocaleString('pt-BR')}catch(e){}
    el.textContent=`${info.ok?'✓':'⚠'} ${info.message}${when?' • '+when:''}`;
    el.style.background=info.ok?'#e8f7ee':'#fff2e8';
    el.style.color=info.ok?'#126b3a':'#9a3412';
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

  async function escolherLocalOuNuvem(){
    const {text,file,filename}=backupData();
    try{
      if(hasNative('chooseBackupLocation')){
        saveLastInfo(true,'Seletor de destino aberto. Confirme o local para concluir o backup.',filename);
        window.Android.chooseBackupLocation(text,filename);
        return;
      }
    }catch(e){console.error('Backup nativo - escolher local:',e)}

    if(typeof window.showSaveFilePicker==='function'){
      try{
        const handle=await window.showSaveFilePicker({
          suggestedName:filename,
          types:[{description:'Backup do Professor Control',accept:{'application/json':['.json']}}]
        });
        const writable=await handle.createWritable();
        await writable.write(text);
        await writable.close();
        saveLastInfo(true,'Backup salvo no local escolhido.',filename);
        alert('Backup salvo com sucesso.');
        return;
      }catch(e){if(e?.name==='AbortError')return;console.error(e)}
    }

    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:'Backup Professor Control',text:'Salvar backup do Professor Control / Docência Fácil',files:[file]});
        saveLastInfo(true,'Backup enviado para o destino escolhido no compartilhamento.',filename);
        return;
      }
    }catch(e){if(e?.name==='AbortError')return;console.error(e)}

    downloadFallback(file);
    saveLastInfo(true,'Download do backup solicitado ao navegador.',filename);
    alert('O backup foi enviado para o sistema de downloads do navegador.');
  }

  function salvarEmDownloads(){
    const {text,file,filename}=backupData();
    try{
      if(hasNative('saveBackupQuick')){
        const ok=window.Android.saveBackupQuick(text,filename,false);
        if(ok===true){
          saveLastInfo(true,'Backup salvo em Downloads/DocenciaFacil.',filename);
          return true;
        }
        saveLastInfo(false,'O salvamento direto em Downloads falhou. Abrindo o seletor de destino.',filename);
        setTimeout(()=>escolherLocalOuNuvem(),150);
        return false;
      }
    }catch(e){console.error('Backup nativo - Downloads:',e)}

    try{
      downloadFallback(file);
      saveLastInfo(true,'Download do backup solicitado ao navegador.',filename);
      return true;
    }catch(e){
      console.error(e);
      saveLastInfo(false,'Não foi possível iniciar o backup.',filename);
      return false;
    }
  }

  function exportBackupRapido(){
    return escolherLocalOuNuvem();
  }

  function tentarBackupAutomatico(){
    try{
      if(!hasNative('saveBackupQuick')) return;
      const hoje=new Date().toISOString().slice(0,10);
      if(localStorage.getItem(AUTO_KEY)===hoje) return;
      const {text,filename}=backupData('backup-auto-professor-control');
      const ok=window.Android.saveBackupQuick(text,filename,true);
      if(ok===true) localStorage.setItem(AUTO_KEY,hoje);
    }catch(e){console.error('Backup automático:',e)}
  }

  function backupAntesDeFechar(){
    try{
      if(!hasNative('saveBackupQuick')) return false;
      const {text,filename}=backupData('backup-fechamento-professor-control');
      return window.Android.saveBackupQuick(text,filename,false)===true;
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
      const msg=[
        'Restaurar este backup?','',
        `Escolas: ${s.escolas??(parsed.escolas||[]).length}`,
        `Turmas: ${s.turmas??(parsed.turmas||[]).length}`,
        `Alunos: ${s.alunos??(parsed.alunos||[]).length}`,
        `Chamadas/frequências: ${s.frequencias??(parsed.frequencias||[]).length}`,
        `Planejamentos: ${s.planejamentos??(parsed.planejamentos||[]).length}`,
        '',
        'Os dados atuais deste aparelho serão substituídos pelos dados do backup.'
      ].join('\n');
      if(!confirm(msg))return;
      Object.entries(payload.localStorage).forEach(([k,v])=>{if(typeof v==='string') localStorage.setItem(k,v)});
      sessionStorage.setItem('professor_control_session_ok','1');
      alert('Backup restaurado com sucesso. O aplicativo será recarregado agora.');
      location.reload();
    }catch(e){console.error(e);alert('Não foi possível ler o backup. Verifique se selecionou o arquivo JSON correto.')}
  }

  function inject(){
    if(document.getElementById('backupProfessorControl')){renderStatus();return;}
    const config=document.querySelector('#view-config .panel') || document.querySelector('#view-config');
    if(!config)return;
    const box=document.createElement('div');
    box.id='backupProfessorControl';
    box.style.cssText='margin-top:22px;padding-top:20px;border-top:1px solid #dce5f1';
    box.innerHTML=`
      <h3 style="margin:0 0 8px">Backup e restauração</h3>
      <p class="muted" style="margin:0 0 14px">Use <b>Salvar backup agora</b> para escolher a pasta, Google Drive, OneDrive ou outro destino. O sistema só informa sucesso depois de iniciar uma forma real de salvamento.</p>
      <div class="button-row" style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="primary" id="pcChooseBackup" style="background:#168f4d">💾 Salvar backup agora</button>
        <button type="button" class="primary ghost" id="pcExportBackup">📥 Salvar em Downloads</button>
        <label class="primary ghost" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:12px 16px;border-radius:12px">⬆ Restaurar backup<input type="file" id="pcImportBackup" accept="application/json,.json" hidden></label>
      </div>
      <div id="pcBackupStatus" style="margin-top:12px;padding:11px 13px;border-radius:12px;font-weight:700"></div>
      <div class="notice" style="margin-top:12px"><b>Backup automático:</b> no APK, o sistema tenta uma cópia diária em Downloads/DocenciaFacil. Ele só marca o dia como concluído quando o Android confirma o salvamento.</div>`;
    config.appendChild(box);
    document.getElementById('pcChooseBackup').onclick=escolherLocalOuNuvem;
    document.getElementById('pcExportBackup').onclick=salvarEmDownloads;
    document.getElementById('pcImportBackup').onchange=e=>{const f=e.target.files?.[0];importBackup(f);e.target.value=''};
    renderStatus();
  }

  window.professorControlExportBackup=exportBackupRapido;
  window.professorControlChooseBackup=escolherLocalOuNuvem;
  window.professorControlSaveBackupDownloads=salvarEmDownloads;
  window.professorControlBackupForExit=backupAntesDeFechar;
  window.professorControlNativeBackupResult=function(ok,message,filename){
    saveLastInfo(!!ok,message||(ok?'Backup salvo com sucesso.':'Falha ao salvar backup.'),filename||'');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{inject();setTimeout(tentarBackupAutomatico,1800)});
  else{setTimeout(inject,0);setTimeout(tentarBackupAutomatico,1800)}
})();