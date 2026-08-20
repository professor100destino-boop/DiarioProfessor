from pathlib import Path

p=Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s=p.read_text(encoding='utf-8')

if 'BACKUP_SAVE_REQUEST=5106' not in s:
    s=s.replace('private static final int FILE_CHOOSER_REQUEST=5105;',
                'private static final int FILE_CHOOSER_REQUEST=5105;\n    private static final int BACKUP_SAVE_REQUEST=5106;')

if 'pendingBackupText' not in s:
    s=s.replace('private ValueCallback<Uri[]> filePathCallback;',
                'private ValueCallback<Uri[]> filePathCallback;\n    private String pendingBackupText="";\n    private String pendingBackupFilename="backup-professor-control.json";')

marker='''        if(requestCode==FILE_CHOOSER_REQUEST){\n            if(filePathCallback!=null){\n                Uri[] results=WebChromeClient.FileChooserParams.parseResult(resultCode,data);\n                filePathCallback.onReceiveValue(results);\n                filePathCallback=null;\n            }\n            return;\n        }\n'''
backup_block='''        if(requestCode==BACKUP_SAVE_REQUEST){\n            if(resultCode==RESULT_OK && data!=null && data.getData()!=null){\n                Uri uri=data.getData();\n                try(OutputStream out=getContentResolver().openOutputStream(uri)){\n                    if(out==null)throw new Exception("Não foi possível abrir o destino escolhido.");\n                    out.write(pendingBackupText.getBytes(StandardCharsets.UTF_8));\n                    out.flush();\n                    Toast.makeText(this,"Backup salvo no local escolhido.",Toast.LENGTH_LONG).show();\n                }catch(Exception e){\n                    Toast.makeText(this,"Não foi possível salvar o backup: "+e.getMessage(),Toast.LENGTH_LONG).show();\n                }\n            }\n            pendingBackupText="";\n            pendingBackupFilename="backup-professor-control.json";\n            return;\n        }\n'''
if 'if(requestCode==BACKUP_SAVE_REQUEST)' not in s:
    s=s.replace(marker,marker+backup_block)

method_marker='''    private Uri savePdfToDownloads(String base64Data,String filename) throws Exception{\n'''
chooser_method='''    private void chooseBackupLocationInternal(String text,String filename){\n        runOnUiThread(()->{\n            try{\n                pendingBackupText=text==null?"":text;\n                String name=(filename==null||filename.trim().isEmpty())?"backup-professor-control.json":filename.trim();\n                if(!name.toLowerCase().endsWith(".json"))name+=".json";\n                pendingBackupFilename=name;\n                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);\n                intent.addCategory(Intent.CATEGORY_OPENABLE);\n                intent.setType("application/json");\n                intent.putExtra(Intent.EXTRA_TITLE,pendingBackupFilename);\n                startActivityForResult(intent,BACKUP_SAVE_REQUEST);\n            }catch(Exception e){\n                Toast.makeText(MainActivity.this,"Não foi possível abrir o seletor de local: "+e.getMessage(),Toast.LENGTH_LONG).show();\n            }\n        });\n    }\n\n'''
if 'chooseBackupLocationInternal' not in s:
    s=s.replace(method_marker,chooser_method+method_marker)

bridge_marker='''        @JavascriptInterface public void savePdfBase64(String b,String f,boolean s){savePdfBase64Internal(b,f,s);}\n'''
bridge_add='''        @JavascriptInterface public void chooseBackupLocation(String text,String filename){chooseBackupLocationInternal(text,filename);}\n'''
if '@JavascriptInterface public void chooseBackupLocation' not in s:
    s=s.replace(bridge_marker,bridge_marker+bridge_add)

p.write_text(s,encoding='utf-8')
print('Backup chooser patch applied')
