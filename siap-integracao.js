(()=>{
  const SIAP_HOME='https://siap.educacao.go.gov.br/';
  const SIAP_PLANEJAMENTO='https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx';
  const $=s=>document.querySelector(s);

  function openSiap(url=SIAP_HOME){
    try{
      if(window.Android&&typeof window.Android.openSiap==='function'){
        if(url===SIAP_PLANEJAMENTO&&typeof window.Android.openPlanning==='function') window.Android.openPlanning();
        else window.Android.openSiap();
        return;
      }
    }catch(e){}
    location.href=url;
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
          <div class="notice" style="margin-top:16px"><b>No APK único:</b> o SIAP abre dentro do próprio aplicativo, mantendo cookies e sessão. Use a barra superior para voltar ao Docência Fácil, recarregar, alterar zoom e orientação.</div>
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
      btn.addEventListener('click',()=>{
        if(typeof go==='function')go('siap');
        const p=$('#pageTitle'); if(p)p.textContent='SIAP Fácil';
      });
    }

    if(!$('#siapHomeQuick')){
      const actions=document.querySelector('.hero-actions');
      if(actions){
        const b=document.createElement('button');
        b.id='siapHomeQuick'; b.className='primary hero-action-btn';
        b.style.background='linear-gradient(135deg,#0f766e,#0d9488)';
        b.innerHTML='SIAP Fácil<span>Abrir portal integrado</span>';
        b.onclick=()=>{if(typeof go==='function')go('siap');const p=$('#pageTitle');if(p)p.textContent='SIAP Fácil'};
        actions.appendChild(b);
      }
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();