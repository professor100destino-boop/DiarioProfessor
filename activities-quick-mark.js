(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  if(!window.db)return;

  const style=document.createElement('style');
  style.id='activitiesQuickMarkStyle';
  style.textContent=`
    .ativ-mark-wrap{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;min-width:220px}
    .ativ-mark-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:12px;padding:9px 12px;font-weight:900;cursor:pointer;white-space:nowrap}
    .ativ-mark-btn.fez.active{background:#16a34a;color:#fff;border-color:#16a34a}
    .ativ-mark-btn.meio.active{background:#f59e0b;color:#fff;border-color:#f59e0b}
    .ativ-mark-btn:active{transform:scale(.98)}
    .ativ-mark-zero{font-size:12px;color:#64748b;margin-top:5px;text-align:center}
    @media(max-width:700px){.ativ-mark-wrap{min-width:180px}.ativ-mark-btn{flex:1 1 100%}}
  `;
  if(!document.getElementById(style.id))document.head.appendChild(style);

  function setAtividadeRapida(alunoId,avId,valor){
    db.notas[alunoId]??={};
    const atual=Number(db.notas[alunoId][avId]??0);
    // Tocar novamente no botão selecionado desmarca e volta para zero.
    db.notas[alunoId][avId]=(atual===valor?0:valor);
    localStorage.setItem(KEY,JSON.stringify(db));
    renderAtividades();
    if(typeof renderNotas==='function')renderNotas();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  window.setAtividadeRapida=setAtividadeRapida;

  window.renderAtividades=function(){
    const tid=$('#atividadesTurma')?.value;
    const bim=$('#atividadesBimestre')?.value;
    const alunos=db.alunos.filter(a=>a.turmaId===tid);
    const ativ=avaliacoesTurma(tid,bim).filter(a=>a.tipo==='atividade');
    const table=$('#atividadesTable'); if(!table)return;
    if(!alunos.length){table.innerHTML='<p class=muted>Nenhum aluno nesta turma.</p>';return}
    if(!ativ.length){table.innerHTML='<p class=muted>Nenhuma atividade cadastrada. Clique em + Nova atividade.</p>';return}
    const heads=ativ.map(a=>`<th>${esc(a.nome)}<br><small>Fez = 10,0 • Mais ou menos = 6,0</small></th>`).join('');
    table.innerHTML=`<table><thead><tr><th>Aluno</th>${heads}<th>Média das Atividades</th></tr></thead><tbody>${alunos.map(a=>{
      const n=db.notas[a.id]||{};
      const c=calcAluno(a.id,tid,bim);
      return `<tr><td><b>${esc(a.nome)}</b></td>${ativ.map(v=>{
        const nota=Number(n[v.id]??0);
        return `<td><div class="ativ-mark-wrap">
          <button type="button" class="ativ-mark-btn fez ${nota===10?'active':''}" onclick="setAtividadeRapida('${a.id}','${v.id}',10)">✓ Fez</button>
          <button type="button" class="ativ-mark-btn meio ${nota===6?'active':''}" onclick="setAtividadeRapida('${a.id}','${v.id}',6)">◐ Mais ou menos</button>
        </div><div class="ativ-mark-zero">Sem marcar = 0,0</div></td>`;
      }).join('')}<td><b>${c.atividadeMedia===null?'—':c.atividadeMedia.toFixed(1)}</b></td></tr>`;
    }).join('')}</tbody></table>`;
  };

  const turma=$('#atividadesTurma'),bim=$('#atividadesBimestre');
  if(turma)turma.onchange=renderAtividades;
  if(bim)bim.onchange=renderAtividades;
  renderAtividades();
})();