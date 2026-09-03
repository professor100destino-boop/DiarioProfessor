(()=>{
  const $=s=>document.querySelector(s);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let pdfObjectUrl=null;

  function removerAvisoOffline(){
    const limpar=()=>{
      [...document.querySelectorAll('body *')].forEach(el=>{
        const t=(el.textContent||'').trim().toLowerCase();
        if((t==='✓ pronto para uso offline'||t==='pronto para uso offline'||t.includes('pronto para uso offline')) && el.children.length<=2){
          el.style.display='none';
        }
      });
    };
    limpar();
    const obs=new MutationObserver(limpar);
    obs.observe(document.body,{childList:true,subtree:true});
  }

  async function ensureJsPDF(){
    if(window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    let script=[...document.scripts].find(s=>String(s.src||'').includes('jspdf'));
    if(!script){
      script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      document.head.appendChild(script);
    }
    for(let i=0;i<50;i++){
      if(window.jspdf?.jsPDF) return window.jspdf.jsPDF;
      await sleep(120);
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
      if(y+altura>280){
        doc.addPage();
        y=18;
        doc.setFont('helvetica','bold');
        doc.text('Nº',m,y);
        doc.text('ALUNO',m+14,y);
        y+=6;
        doc.setFont('helvetica','normal');
      }
      doc.text(String(a.numero||i+1),m,y);
      doc.text(linhas,m+14,y);
      y+=altura;
    });

    const base=(t?.turma||t?.nome||'turma').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_');
    const filename=`faltosos_${base}_${data}_${aulaDia}a_aula.pdf`;
    const blob=doc.output('blob');
    const file=new File([blob],filename,{type:'application/pdf'});
    return {blob,file,filename,turmaTexto,data,aulaDia};
  }

  function fecharModalPdf(){
    document.getElementById('pdfActionsOverlay')?.remove();
  }

  function hasNativePdfBridge(){
    try{
      return !!(window.Android && typeof window.Android.savePdfBase64==='function');
    }catch(e){
      return false;
    }
  }

  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const data=String(reader.result||'');
        const p=data.indexOf(',');
        resolve(p>=0?data.slice(p+1):data);
      };
      reader.onerror=()=>reject(reader.error||new Error('Não foi possível preparar o PDF.'));
      reader.readAsDataURL(blob);
    });
  }

  async function enviarPdfAoAndroid(blob,filename,share){
    const base64=await blobToBase64(blob);
    window.Android.savePdfBase64(base64,filename,!!share);
  }

  function baixarNoNavegador(blob,filename){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      a.remove();
      URL.revokeObjectURL(url);
    },3000);
  }

  function mostrarAcoesPdf({blob,file,filename,turmaTexto,data,aulaDia}){
    fecharModalPdf();
    if(pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    pdfObjectUrl=URL.createObjectURL(blob);

    const overlay=document.createElement('div');
    overlay.id='pdfActionsOverlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(3,15,35,.58);z-index:999999;display:grid;place-items:center;padding:20px';
    overlay.innerHTML=`
      <div style="width:min(520px,100%);background:#fff;border-radius:22px;padding:24px;box-shadow:0 20px 60px #0005;color:#14213d">
        <h3 style="margin:0 0 8px;font-size:25px">PDF dos faltosos pronto</h3>
        <p style="margin:0 0 18px;color:#64748b;line-height:1.45">Escolha o que deseja fazer com o relatório.</p>
        <button id="pdfSalvarBtn" style="display:block;width:100%;border:0;background:#2563eb;color:white;padding:16px;border-radius:14px;font-weight:900;font-size:18px;margin:10px 0">💾 Salvar PDF</button>
        <button id="pdfCompartilharBtn" style="display:block;width:100%;border:0;background:#16a34a;color:white;padding:16px;border-radius:14px;font-weight:900;font-size:18px;margin:10px 0">📲 Compartilhar / WhatsApp</button>
        <button id="pdfFecharBtn" style="display:block;width:100%;border:0;background:#e8eef7;color:#17345f;padding:14px;border-radius:14px;font-weight:800;font-size:17px;margin-top:10px">Fechar</button>
        <div id="pdfShareMsg" style="display:none;margin-top:12px;padding:12px;border-radius:12px;background:#fff7d6;color:#7a5600;line-height:1.4"></div>
      </div>`;
    document.body.appendChild(overlay);

    $('#pdfFecharBtn').onclick=fecharModalPdf;
    overlay.addEventListener('click',e=>{if(e.target===overlay)fecharModalPdf()});

    $('#pdfSalvarBtn').onclick=async()=>{
      const btn=$('#pdfSalvarBtn');
      const msg=$('#pdfShareMsg');
      const old=btn.textContent;
      try{
        btn.disabled=true;
        btn.textContent='Salvando PDF...';
        if(hasNativePdfBridge()){
          await enviarPdfAoAndroid(blob,filename,false);
          msg.style.display='block';
          msg.textContent='PDF enviado para a pasta Downloads/DocenciaFacil.';
        }else{
          baixarNoNavegador(blob,filename);
          if(window.Android){
            msg.style.display='block';
            msg.innerHTML='Esta versão instalada ainda não possui o salvamento nativo de PDF. Atualize o APK do Docência Fácil.';
          }
        }
      }catch(err){
        console.error('Erro ao salvar PDF:',err);
        msg.style.display='block';
        msg.textContent='Não foi possível salvar o PDF. Atualize o aplicativo e tente novamente.';
      }finally{
        btn.disabled=false;
        btn.textContent=old;
      }
    };

    $('#pdfCompartilharBtn').onclick=async()=>{
      const shareBtn=$('#pdfCompartilharBtn');
      const msg=$('#pdfShareMsg');
      try{
        shareBtn.disabled=true;
        shareBtn.textContent='Abrindo compartilhamento...';

        if(hasNativePdfBridge()){
          await enviarPdfAoAndroid(blob,filename,true);
          msg.style.display='none';
          return;
        }

        if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
          await navigator.share({
            title:'Relatório de alunos faltosos',
            text:`${turmaTexto} - ${data.split('-').reverse().join('/')} - ${aulaDia}ª aula`,
            files:[file]
          });
        }else{
          msg.style.display='block';
          msg.innerHTML=window.Android
            ?'Esta versão instalada ainda não possui compartilhamento nativo de PDF. Atualize o APK do Docência Fácil.'
            :'Este navegador não permite enviar o PDF diretamente. Toque em <b>Salvar PDF</b> e depois envie o arquivo pelo WhatsApp.';
        }
      }catch(err){
        if(err?.name!=='AbortError'){
          console.error('Erro ao compartilhar PDF:',err);
          msg.style.display='block';
          msg.innerHTML='Não foi possível abrir o compartilhamento. Atualize o aplicativo e tente novamente.';
        }
      }finally{
        shareBtn.disabled=false;
        shareBtn.textContent='📲 Compartilhar / WhatsApp';
      }
    };
  }

  window.gerarRelatorioFaltososPDF=async()=>{
    const btn=document.querySelector('.btn-pdf');
    const old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Gerando PDF...';}
      const pdf=await buildPdf();
      mostrarAcoesPdf(pdf);
    }catch(err){
      console.error('Erro ao gerar PDF dos faltosos:',err);
      alert(err?.message||'Não foi possível gerar o PDF dos faltosos.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||'Gerar PDF dos faltosos';}
    }
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removerAvisoOffline);
  else removerAvisoOffline();
})();