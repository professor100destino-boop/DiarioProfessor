(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  if(!window.db)return;

  let atividadeBusca='';
  let atividadeOrdem='alfabetica';

  const normalizar=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  const style=document.createElement('style');
  style.id='activitiesQuickMarkStyle';
  style.textContent=`
    .ativ-mark-wrap{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;min-width:220px}
    .ativ-mark-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:12px;padding:9px 12px;font-weight:900;cursor:pointer;white-space:nowrap}
    .ativ-mark-btn.fez.active{background:#16a34a;color:#fff;border-color:#16a34a}
    .ativ-mark-btn.meio.active{background:#f59e0b;color:#fff;border-color:#f59e0b}
    .ativ-mark-btn:active{transform:scale(.98)}
    .ativ-mark-zero{font-size:12px;color:#64748b;margin-top:5px;text-align:center}
    .ativ-tools{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:12px 0 16px;padding:12px;border:1px solid #dbe5f1;border-radius:14px;background:#f8fbff}
    .ativ-tools-field{display:flex;flex-direction:column;gap:5px;flex:1 1 230px}
    .ativ-tools-field.ordem{flex:0 1 220px}
    .ativ-tools label{font-size:12px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.02em}
    .ativ-tools input,.ativ-tools select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;padding:11px 12px;font-size:15px;outline:none}
    .ativ-tools input:focus,.ativ-tools select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
    .ativ-numero{display:inline-block;min-width:34px;margin-right:7px;color:#64748b;font-size:12px;font-weight:900}
    .ativ-sem-resultado{padding:18px;text-align:center;color:#64748b;font-weight:700}
    @media(max-width:700px){
      .ativ-mark-wrap{min-width:180px}.ativ-mark-btn{flex:1 1 100%}
      .ativ-tools{align-items:stretch}.ativ-tools-field,.ativ-tools-field.ordem{flex:1 1 100%}
    }
  `;
  if(!document.getElementById(style.id))document.head.appendChild(style);

  function garantirFerramentas(){
    const table=$('#atividadesTable');
    if(!table||document.getElementById('atividadesFerramentas'))return;
    const wrap=document.createElement('div');
    wrap.id='atividadesFerramentas';
    wrap.className='ativ-tools';
    wrap.innerHTML=`
      <div class="ativ-tools-field">
        <label for="atividadesBuscaAluno">Buscar aluno</label>
        <input id="atividadesBuscaAluno" type="search" inputmode="search" autocomplete="off" placeholder="Digite o nome ou nº do aluno">
      </div>
      <div class="ativ-tools-field ordem">
        <label for="atividadesOrdemAluno">Exibir por</label>
        <select id="atividadesOrdemAluno">
          <option value="alfabetica">Ordem alfabética (A–Z)</option>
          <option value="numero">Número do aluno</option>
        </select>
      </div>`;
    table.parentNode.insertBefore(wrap,table);

    const busca=$('#atividadesBuscaAluno');
    const ordem=$('#atividadesOrdemAluno');
    busca.value=atividadeBusca;
    ordem.value=atividadeOrdem;
    busca.addEventListener('input',()=>{
      atividadeBusca=busca.value;
      renderAtividades();
    });
    ordem.addEventListener('change',()=>{
      atividadeOrdem=ordem.value;
      renderAtividades();
    });
  }

  function setAtividadeRapida(alunoId,avId,valor){
    db.notas[alunoId]??={};
    const atual=Number(db.notas[alunoId][avId]??0);
    db.notas[alunoId][avId]=(atual===valor?0:valor);
    localStorage.setItem(KEY,JSON.stringify(db));
    renderAtividades();
    if(typeof renderNotas==='function')renderNotas();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  window.setAtividadeRapida=setAtividadeRapida;

  window.renderAtividades=function(){
    garantirFerramentas();
    const tid=$('#atividadesTurma')?.value;
    const bim=$('#atividadesBimestre')?.value;
    const todosAlunos=db.alunos.filter(a=>a.turmaId===tid && a.ativo!==false).map((a,i)=>({...a,__numero:i+1}));
    const termo=normalizar(atividadeBusca);
    let alunos=todosAlunos.filter(a=>{
      if(!termo)return true;
      if(/^\d+$/.test(termo))return String(a.__numero)===termo;
      return normalizar(a.nome).includes(termo);
    });
    if(atividadeOrdem==='alfabetica'){
      alunos.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base',numeric:true}));
    }else{
      alunos.sort((a,b)=>a.__numero-b.__numero);
    }

    const ativ=avaliacoesTurma(tid,bim).filter(a=>a.tipo==='atividade');
    const table=$('#atividadesTable'); if(!table)return;
    if(!todosAlunos.length){table.innerHTML='<p class=muted>Nenhum aluno ativo nesta turma.</p>';return}
    if(!ativ.length){table.innerHTML='<p class=muted>Nenhuma atividade cadastrada. Clique em + Nova atividade.</p>';return}
    const heads=ativ.map(a=>`<th>${esc(a.nome)}<br><small>Fez = 10,0 • Mais ou menos = 6,0</small></th>`).join('');
    const corpo=alunos.length?alunos.map(a=>{
      const n=db.notas[a.id]||{};
      const c=calcAluno(a.id,tid,bim);
      return `<tr><td><span class="ativ-numero">Nº ${a.__numero}</span><b>${esc(a.nome)}</b></td>${ativ.map(v=>{
        const nota=Number(n[v.id]??0);
        return `<td><div class="ativ-mark-wrap">
          <button type="button" class="ativ-mark-btn fez ${nota===10?'active':''}" onclick="setAtividadeRapida('${a.id}','${v.id}',10)">✓ Fez</button>
          <button type="button" class="ativ-mark-btn meio ${nota===6?'active':''}" onclick="setAtividadeRapida('${a.id}','${v.id}',6)">◐ Mais ou menos</button>
        </div><div class="ativ-mark-zero">Sem marcar = 0,0</div></td>`;
      }).join('')}<td><b>${c.atividadeMedia===null?'—':c.atividadeMedia.toFixed(1)}</b></td></tr>`;
    }).join(''):`<tr><td colspan="${ativ.length+2}" class="ativ-sem-resultado">Nenhum aluno encontrado para “${esc(atividadeBusca)}”.</td></tr>`;
    table.innerHTML=`<table><thead><tr><th>Aluno</th>${heads}<th>Média das Atividades</th></tr></thead><tbody>${corpo}</tbody></table>`;

    const busca=$('#atividadesBuscaAluno');
    const ordem=$('#atividadesOrdemAluno');
    if(busca&&busca.value!==atividadeBusca)busca.value=atividadeBusca;
    if(ordem&&ordem.value!==atividadeOrdem)ordem.value=atividadeOrdem;
  };

  const turma=$('#atividadesTurma'),bim=$('#atividadesBimestre');
  if(turma)turma.onchange=renderAtividades;
  if(bim)bim.onchange=renderAtividades;
  renderAtividades();
})();