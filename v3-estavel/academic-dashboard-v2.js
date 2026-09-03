(()=>{
'use strict';
if(!window.db||!window.professorControlBaseIdAluno)return;
const $=s=>document.querySelector(s),baseId=a=>window.professorControlBaseIdAluno(a);
const eh=v=>typeof esc==='function'?esc(v):String(v??'');
function patch(){
 const cards=$('#dashboardCards');if(cards){const today=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10),faltas=(db.frequencias||[]).filter(f=>f.data===today&&String(f.status||'').toLowerCase().startsWith('f')).length,ativ=(db.avaliacoes||[]).filter(a=>a.tipo==='atividade').length;cards.innerHTML=`<div class=stat><span>Escolas</span><strong>${db.escolas.length}</strong></div><div class=stat><span>Turmas</span><strong>${db.turmasBase.filter(t=>t.ativo!==false).length}</strong></div><div class=stat><span>Alunos</span><strong>${db.alunos.length}</strong></div><div class=stat><span>Faltas hoje</span><strong>${faltas}</strong></div><div class=stat><span>Atividades</span><strong>${ativ}</strong></div>`}
 const box=$('#dashTurmas');if(box){const arr=db.turmasBase.filter(t=>t.ativo!==false).slice(0,8);box.innerHTML=arr.length?arr.map(t=>{const e=db.escolas.find(x=>x.id===t.escolaId),n=db.alunos.filter(a=>baseId(a)===t.id&&a.ativo!==false).length,ds=db.turmas.filter(v=>v.turmaBaseId===t.id&&v.ativo!==false).map(v=>v.disciplina).filter(Boolean);return `<div class="list-row"><span><b>${eh(e?.nome||'')} • ${eh(`${t.serie||''} ${t.turma||''}`)}</b><br><small class="muted">${n} alunos${ds.length?' • '+eh([...new Set(ds)].join(', ')):''}</small></span></div>`}).join(''):'<span class=muted>Nenhuma turma cadastrada.</span>'}
}
function init(){patch();if(typeof renderDashboard==='function'&&!window.__academicDashWrap){window.__academicDashWrap=true;const old=renderDashboard;window.renderDashboard=renderDashboard=function(){old();patch()}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();