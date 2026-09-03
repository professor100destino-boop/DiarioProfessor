(()=>{
  const $=s=>document.querySelector(s);

  function noApk(){
    try{return !!(window.Android && typeof window.Android.requestCloseApp==='function')}catch(e){return false}
  }

  function addStyles(){
    if(document.getElementById('appLifecycleStyles'))return;
    const s=document.createElement('style');
    s.id='appLifecycleStyles';
    s.textContent=`
      #closeAppNav{margin-top:10px!important;color:#fecaca!important}
      #closeAppNav .nav-ico{background:#7f1d1d!important;color:#fff!important}
      #closeAppNav:hover{background:rgba(185,28,28,.22)!important}
    `;
    document.head.appendChild(s);
  }

  function addCloseButton(){
    if(!noApk() || document.getElementById('closeAppNav'))return;
    const nav=document.querySelector('.sidebar nav, nav.sidebar-nav, aside nav');
    if(!nav)return;
    const b=document.createElement('button');
    b.type='button';
    b.id='closeAppNav';
    b.className='nav-item';
    b.innerHTML='<span class="nav-ico">⏻</span><span>Fechar aplicativo</span>';
    b.onclick=()=>{
      try{window.Android.requestCloseApp()}catch(e){console.error(e)}
    };
    nav.appendChild(b);
  }

  function closeAnyModal(){
    const dialogs=[...document.querySelectorAll('dialog[open]')];
    if(dialogs.length){
      try{dialogs[dialogs.length-1].close()}catch(e){}
      return true;
    }
    const overlays=[...document.querySelectorAll('#pdfActionsOverlay,#advPrintOverlay,.modal-overlay.show,.modal.show')];
    const ov=overlays.find(x=>x&&getComputedStyle(x).display!=='none');
    if(ov){ov.remove?.();return true}
    return false;
  }

  window.professorControlHandleBack=function(){
    try{
      const sidebar=$('#sidebar');
      if(sidebar?.classList.contains('open')){sidebar.classList.remove('open');return true}
      if(closeAnyModal())return true;
      const active=$('.view.active');
      if(active && active.id!=='view-dashboard'){
        if(typeof go==='function')go('dashboard');
        return true;
      }
    }catch(e){console.error(e)}
    return false;
  };

  function init(){addStyles();addCloseButton();setTimeout(addCloseButton,800);setTimeout(addCloseButton,2500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();