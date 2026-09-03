(()=>{
  if(!window.db)return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

  window.renderNotas=function(){
    const tid=$('#notasTurma')?.value;
    const bim=$('#notasBimestre')?.value;
    const alunos=db.alunos.filter(a=>a.turmaId===tid && a.ativo!==false);
    const provas=avaliacoesTurma(tid,bim).filter(a=>a.tipo==='prova');
    const table=$('#notasTable');
    if(!table)return;
    if(!alunos.length){
      table.innerHTML='<p class=muted>Nenhum aluno ativo nesta turma.</p>';
      return;
    }
    const heads=['<th>Média Atividades<br><small>vale 1 nota</small></th>',...provas.map(a=>`<th>${esc(a.nome)}<br><small>Prova • ${a.valor}</small></th>`),'<th>Média Final</th>'].join('');
    table.innerHTML=`<table><thead><tr><th>Aluno</th>${heads}</tr></thead><tbody>${alunos.map(a=>{
      const n=db.notas[a.id]||{};
      const c=calcAluno(a.id,tid,bim);
      return `<tr><td><b>${esc(a.nome)}</b></td><td><b>${c.atividadeMedia===null?'—':c.atividadeMedia.toFixed(1)}</b></td>${provas.map(v=>`<td><input type=number min=0 max="${v.valor}" step=.1 data-prova-aluno="${a.id}" data-prova-av="${v.id}" value="${n[v.id]??''}"></td>`).join('')}<td><span class="badge ${c.media===null?'warn':c.media>=Number(db.config.mediaMin||6)?'ok':'bad'}">${c.media===null?'—':c.media.toFixed(1)}</span></td></tr>`;
    }).join('')}</tbody></table>`;
    $$('[data-prova-aluno]').forEach(i=>i.onchange=()=>{
      db.notas[i.dataset.provaAluno]??={};
      db.notas[i.dataset.provaAluno][i.dataset.provaAv]=i.value;
      localStorage.setItem(KEY,JSON.stringify(db));
      renderNotas();
      if(typeof renderDashboard==='function')renderDashboard();
    });
  };

  const turma=$('#notasTurma'),bim=$('#notasBimestre');
  if(turma)turma.onchange=renderNotas;
  if(bim)bim.onchange=renderNotas;
  setTimeout(renderNotas,0);
})();