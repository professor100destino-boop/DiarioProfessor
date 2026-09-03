(()=>{
  const $=window.$||((s)=>document.querySelector(s));

  function turmaLabel(t){
    if(!t) return '';
    const serie=t.serie||'';
    const turma=t.turma||'';
    const disciplina=t.disciplina||'';
    return `${serie} ${turma}${disciplina?' • '+disciplina:''}`.trim();
  }

  function ensureFreqEscola(){
    const turmaSel=$('#freqTurma');
    if(!turmaSel || !window.db) return null;

    let escolaSel=$('#freqEscola');
    if(!escolaSel){
      escolaSel=document.createElement('select');
      escolaSel.id='freqEscola';
      escolaSel.setAttribute('aria-label','Escola');
      escolaSel.title='Selecione a escola';
      turmaSel.insertAdjacentElement('beforebegin',escolaSel);
    }
    return escolaSel;
  }

  function syncFreqEscolaTurmas(preserve=true){
    if(!window.db) return;
    const escolaSel=ensureFreqEscola();
    const turmaSel=$('#freqTurma');
    if(!escolaSel || !turmaSel) return;

    const oldEscola=escolaSel.value;
    const oldTurma=turmaSel.value;

    escolaSel.innerHTML=(db.escolas||[]).map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('');

    let escolaId='';
    if(preserve && (db.escolas||[]).some(e=>e.id===oldEscola)) escolaId=oldEscola;
    else {
      const turmaAtual=(db.turmas||[]).find(t=>t.id===oldTurma);
      escolaId=turmaAtual?.escolaId || (db.escolas||[])[0]?.id || '';
    }
    escolaSel.value=escolaId;

    const turmas=(db.turmas||[]).filter(t=>t.escolaId===escolaId);
    turmaSel.innerHTML=turmas.map(t=>`<option value="${t.id}">${esc(turmaLabel(t))}</option>`).join('');

    if(preserve && turmas.some(t=>t.id===oldTurma)) turmaSel.value=oldTurma;
    else if(turmas.length) turmaSel.value=turmas[0].id;

    if(typeof renderFreq==='function') renderFreq();
  }

  function init(){
    const escolaSel=ensureFreqEscola();
    if(!escolaSel) return;

    syncFreqEscolaTurmas(false);

    escolaSel.onchange=()=>{
      const turmaSel=$('#freqTurma');
      const escolaId=escolaSel.value;
      const turmas=(db.turmas||[]).filter(t=>t.escolaId===escolaId);
      turmaSel.innerHTML=turmas.map(t=>`<option value="${t.id}">${esc(turmaLabel(t))}</option>`).join('');
      if(turmas.length) turmaSel.value=turmas[0].id;
      if(typeof renderFreq==='function') renderFreq();
    };

    if(typeof renderAll==='function' && !window.__freqSchoolRenderWrapped){
      window.__freqSchoolRenderWrapped=true;
      const originalRenderAll=renderAll;
      renderAll=function(){
        originalRenderAll();
        syncFreqEscolaTurmas(true);
      };
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();