(()=>{
  let editingId=null;

  const db=()=>window.db;
  const persist=()=>localStorage.setItem('professorControlV1',JSON.stringify(db()));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function passwordChecker(){
    if(typeof window.securityCheckPassword==='function')return window.securityCheckPassword;
    try{if(typeof securityCheckPassword==='function')return securityCheckPassword}catch(e){}
    return null;
  }

  function authorizeEdit(){
    const senha=prompt('Digite a senha do Professor Control para editar esta advertência:');
    if(senha===null)return false;
    const check=passwordChecker();
    if(!check){
      alert('A verificação de senha não está disponível. A edição foi bloqueada por segurança.');
      return false;
    }
    if(!check(senha)){
      alert('Senha incorreta. A advertência não foi liberada para edição.');
      return false;
    }
    return true;
  }

  function ensureCancelButton(){
    const row=document.querySelector('.adv-actions');
    if(!row)return null;
    let btn=document.getElementById('advCancelarEdicao');
    if(!btn){
      btn=document.createElement('button');
      btn.id='advCancelarEdicao';
      btn.type='button';
      btn.className='primary ghost hidden';
      btn.textContent='Cancelar edição';
      btn.onclick=cancelEdit;
      row.appendChild(btn);
    }
    return btn;
  }

  function ensureHistoricalStudent(select,id){
    if(!select||!id)return;
    if([...select.options].some(o=>o.value===id))return;
    const aluno=(db().alunos||[]).find(a=>a.id===id);
    if(!aluno)return;
    const op=document.createElement('option');
    op.value=id;
    op.textContent=(aluno.numero?aluno.numero+' - ':'')+aluno.nome+' (histórico)';
    select.appendChild(op);
  }

  function setTypeUi(tipo){
    const el=document.getElementById('advTipo');
    if(!el)return;
    el.value=tipo||'oral';
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function startEdit(id){
    const r=(db()?.advertencias||[]).find(x=>x.id===id);
    if(!r)return;
    if(!authorizeEdit())return;

    editingId=id;

    const escola=document.getElementById('advEscola');
    const turma=document.getElementById('advTurma');
    const aluno=document.getElementById('advAluno');

    if(escola){
      escola.value=r.escolaId||'';
      escola.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(turma){
      turma.value=r.turmaId||'';
      turma.dispatchEvent(new Event('change',{bubbles:true}));
    }
    ensureHistoricalStudent(aluno,r.alunoId);
    if(aluno)aluno.value=r.alunoId||'';

    const data=document.getElementById('advData');if(data)data.value=r.data||'';
    const hora=document.getElementById('advHora');if(hora)hora.value=r.hora||'';
    setTypeUi(r.tipo||'oral');

    const motivos=new Set(r.motivos||[]);
    document.querySelectorAll('#advMotivos input[type="checkbox"]').forEach(ch=>ch.checked=motivos.has(ch.value));

    const comp=document.getElementById('advComplemento');if(comp)comp.value=r.complemento||'';
    const prof=document.getElementById('advProfessor');if(prof)prof.value=r.professor||'';
    const rec=document.getElementById('advRecusou');if(rec)rec.value=r.recusouAssinar?'sim':'nao';

    const salvar=document.getElementById('advSalvar');
    if(salvar)salvar.textContent='Salvar alterações';
    const salvarPdf=document.getElementById('advSalvarPdf');
    if(salvarPdf)salvarPdf.textContent='Salvar alterações e gerar PDF';
    ensureCancelButton()?.classList.remove('hidden');

    const panel=document.querySelector('#view-advertencias .adv-panel');
    panel?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function resetEditUi(){
    editingId=null;
    const salvar=document.getElementById('advSalvar');
    if(salvar)salvar.textContent='Salvar advertência';
    const salvarPdf=document.getElementById('advSalvarPdf');
    if(salvarPdf)salvarPdf.textContent='Salvar e gerar PDF';
    ensureCancelButton()?.classList.add('hidden');
  }

  function clearEditForm(){
    document.querySelectorAll('#advMotivos input[type="checkbox"]').forEach(ch=>ch.checked=false);
    const comp=document.getElementById('advComplemento');if(comp)comp.value='';
    const rec=document.getElementById('advRecusou');if(rec)rec.value='nao';
  }

  function cancelEdit(){
    resetEditUi();
    clearEditForm();
  }

  function collectUpdate(old){
    const alunoId=document.getElementById('advAluno')?.value;
    const turmaId=document.getElementById('advTurma')?.value;
    const escolaId=document.getElementById('advEscola')?.value;
    const motivos=[...document.querySelectorAll('#advMotivos input:checked')].map(x=>x.value);
    if(!alunoId){alert('Selecione um aluno.');return null}
    if(!motivos.length){alert('Marque pelo menos um motivo da advertência.');return null}
    const tipo=document.getElementById('advTipo')?.value||'oral';
    return {
      ...old,
      escolaId,
      turmaId,
      alunoId,
      data:document.getElementById('advData')?.value||old.data,
      hora:document.getElementById('advHora')?.value||'',
      tipo,
      motivos,
      complemento:(document.getElementById('advComplemento')?.value||'').trim(),
      professor:(document.getElementById('advProfessor')?.value||'').trim(),
      recusouAssinar:tipo==='escrita'&&document.getElementById('advRecusou')?.value==='sim',
      atualizadoEm:new Date().toISOString()
    };
  }

  function refreshHistory(){
    const nav=document.querySelector('.nav-item[data-view="advertencias"]');
    if(nav){nav.click();return}
    location.reload();
  }

  function saveEdit(makePdf=false){
    if(!editingId)return false;
    db().advertencias=db().advertencias||[];
    const idx=db().advertencias.findIndex(x=>x.id===editingId);
    if(idx<0){alert('Advertência não encontrada.');resetEditUi();return true}
    const old=db().advertencias[idx];
    const updated=collectUpdate(old);
    if(!updated)return true;

    db().advertencias[idx]=updated;
    persist();
    const id=editingId;
    resetEditUi();
    clearEditForm();
    refreshHistory();

    if(makePdf&&updated.tipo==='escrita'&&typeof window.gerarAdvertenciaPDF==='function'){
      setTimeout(()=>window.gerarAdvertenciaPDF(id),250);
    }else{
      alert('Advertência atualizada com sucesso.');
    }
    return true;
  }

  function injectEditButtons(){
    document.querySelectorAll('#advHistorico .adv-row-actions').forEach(actions=>{
      if(actions.querySelector('.adv-mini.edit'))return;
      const del=[...actions.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('excluirAdvertencia'));
      if(!del)return;
      const raw=del.getAttribute('onclick')||'';
      const m=raw.match(/excluirAdvertencia\(['"]([^'"]+)['"]\)/);
      if(!m)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='adv-mini edit';
      btn.textContent='Editar';
      btn.onclick=()=>startEdit(m[1]);
      actions.insertBefore(btn,actions.firstChild);
    });
  }

  function addStyle(){
    if(document.getElementById('advEditStyle'))return;
    const style=document.createElement('style');
    style.id='advEditStyle';
    style.textContent='.adv-mini.edit{background:#0f6bdc;color:#fff;border-color:#0f6bdc}.adv-mini.edit:hover{filter:brightness(.96)}';
    document.head.appendChild(style);
  }

  function init(){
    addStyle();
    ensureCancelButton();
    injectEditButtons();

    document.addEventListener('click',e=>{
      if(!editingId)return;
      const t=e.target;
      if(t?.id==='advSalvar'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        saveEdit(false);
      }else if(t?.id==='advSalvarPdf'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        saveEdit(true);
      }
    },true);

    const obs=new MutationObserver(()=>injectEditButtons());
    obs.observe(document.body,{childList:true,subtree:true});

    window.editarAdvertencia=startEdit;
    window.cancelarEdicaoAdvertencia=cancelEdit;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
