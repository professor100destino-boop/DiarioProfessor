from pathlib import Path

p=Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s=p.read_text(encoding='utf-8')

if 'import android.print.PrintManager;' not in s:
    s=s.replace('import android.provider.MediaStore;','import android.provider.MediaStore;\nimport android.print.PrintAttributes;\nimport android.print.PrintDocumentAdapter;\nimport android.print.PrintManager;')

if 'private WebView printWebView;' not in s:
    s=s.replace('private ValueCallback<Uri[]> filePathCallback;','private ValueCallback<Uri[]> filePathCallback;\n    private WebView printWebView;')

marker='''    private Uri savePdfToDownloads(String base64Data,String filename) throws Exception{\n'''
method='''    private void printHtmlInternal(String html,String jobName){\n        runOnUiThread(()->{\n            try{\n                printWebView=new WebView(MainActivity.this);\n                printWebView.getSettings().setJavaScriptEnabled(false);\n                printWebView.setWebViewClient(new WebViewClient(){\n                    @Override public void onPageFinished(WebView view,String url){\n                        try{\n                            PrintManager pm=(PrintManager)getSystemService(Context.PRINT_SERVICE);\n                            String name=(jobName==null||jobName.trim().isEmpty())?"Advertencia":jobName.trim();\n                            PrintDocumentAdapter adapter=view.createPrintDocumentAdapter(name);\n                            PrintAttributes attrs=new PrintAttributes.Builder()\n                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)\n                                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)\n                                .build();\n                            pm.print(name,adapter,attrs);\n                        }catch(Exception e){\n                            Toast.makeText(MainActivity.this,"Não foi possível abrir a impressão: "+e.getMessage(),Toast.LENGTH_LONG).show();\n                        }\n                    }\n                });\n                printWebView.loadDataWithBaseURL("https://docenciafacil.local/",html==null?"":html,"text/html","UTF-8",null);\n            }catch(Exception e){\n                Toast.makeText(MainActivity.this,"Não foi possível preparar a impressão: "+e.getMessage(),Toast.LENGTH_LONG).show();\n            }\n        });\n    }\n\n'''
if 'private void printHtmlInternal' not in s:
    if marker in s:
        s=s.replace(marker,method+marker)
    else:
        # fallback before UiBridge
        s=s.replace('    public class UiBridge{',method+'    public class UiBridge{')

bridge_marker='''        @JavascriptInterface public void savePdfBase64(String b,String f,boolean s){savePdfBase64Internal(b,f,s);}\n'''
bridge_add='''        @JavascriptInterface public void printHtml(String html,String jobName){printHtmlInternal(html,jobName);}\n'''
if '@JavascriptInterface public void printHtml' not in s:
    if bridge_marker in s:
        s=s.replace(bridge_marker,bridge_marker+bridge_add)
    else:
        s=s.replace('    public class UiBridge{','    public class UiBridge{\n'+bridge_add)

p.write_text(s,encoding='utf-8')
print('Native print patch applied')
