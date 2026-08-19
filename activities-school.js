(()=>{
  const $=window.$||((s)=>document.querySelector(s));

  function turmaLabel(t){
    if(!t)return '';
    return `${t.serie||''} ${t.turma||''}${t.disciplina?' • '+t.disciplina:''}`.trim();
  }

  function ensure(){
    const turmaSel=$('#atividadesTurma');
    if(!turmaSel||!window.db)return null;
    let escolaSel=$('#atividadesEscola');
    if(!escolaSel){
      escolaSel=document.createElement('select');
      escolaSel.id='atividadesEscola';
      escolaSel.setAttribute('aria-label','Escola');
      escolaSel.title='Selecione a escola';
      turmaSel.insertAdjacentElement('beforebegin',escolaSel);
    }
    return escolaSel;
  }

  function refreshTurmas(preserve=true){
    const escolaSel=ensure();
    const turmaSel=$('#atividadesTurma');
    if(!escolaSel||!turmaSel)return;

    const oldEscola=escolaSel.value;
    const oldTurma=turmaSel.value;

    escolaSel.innerHTML=(db.escolas||[]).map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('');

    let escolaId='';
    if(preserve&&(db.escolas||[]).some(e=>e.id===oldEscola))escolaId=oldEscola;
    else{
      const turmaAtual=(db.turmas||[]).find(t=>t.id===oldTurma);
      escolaId=turmaAtual?.escolaId||(db.escolas||[])[0]?.id||'';
    }
    escolaSel.value=escolaId;

    const turmas=(db.turmas||[]).filter(t=>t.escolaId===escolaId);
    turmaSel.innerHTML=turmas.map(t=>`<option value="${t.id}">${esc(turmaLabel(t))}</option>`).join('');
    if(preserve&&turmas.some(t=>t.id===oldTurma))turmaSel.value=oldTurma;
    else if(turmas.length)turmaSel.value=turmas[0].id;

    if(typeof renderAtividades==='function')renderAtividades();
  }

  function init(){
    const escolaSel=ensure();
    if(!escolaSel)return;
    refreshTurmas(false);
    escolaSel.onchange=()=>{
      const turmaSel=$('#atividadesTurma');
      const turmas=(db.turmas||[]).filter(t=>t.escolaId===escolaSel.value);
      turmaSel.innerHTML=turmas.map(t=>`<option value="${t.id}">${esc(turmaLabel(t))}</option>`).join('');
      if(turmas.length)turmaSel.value=turmas[0].id;
      if(typeof renderAtividades==='function')renderAtividades();
    };

    if(typeof renderAll==='function'&&!window.__ativSchoolRenderWrapped){
      window.__ativSchoolRenderWrapped=true;
      const originalRenderAll=renderAll;
      renderAll=function(){
        originalRenderAll();
        refreshTurmas(true);
      };
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();