(()=>{
  function addUpdateButton(){
    const actions=document.querySelector('.hero-actions');
    if(!actions || document.getElementById('updateAppBtn')) return;

    const btn=document.createElement('button');
    btn.id='updateAppBtn';
    btn.className='primary hero-action-btn hero-action-update';
    btn.innerHTML='Atualizar aplicativo<span>Buscar a versão mais recente</span>';

    btn.addEventListener('click',async()=>{
      if(!navigator.onLine){
        alert('Conecte à internet para atualizar o aplicativo.');
        return;
      }

      const original=btn.innerHTML;
      btn.disabled=true;
      btn.innerHTML='Atualizando...<span>Fechando a versão antiga</span>';

      try{
        sessionStorage.setItem('professor_control_session_ok','1');

        if('serviceWorker' in navigator){
          const regs=await navigator.serviceWorker.getRegistrations();
          for(const reg of regs){
            try{ await reg.unregister(); }catch(e){}
          }
        }

        if('caches' in window){
          const keys=await caches.keys();
          await Promise.all(
            keys
              .filter(k=>k.startsWith('professor-control-'))
              .map(k=>caches.delete(k))
          );
        }

        const destino=new URL('./atualizar.html',location.href);
        destino.searchParams.set('pwa','1');
        destino.searchParams.set('ts',Date.now().toString());
        location.replace(destino.toString());
      }catch(err){
        console.error(err);
        btn.disabled=false;
        btn.innerHTML=original;
        alert('Não foi possível concluir a atualização. Verifique a internet e tente novamente.');
      }
    });

    actions.appendChild(btn);

    const style=document.createElement('style');
    style.textContent=`
      .hero-action-update{background:linear-gradient(135deg,#475569,#0f172a)!important;color:#fff!important}
      .hero-actions{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      @media(max-width:1100px){.hero-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:700px){.hero-actions{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addUpdateButton);
  else addUpdateButton();
})();