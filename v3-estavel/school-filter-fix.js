(()=>{
  function aplicarFiltroEscolaTurmas(){
    const escolaSel=document.querySelector('#alunosEscola');
    const turmaSel=document.querySelector('#alunosTurma');
    if(!escolaSel||!turmaSel||!window.db)return;

    const atualizar=()=>{
      const escolaId=escolaSel.value||'';
      const turmas=(db.turmas||[]).filter(t=>t.escolaId===escolaId);
      const atual=turmaSel.value;
      turmaSel.innerHTML=turmas.map(t=>`<option value="${t.id}">${esc(turmaNome(t))}</option>`).join('');
      if(turmas.some(t=>t.id===atual)) turmaSel.value=atual;
      else if(turmas.length) turmaSel.value=turmas[0].id;
      if(typeof renderAlunos==='function') renderAlunos();
    };

    escolaSel.onchange=atualizar;
    atualizar();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',aplicarFiltroEscolaTurmas);
  else aplicarFiltroEscolaTurmas();
})();