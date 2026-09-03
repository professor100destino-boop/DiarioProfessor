from pathlib import Path

p=Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s=p.read_text(encoding='utf-8')

# URL do controlador remoto do SIAP.
if 'SIAP_REMOTE_URL' not in s:
    s=s.replace('private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";',
                'private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";\n    private static final String SIAP_REMOTE_URL=PROFESSOR_URL+"siap-remoto.html";')

# Estado para impedir que a lógica antiga do login interfira no controlador remoto.
if 'remoteSiapMode' not in s:
    s=s.replace('private boolean returnToMenuAfterSchool=false;',
                'private boolean returnToMenuAfterSchool=false;\n    private boolean remoteSiapMode=false;')

# Ao abrir Professor Control sai do modo SIAP remoto.
s=s.replace(
'''    private void showProfessor(){
        siteTop.setVisibility(View.GONE); siapWeb.setVisibility(View.GONE); uiWeb.setVisibility(View.VISIBLE); shellTarget="auto"; uiWeb.loadUrl(PROFESSOR_URL);
    }
''',
'''    private void showProfessor(){
        remoteSiapMode=false;
        siteTop.setVisibility(View.GONE); siapWeb.setVisibility(View.GONE); uiWeb.setVisibility(View.VISIBLE); shellTarget="auto"; uiWeb.loadUrl(PROFESSOR_URL);
    }
''')

# Métodos genéricos: a inteligência fica no arquivo siap-remoto.html, não no APK.
anchor='''    private void showShell(String target){
'''
methods='''    private boolean allowedSiapUrl(String url){
        try{
            Uri u=Uri.parse(url==null?"":url);
            String h=u.getHost()==null?"":u.getHost().toLowerCase();
            return "https".equalsIgnoreCase(u.getScheme()) && h.endsWith("siap.educacao.go.gov.br");
        }catch(Exception e){return false;}
    }

    private void showRemoteSiap(String target){
        remoteSiapMode=true;
        siteTop.setVisibility(View.GONE);
        siapWeb.setVisibility(View.GONE);
        uiWeb.setVisibility(View.VISIBLE);
        String q=(target==null||target.isEmpty())?"":"?target="+Uri.encode(target);
        uiWeb.loadUrl(SIAP_REMOTE_URL+q+((q.isEmpty()?"?":"&")+"v="+System.currentTimeMillis()));
    }

    private void showRemoteSiapExisting(){
        remoteSiapMode=true;
        siteTop.setVisibility(View.GONE);
        siapWeb.setVisibility(View.GONE);
        uiWeb.setVisibility(View.VISIBLE);
        String u=uiWeb.getUrl();
        if(u==null||!u.startsWith(SIAP_REMOTE_URL))showRemoteSiap("");
    }

    private void notifyRemoteSiapPage(String url){
        if(!remoteSiapMode)return;
        String q=JSONObject.quote(url==null?"":url);
        uiEval("window.onSiapPageFinished&&window.onSiapPageFinished("+q+");");
    }

    private void siapLoadRemoteInternal(String url){
        if(!allowedSiapUrl(url))return;
        remoteSiapMode=true;
        siteTop.setVisibility(View.GONE);
        siapWeb.setVisibility(View.GONE);
        uiWeb.setVisibility(View.VISIBLE);
        siapWeb.loadUrl(url);
    }

    private void siapShowRemoteInternal(String url,String title,String sub){
        if(!allowedSiapUrl(url))return;
        remoteSiapMode=true;
        showSiapPage(title==null?"SIAP Fácil":title,sub==null?"":sub);
        siapWeb.loadUrl(url);
    }

    private void siapEvalRemoteInternal(String js,String callback){
        if(js==null)return;
        siapWeb.post(()->siapWeb.evaluateJavascript(js,value->{
            if(callback==null||!callback.matches("[A-Za-z_$][A-Za-z0-9_$]{0,80}"))return;
            String v=value==null?"null":value;
            uiEval("window["+JSONObject.quote(callback)+"]&&window["+JSONObject.quote(callback)+"]("+v+");");
        }));
    }

    private void siapFillCredentialsInternal(String userSelector,String passSelector,String callback){
        if(!hasCredentials())return;
        String ju=JSONObject.quote(getUser()),jp=JSONObject.quote(getPass());
        String us=JSONObject.quote(userSelector==null?"":userSelector),ps=JSONObject.quote(passSelector==null?"":passSelector);
        String js="(function(){try{"+
            "var vis=function(e){return e&&e.offsetParent!==null&&!e.disabled};var a=[].slice.call(document.querySelectorAll('input')).filter(vis);"+
            "var p="+ps+"?document.querySelector("+ps+"):a.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "var u="+us+"?document.querySelector("+us+"):a.find(function(i){var z=((i.id||'')+' '+(i.name||'')).toLowerCase();return /usu|user|login|cpf/.test(z)&&(i.type||'text')!=='password';})||a.find(function(i){var t=(i.type||'text').toLowerCase();return i!==p&&(t==='text'||t==='email'||t==='tel');});"+
            "if(u){u.value="+ju+";u.dispatchEvent(new Event('input',{bubbles:true}));u.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "if(p){p.value="+jp+";p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "return !!u&&!!p;}catch(e){return false;}})();";
        siapEvalRemoteInternal(js,callback);
    }

    private void siapLogoutRemoteInternal(){
        CookieManager.getInstance().removeAllCookies(v->{
            CookieManager.getInstance().flush();
            siapWeb.clearHistory();
            siapWeb.clearCache(false);
            runOnUiThread(()->showRemoteSiapExisting());
        });
    }

'''
if 'private void showRemoteSiap(' not in s:
    if anchor not in s: raise SystemExit('Âncora showShell não encontrada')
    s=s.replace(anchor,methods+anchor,1)

# Quando o controlador remoto está ativo, onPageFinished apenas notifica a página remota.
needle='''                if(url==null)return;
                String low=url.toLowerCase();
'''
replacement='''                if(url==null)return;
                if(remoteSiapMode){
                    notifyRemoteSiapPage(url);
                    return;
                }
                String low=url.toLowerCase();
'''
if replacement not in s:
    if needle not in s: raise SystemExit('Âncora onPageFinished SIAP não encontrada')
    s=s.replace(needle,replacement,1)

# O botão SIAP e o atalho de planejamento passam a abrir o controlador remoto.
s=s.replace('@JavascriptInterface public void openSiap(){runOnUiThread(()->showShell("auto"));}',
            '@JavascriptInterface public void openSiap(){runOnUiThread(()->showRemoteSiap(""));}')
s=s.replace('@JavascriptInterface public void openPlanning(){runOnUiThread(()->{if(hasCredentials())menuActionInternal("planejamento");else showShell("auto");});}',
            '@JavascriptInterface public void openPlanning(){runOnUiThread(()->showRemoteSiap("planejamento"));}')

# Ponte genérica para o controlador remoto.
bridge_anchor='''        @JavascriptInterface public void savePdfBase64(String b,String f,boolean s){savePdfBase64Internal(b,f,s);}
'''
bridge='''        @JavascriptInterface public void siapLoad(String u){runOnUiThread(()->siapLoadRemoteInternal(u));}
        @JavascriptInterface public void siapShow(String u,String t,String sub){runOnUiThread(()->siapShowRemoteInternal(u,t,sub));}
        @JavascriptInterface public void siapEval(String js,String cb){siapEvalRemoteInternal(js,cb);}
        @JavascriptInterface public void siapFillCredentials(String us,String ps,String cb){siapFillCredentialsInternal(us,ps,cb);}
        @JavascriptInterface public void siapReload(){runOnUiThread(()->siapWeb.reload());}
        @JavascriptInterface public String siapCurrentUrl(){String u=siapWeb.getUrl();return u==null?"":u;}
        @JavascriptInterface public void siapBackToRemote(){runOnUiThread(()->showRemoteSiapExisting());}
        @JavascriptInterface public void siapLogout(){siapLogoutRemoteInternal();}
'''
if '@JavascriptInterface public void siapLoad(' not in s:
    if bridge_anchor not in s: raise SystemExit('Âncora da UiBridge não encontrada')
    s=s.replace(bridge_anchor,bridge_anchor+bridge,1)

# Voltar de uma página real do SIAP retorna ao menu remoto, sem fechar.
s=s.replace(
'''        if(siapWeb!=null&&siapWeb.getVisibility()==View.VISIBLE){showShell("menu");return;}
''',
'''        if(siapWeb!=null&&siapWeb.getVisibility()==View.VISIBLE){if(remoteSiapMode)showRemoteSiapExisting();else showShell("menu");return;}
''')

p.write_text(s,encoding='utf-8')
print('Remote SIAP permanent bridge patch applied')
