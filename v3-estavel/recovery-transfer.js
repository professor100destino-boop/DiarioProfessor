(()=>{
  const MAIN_KEY='professorControlV1';
  const TYPE='professor-control-recovery-v1';

  function collect(){
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k!=null) storage[k]=localStorage.getItem(k);
    }
    let summary={};
    try{
      const d=JSON.parse(storage[MAIN_KEY]||'{}');
      summary={
        escolas:Array.isArray(d.escolas)?d.escolas.length:0,
        turmas:Array.isArray(d.turmas)?d.turmas.length:0,
        alunos:Array.isArray(d.alunos)?d.alunos.length:0,
        frequencias:Array.isArray(d.frequencias)?d.frequencias.length:0,
        avaliacoes:Array.isArray(d.avaliacoes)?d.avaliacoes.length:0,
        planejamentos:Array.isArray(d.planejamentos)?d.planejamentos.length:0,
        advertencias:Array.isArray(d.advertencias)?d.advertencias.length:0,
        horarios:Array.isArray(d.horarios)?d.horarios.length:0
      };
    }catch(e){}
    return {type:TYPE,createdAt:new Date().toISOString(),storage,summary};
  }

  function validPackage(text){
    const p=JSON.parse(text);
    if(!p||p.type!==TYPE||!p.storage||typeof p.storage!=='object') throw new Error('Código de recuperação inválido.');
    if(!p.storage[MAIN_KEY]) throw new Error('O código não contém o banco principal do Professor Control.');
    JSON.parse(p.storage[MAIN_KEY]);
    return p;
  }

  function modal(title,bodyHtml){
    document.getElementById('pcRecoveryModal')?.remove();
    const wrap=document.createElement('div');
    wrap.id='pcRecoveryModal';
    wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#08152fcc;display:grid;place-items:center;padding:18px';
    wrap.innerHTML=`<div style="width:min(820px,100%);max-height:92vh;overflow:auto;background:white;border-radius:22px;padding:22px;box-shadow:0 20px 70px #0005;color:#14213d"><div style="display:flex;gap:12px;align-items:center;justify-content:space-between"><h2 style="margin:0">${title}</h2><button type="button" id="pcRecoveryClose" style="border:0;background:#e8eef7;border-radius:10px;padding:8px 12px;font-size:20px">✕</button></div>${bodyHtml}</div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#pcRecoveryClose').onclick=()=>wrap.remove();
    return wrap;
  }

  async function copyText(text,ta){
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}
    }catch(e){}
    try{
      ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
      return document.execCommand('copy');
    }catch(e){return false;}
  }

  function openExport(){
    const p=collect();
    let hasData=false;
    try{const d=JSON.parse(p.storage[MAIN_KEY]||'{}');hasData=(d.alunos?.length||0)+(d.turmas?.length||0)+(d.escolas?.length||0)>0;}catch(e){}
    if(!p.storage[MAIN_KEY]){alert('Este aplicativo não possui o banco principal do Professor Control neste armazenamento. Não apague nada; abra a instalação que ainda mostra seus alunos e turmas.');return;}
    const text=JSON.stringify(p);
    const s=p.summary||{};
    const m=modal('Recuperar dados deste aplicativo',`
      <p style="line-height:1.5"><b>Não é backup por download.</b> Este código é lido diretamente do armazenamento desta instalação.</p>
      <div style="background:${hasData?'#e8f7ee':'#fff2e8'};padding:12px;border-radius:12px;margin:12px 0;font-weight:700">Escolas: ${s.escolas||0} • Turmas: ${s.turmas||0} • Alunos: ${s.alunos||0} • Chamadas: ${s.frequencias||0}</div>
      <textarea id="pcRecoveryOut" readonly style="width:100%;height:230px;border:1px solid #cbd5e1;border-radius:12px;padding:12px;font:12px monospace">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button id="pcRecoveryCopy" type="button" style="border:0;border-radius:12px;padding:14px 18px;background:#168f4d;color:white;font-weight:800;font-size:16px">📋 Copiar código de recuperação</button></div>
      <p id="pcRecoveryMsg" style="font-weight:700"></p>
      <p style="color:#64748b;line-height:1.5">Depois abra o Docência Fácil novo e toque em <b>IMPORTAR DADOS DO APLICATIVO ANTIGO</b>. Se a cópia automática não funcionar, mantenha pressionado dentro da caixa acima, selecione tudo e copie.</p>`);
    const ta=m.querySelector('#pcRecoveryOut');
    m.querySelector('#pcRecoveryCopy').onclick=async()=>{
      const ok=await copyText(text,ta);
      const msg=m.querySelector('#pcRecoveryMsg');
      msg.textContent=ok?'✓ Código copiado. Agora abra o aplicativo novo.':'Não foi possível copiar automaticamente. Selecione todo o conteúdo da caixa e copie manualmente.';
      msg.style.color=ok?'#166534':'#b45309';
    };
  }

  function openImport(){
    const m=modal('Importar dados do aplicativo antigo',`
      <p style="line-height:1.5">Cole abaixo o código gerado no aplicativo antigo. <b>Os dados atuais desta instalação serão substituídos pelos dados recuperados.</b></p>
      <textarea id="pcRecoveryIn" placeholder="Cole aqui o código de recuperação…" style="width:100%;height:230px;border:1px solid #cbd5e1;border-radius:12px;padding:12px;font:12px monospace"></textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button id="pcRecoveryImport" type="button" style="border:0;border-radius:12px;padding:14px 18px;background:#2563eb;color:white;font-weight:800;font-size:16px">⬆ Importar e recuperar dados</button></div>
      <p id="pcRecoveryImportMsg" style="font-weight:700"></p>`);
    m.querySelector('#pcRecoveryImport').onclick=()=>{
      const msg=m.querySelector('#pcRecoveryImportMsg');
      try{
        const p=validPackage(m.querySelector('#pcRecoveryIn').value.trim());
        const s=p.summary||{};
        if(!confirm(`Recuperar estes dados?\n\nEscolas: ${s.escolas??'?'}\nTurmas: ${s.turmas??'?'}\nAlunos: ${s.alunos??'?'}\nChamadas: ${s.frequencias??'?'}\n\nOs dados atuais desta instalação serão substituídos.`)) return;
        Object.keys(localStorage).forEach(k=>localStorage.removeItem(k));
        Object.entries(p.storage).forEach(([k,v])=>{if(typeof v==='string')localStorage.setItem(k,v)});
        sessionStorage.setItem('professor_control_session_ok','1');
        alert('Dados recuperados com sucesso. O aplicativo será reaberto agora.');
        location.reload();
      }catch(e){msg.textContent=e.message||'Não foi possível importar o código.';msg.style.color='#b91c1c';}
    };
  }

  function injectAuth(){
    const lock=document.getElementById('authLock');
    if(!lock||document.getElementById('pcRecoveryAuthBtn'))return;
    const card=lock.querySelector('.auth-card')||lock.firstElementChild;
    if(!card)return;
    const b=document.createElement('button');
    b.id='pcRecoveryAuthBtn';b.type='button';
    b.textContent='↩ IMPORTAR DADOS DO APLICATIVO ANTIGO';
    b.style.cssText='width:100%;margin-top:12px;border:2px solid #2563eb;background:#eef5ff;color:#174a84;border-radius:12px;padding:13px;font-weight:900;font-size:15px';
    b.onclick=openImport;
    card.appendChild(b);
  }

  function injectSettings(){
    if(document.getElementById('pcRecoverySettings'))return;
    const config=document.querySelector('#view-config .panel')||document.querySelector('#view-config');
    if(!config)return;
    const box=document.createElement('div');box.id='pcRecoverySettings';
    box.style.cssText='margin-top:20px;padding-top:18px;border-top:1px solid #dce5f1';
    box.innerHTML='<h3 style="margin:0 0 8px">Recuperação de emergência</h3><p class="muted" style="margin:0 0 12px">Use isto para transferir os dados diretamente desta instalação, mesmo se o backup por arquivo estiver com problema.</p><button type="button" id="pcRecoveryExport" style="border:0;border-radius:12px;padding:14px 18px;background:#b45309;color:white;font-weight:900;font-size:16px">🛟 RECUPERAR DADOS DESTA INSTALAÇÃO</button>';
    config.appendChild(box);
    box.querySelector('#pcRecoveryExport').onclick=openExport;
  }

  function init(){injectAuth();injectSettings();setTimeout(injectAuth,800);setTimeout(injectSettings,800);}
  window.professorControlRecoveryExport=openExport;
  window.professorControlRecoveryImport=openImport;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
