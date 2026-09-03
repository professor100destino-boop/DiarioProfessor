(()=>{
  let running=false;

  function setUpdateStatus(msg,ok=true){
    document.querySelectorAll('[data-pc-update-status]').forEach(el=>{
      el.textContent=msg;
      el.style.color=ok?'#166534':'#b91c1c';
    });
  }

  async function atualizarDentroDoApp(button){
    if(running)return;
    if(!navigator.onLine){alert('Conecte à internet para atualizar o sistema.');return;}
    running=true;
    const old=button?.innerHTML;
    if(button){button.disabled=true;button.innerHTML='Atualizando...<span>Buscando arquivos novos</span>'}
    setUpdateStatus('Verificando a versão mais recente…',true);

    try{
      const check=await fetch('./index.html?check='+Date.now(),{cache:'no-store'});
      if(!check.ok)throw new Error('Servidor indisponível');

      sessionStorage.setItem('professor_control_session_ok','1');

      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        for(const reg of regs){try{await reg.unregister()}catch(e){}}
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>k.startsWith('professor-control-')).map(k=>caches.delete(k)));
      }

      setUpdateStatus('Atualização preparada. Reabrindo o sistema…',true);
      const u=new URL('./',location.href);
      u.searchParams.set('fresh',Date.now().toString());
      setTimeout(()=>location.replace(u.toString()),450);
    }catch(err){
      console.error(err);
      running=false;
      if(button){button.disabled=false;button.innerHTML=old}
      setUpdateStatus('Não foi possível atualizar. Seus dados não foram alterados.',false);
      alert('Não foi possível atualizar agora. Seus dados continuam intactos. Verifique a internet e tente novamente.');
    }
  }

  function addHomeButton(){
    const actions=document.querySelector('.hero-actions');
    if(!actions || document.getElementById('updateAppBtn')) return;
    const btn=document.createElement('button');
    btn.id='updateAppBtn';
    btn.className='primary hero-action-btn hero-action-update';
    btn.innerHTML='Atualizar sistema<span>Atualiza sem sair do aplicativo</span>';
    btn.addEventListener('click',()=>atualizarDentroDoApp(btn));
    actions.appendChild(btn);
  }

  function addSettingsPanel(){
    if(document.getElementById('pcUpdatePanel'))return;
    const config=document.querySelector('#view-config .panel') || document.querySelector('#view-config');
    if(!config)return;
    const box=document.createElement('div');
    box.id='pcUpdatePanel';
    box.style.cssText='margin-top:22px;padding-top:20px;border-top:1px solid #dce5f1';
    box.innerHTML=`
      <h3 style="margin:0 0 8px">Atualizações</h3>
      <p class="muted" style="margin:0 0 14px">As atualizações normais do Professor Control agora são feitas <b>dentro do próprio Docência Fácil</b>. Escolas, turmas, alunos, notas e demais dados locais não são apagados.</p>
      <button type="button" class="primary" id="pcUpdateNow" style="background:#0f4fa8">🔄 Atualizar sistema agora</button>
      <div data-pc-update-status style="margin-top:10px;font-weight:700;color:#475569">Pronto para verificar atualizações.</div>`;
    config.appendChild(box);
    const btn=box.querySelector('#pcUpdateNow');
    btn.onclick=()=>atualizarDentroDoApp(btn);
  }

  function style(){
    if(document.getElementById('pcUpdateStyle'))return;
    const s=document.createElement('style');s.id='pcUpdateStyle';
    s.textContent=`
      .hero-action-update{background:linear-gradient(135deg,#475569,#0f172a)!important;color:#fff!important}
      .hero-actions{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      @media(max-width:1100px){.hero-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:700px){.hero-actions{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(s);
  }

  function init(){style();addHomeButton();addSettingsPanel();}
  window.professorControlUpdateNow=atualizarDentroDoApp;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();