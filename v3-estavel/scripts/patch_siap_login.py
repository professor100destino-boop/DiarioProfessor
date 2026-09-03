from pathlib import Path

p = Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s = p.read_text(encoding='utf-8')

# PATCH ISOLADO DO LOGIN SIAP.
# Não altera backup, Professor Control, PDFs, navegação ou demais módulos.

s = s.replace(
    '    private boolean loginSubmitted=false;\n    private boolean captchaAfterFailure=false;\n',
    '    private boolean loginSubmitted=false;\n    private boolean loginCheckPending=false;\n    private int loginVerifyCount=0;\n    private boolean captchaAfterFailure=false;\n'
)

old = '''                if(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?")){
                    boolean failed=loginSubmitted;
                    loginSubmitted=false;
                    captchaAfterFailure=failed;
                    if(failed)loginAttempts++;
                    showShell("captcha");
                    injectLoginAndReadCaptcha();
                    return;
                }
'''
new = '''                if(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?")){
                    // O SIAP pode permanecer alguns segundos em login.aspx enquanto conclui o postback.
                    // Não tratar onPageFinished de login.aspx como falha imediata.
                    if(loginSubmitted){
                        if(!loginCheckPending){
                            loginCheckPending=true;
                            loginVerifyCount=0;
                            siapWeb.postDelayed(()->verifyLoginAfterSubmit(),1200);
                        }
                        return;
                    }
                    loginCheckPending=false;
                    loginVerifyCount=0;
                    showShell("captcha");
                    injectLoginAndReadCaptcha();
                    return;
                }
                // Navegou para fora do login após o envio: entrada confirmada.
                if(loginSubmitted){
                    loginSubmitted=false;
                    loginCheckPending=false;
                    loginVerifyCount=0;
                    captchaAfterFailure=false;
                    loginAttempts=0;
                    showShell("menu");
                    return;
                }
'''
if old not in s:
    raise SystemExit('Bloco onPageFinished do login não encontrado')
s = s.replace(old, new, 1)

anchor = '''    private void menuActionInternal(String action){
'''
method = '''    private void verifyLoginAfterSubmit(){
        if(!loginSubmitted){loginCheckPending=false;loginVerifyCount=0;return;}
        String url=siapWeb.getUrl();
        String low=url==null?"":url.toLowerCase();
        if(!(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?"))){
            loginSubmitted=false; loginCheckPending=false; loginVerifyCount=0;
            captchaAfterFailure=false; loginAttempts=0;
            showShell("menu");
            return;
        }

        // Além da URL, verifica o DOM. Alguns retornos do SIAP mantêm login.aspx por alguns instantes.
        String js="(function(){try{"+
            "var vis=function(e){return e&&e.offsetParent!==null&&!e.disabled};"+
            "var success=!!document.querySelector('a[href*=\\\"DiarioEscolar\\\"],a[href*=\\\"MenuSistema\\\"],a[href*=\\\"AcompanhamentoPlanejamento\\\"],a[href*=\\\"DefinirEscola\\\"]');"+
            "if(success)return 'success';"+
            "var ins=[].slice.call(document.querySelectorAll('input')).filter(vis);"+
            "var p=ins.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "if(!p)return 'wait';"+
            "return 'login';"+
            "}catch(e){return 'wait';}})();";

        siapWeb.evaluateJavascript(js,value->runOnUiThread(()->{
            String v=value==null?"":value.replace("\\\"","").trim();
            if("success".equalsIgnoreCase(v)){
                loginSubmitted=false; loginCheckPending=false; loginVerifyCount=0;
                captchaAfterFailure=false; loginAttempts=0;
                showShell("menu");
                return;
            }

            loginVerifyCount++;
            // Aguarda até aproximadamente 16 segundos. Durante esse período não mostra erro.
            if(loginVerifyCount<15){
                siapWeb.postDelayed(()->verifyLoginAfterSubmit(),1000);
                return;
            }

            // Só após várias verificações com o formulário ainda presente considera a tentativa rejeitada.
            loginSubmitted=false;
            loginCheckPending=false;
            loginVerifyCount=0;
            captchaAfterFailure=true;
            loginAttempts++;
            showShell("captcha");
            injectLoginAndReadCaptcha();
        }));
    }

'''
if anchor not in s:
    raise SystemExit('Âncora menuActionInternal não encontrada')
s = s.replace(anchor, method + anchor, 1)

old_submit = '''            "var bs=[].slice.call(document.querySelectorAll('input[type=submit],input[type=button],button')).filter(vis);var b=bs.find(function(x){return /entrar/i.test((x.value||x.innerText||''));})||bs[0];if(b)b.click();"+
'''
new_submit = '''            "var bs=[].slice.call(document.querySelectorAll('input[type=submit],input[type=button],input[type=image],button')).filter(vis);var b=bs.find(function(x){return /entrar|acessar|login/i.test((x.value||x.innerText||x.getAttribute('alt')||''));})||bs[0];if(b)b.click();else if(c&&c.form){if(c.form.requestSubmit)c.form.requestSubmit();else c.form.submit();}"+
'''
if old_submit not in s:
    raise SystemExit('Bloco de envio do captcha não encontrado')
s = s.replace(old_submit, new_submit, 1)

# Reinicia o verificador ao começar/atualizar/cancelar uma tentativa.
s = s.replace(
    '        loginAttempts=0; loginSubmitted=false; captchaAfterFailure=false; showShell("captcha"); siapWeb.loadUrl(LOGIN_URL);',
    '        loginAttempts=0; loginSubmitted=false; loginCheckPending=false; loginVerifyCount=0; captchaAfterFailure=false; showShell("captcha"); siapWeb.loadUrl(LOGIN_URL);'
)
s = s.replace(
    '@JavascriptInterface public void refreshCaptcha(){runOnUiThread(()->{loginSubmitted=false;siapWeb.reload();});}',
    '@JavascriptInterface public void refreshCaptcha(){runOnUiThread(()->{loginSubmitted=false;loginCheckPending=false;loginVerifyCount=0;siapWeb.reload();});}'
)
s = s.replace(
    '@JavascriptInterface public void cancelLogin(){runOnUiThread(()->{loginSubmitted=false;siapWeb.stopLoading();});}',
    '@JavascriptInterface public void cancelLogin(){runOnUiThread(()->{loginSubmitted=false;loginCheckPending=false;loginVerifyCount=0;siapWeb.stopLoading();});}'
)

p.write_text(s, encoding='utf-8')
print('SIAP login patch isolado v2 aplicado com sucesso')
