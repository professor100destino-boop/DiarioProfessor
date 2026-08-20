(()=>{
  const $=s=>document.querySelector(s);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function ensureJsPDF(){
    if(window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    let script=[...document.scripts].find(s=>String(s.src||'').includes('jspdf'));
    if(!script){
      script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      document.head.appendChild(script);
    }
    for(let i=0;i<40;i++){
      if(window.jspdf?.jsPDF) return window.jspdf.jsPDF;
      await sleep(150);
    }
    throw new Error('Não foi possível carregar o gerador de PDF. Conecte à internet uma vez e tente novamente.');
  }

  function contexto(){
    const turmaId=$('#freqTurma')?.value||'';
    const data=$('#freqData')?.value||new Date().toISOString().slice(0,10);
    const aulaDia=String($('#freqAulaDia')?.value||'1');
    return {turmaId,data,aulaDia};
  }

  function getFaltosos(turmaId,data,aulaDia){
    return (db.alunos||[])
      .filter(a=>a.turmaId===turmaId&&a.ativo!==false)
      .filter(a=>{
        const f=(db.frequencias||[]).find(x=>x.alunoId===a.id&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia);
        const s=String(f?.status||'Presente').toLowerCase();
        return s==='falta'||s==='f'||s==='faltou';
      })
      .sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  }

  async function buildPdf(){
    const {turmaId,data,aulaDia}=contexto();
    if(!turmaId) throw new Error('Selecione a turma.');
    const t=(db.turmas||[]).find(x=>x.id===turmaId);
    const e=(db.escolas||[]).find(x=>x.id===t?.escolaId);
    const faltosos=getFaltosos(turmaId,data,aulaDia);
    if(!faltosos.length) throw new Error('Não há alunos marcados com falta nesta chamada.');

    const JsPDF=await ensureJsPDF();
    const doc=new JsPDF({unit:'mm',format:'a4'});
    const m=16;
    let y=18;
    const [ano,mes,dia]=data.split('-');
    const turmaTexto=typeof turmaNomeCompleto==='function'?turmaNomeCompleto(t):(t?.nome||t?.turma||'Turma');

    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE ALUNOS FALTOSOS',m,y);
    y+=10;
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    doc.text(`Escola: ${e?.nome||''}`,m,y); y+=6;
    doc.text(`Turma: ${turmaTexto||''}`,m,y); y+=6;
    doc.text(`Data: ${dia}/${mes}/${ano}`,m,y); y+=6;
    doc.text(`Aula do dia: ${aulaDia}ª aula`,m,y); y+=6;
    doc.text(`Quantidade de faltosos: ${faltosos.length}`,m,y); y+=10;

    doc.setFont('helvetica','bold');
    doc.text('Nº',m,y);
    doc.text('ALUNO',m+14,y);
    y+=6;
    doc.setFont('helvetica','normal');

    faltosos.forEach((a,i)=>{
      const linhas=doc.splitTextToSize(String(a.nome||''),155);
      const altura=Math.max(7,linhas.length*5);
      if(y+altura>280){doc.addPage();y=18;doc.setFont('helvetica','bold');doc.text('Nº',m,y);doc.text('ALUNO',m+14,y);y+=6;doc.setFont('helvetica','normal');}
      doc.text(String(a.numero||i+1),m,y);
      doc.text(linhas,m+14,y);
      y+=altura;
    });

    const base=(t?.turma||t?.nome||'turma').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_');
    const filename=`faltosos_${base}_${data}_${aulaDia}a_aula.pdf`;
    return {doc,filename,faltosos,turmaTexto,data,aulaDia};
  }

  async function baixarBlob(blob,filename){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  }

  window.gerarRelatorioFaltososPDF=async()=>{
    const btn=document.querySelector('.btn-pdf');
    const old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Gerando PDF...';}
      const {doc,filename}=await buildPdf();
      const blob=doc.output('blob');
      await baixarBlob(blob,filename);
      if(typeof toast==='function') toast('PDF dos faltosos gerado. Verifique a pasta Downloads.');
      else alert('PDF gerado. Verifique a pasta Downloads.');
    }catch(err){
      console.error('Erro ao gerar PDF dos faltosos:',err);
      alert(err?.message||'Não foi possível gerar o PDF dos faltosos.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||'Gerar PDF dos faltosos';}
    }
  };
})();