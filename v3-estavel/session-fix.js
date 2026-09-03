(()=>{
  const SESSION_KEY='professor_control_authenticated_session';

  // Impede o gesto "puxar para atualizar" no Android/PWA.
  const style=document.createElement('style');
  style.textContent='html,body{overscroll-behavior-y:none!important;} body{overscroll-behavior:none!important;}';
  document.head.appendChild(style);

  let startY=0;
  document.addEventListener('touchstart',e=>{
    if(e.touches&&e.touches.length===1) startY=e.touches[0].clientY;
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!e.touches||e.touches.length!==1)return;
    const dy=e.touches[0].clientY-startY;
    if(window.scrollY<=0&&dy>8)e.preventDefault();
  },{passive:false});

  document.addEventListener('DOMContentLoaded',()=>{
    const lock=document.getElementById('authLock');
    const btn=document.getElementById('authBtn');
    const pass=document.getElementById('authPass');
    const pass2=document.getElementById('authPass2');

    // Se o usuário já entrou nesta sessão, uma atualização acidental não volta para a senha.
    if(lock&&sessionStorage.getItem(SESSION_KEY)==='1'){
      lock.classList.add('hidden');
    }

    const rememberIfUnlocked=()=>setTimeout(()=>{
      if(lock&&lock.classList.contains('hidden')){
        sessionStorage.setItem(SESSION_KEY,'1');
      }
    },80);

    btn?.addEventListener('click',rememberIfUnlocked);
    pass?.addEventListener('keydown',e=>{if(e.key==='Enter')rememberIfUnlocked()});
    pass2?.addEventListener('keydown',e=>{if(e.key==='Enter')rememberIfUnlocked()});
  });
})();