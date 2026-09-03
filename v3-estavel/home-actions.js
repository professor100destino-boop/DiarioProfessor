(()=>{
  function addActivitiesButton(){
    const actions=document.querySelector('.hero-actions');
    if(!actions || actions.querySelector('[data-go="atividades"]')) return;

    const btn=document.createElement('button');
    btn.className='primary hero-action-btn hero-action-orange';
    btn.setAttribute('data-go','atividades');
    btn.innerHTML='Atividades<span>Lançar e acompanhar atividades</span>';
    btn.addEventListener('click',()=>{
      if(typeof go==='function') go('atividades');
    });
    actions.appendChild(btn);

    const style=document.createElement('style');
    style.textContent=`
      .hero-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}
      .hero-action-orange{background:linear-gradient(135deg,#f59e0b,#ea580c)!important;color:#fff!important}
      @media(max-width:820px){.hero-actions{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addActivitiesButton);
  else addActivitiesButton();
})();