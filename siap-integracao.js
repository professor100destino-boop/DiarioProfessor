(()=>{
  const SIAP_HOME='https://siap.educacao.go.gov.br/';
  const SIAP_PLANEJAMENTO='https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx';
  const $=s=>document.querySelector(s);
  const inAndroid=()=>{try{return !!(window.Android&&typeof window.Android.openSiap==='function')}catch(e){return false}};

  function openSiap(url=SIAP_HOME){
    try{
      if(inAndroid()){
        if(url===SIAP_PLANEJAMENTO&&typeof window.Android.openPlanning==='function') window.Android.openPlanning();
        else window.Android.openSiap();
        return;
      }
    }catch(e){}
    if(typeof go==='function'){
      go('siap');
      const p=$('#pageTitle'); if(p)p.textContent='SIAP Fácil';
    } else location.href=url;
  }

  function inject(){
    if(!$('#view-siap')){
      const config=$('#view-config');
      const sec=document.createElement('section');
      sec.id='view-siap'; sec.className='view';
      sec.innerHTML=`<div class="section-shell">
        <div class="section-head"><div><h2>SIAP Fácil</h2><p>Acesso ao SIAP/SEDUC-GO integrado ao Docência Fácil.</p></div></div>
        <div class="panel" style="max-width:900px">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">
            <button class="primary" id="abrirSiapIntegrado" style="min-height:86px;font-size:18px">Abrir SIAP Fácil<br><small>Login, frequência, conteúdos e troca de escola</small></button>
            <button class="primary ghost" id="abrirPlanejamentoSiap" style="min-height:86px;font-size:18px">Planejamento SIAP<br><small>Acesso direto ao planejamento</small></button>
          </div>
          <div class="notice" style="margin-top:16px"><b>No APK:</b> ao tocar em SIAP Fácil no menu, o aplicativo abre diretamente o SIAP Fácil original, com Configurações, Painel, Código de segurança e menu próprio.</div>
        </div>
      </div>`;
      config?.parentNode?.insertBefore(sec,config);
      $('#abrirSiapIntegrado')?.addEventListener('click',()=>openSiap());
      $('#abrirPlanejamentoSiap')?.addEventListener('click',()=>openSiap(SIAP_PLANEJAMENTO));
    }

    if(!document.querySelector('.nav-item[data-view="siap"]')){
      const nav=document.querySelector('.sidebar nav')||document.querySelector('nav');
      const btn=document.createElement('button');
      btn.className='nav-item'; btn.dataset.view='siap';
      btn.innerHTML='<span class="nav-ico">🏫</span><span>SIAP Fácil</span>';
      const cfg=document.querySelector('.nav-item[data-view="config"]');
      if(cfg&&cfg.parentNode===nav) nav.insertBefore(btn,cfg); else nav?.appendChild(btn);
      btn.addEventListener('click',(ev)=>{
        if(inAndroid()){
          ev.preventDefault(); ev.stopPropagation();
          window.Android.openSiap();
          return;
        }
        if(typeof go==='function')go('siap');
        const p=$('#pageTitle'); if(p)p.textContent='SIAP Fácil';
      },true);
    }

    if(!$('#siapHomeQuick')){
      const actions=document.querySelector('.hero-actions');
      if(actions){
        const b=document.createElement('button');
        b.id='siapHomeQuick'; b.className='primary hero-action-btn';
        b.style.background='linear-gradient(135deg,#0f766e,#0d9488)';
        b.innerHTML='SIAP Fácil<span>Abrir SIAP Fácil original</span>';
        b.onclick=()=>{
          if(inAndroid()) window.Android.openSiap();
          else {if(typeof go==='function')go('siap');const p=$('#pageTitle');if(p)p.textContent='SIAP Fácil'}
        };
        actions.appendChild(b);
      }
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();