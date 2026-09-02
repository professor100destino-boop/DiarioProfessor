@echo off
setlocal
chcp 65001 >nul
set "PKG=br.com.professor100destino.docenciafacil.permanente"
set "OUT=ProfessorControl-RESGATE.tar"

echo ========================================================
echo   RESGATE DE DADOS - DOCENCIA FACIL / PROFESSOR CONTROL
echo ========================================================
echo.

where adb >nul 2>nul
if errorlevel 1 (
  echo ERRO: adb nao foi encontrado neste computador.
  echo Instale/extraia o Android Platform Tools e execute este arquivo dentro da pasta onde esta adb.exe.
  pause
  exit /b 1
)

echo [1/4] Verificando tablet conectado...
adb get-state >nul 2>nul
if errorlevel 1 (
  echo ERRO: nenhum aparelho autorizado foi encontrado.
  echo Conecte o tablet por USB, ative Depuracao USB e aceite a autorizacao no tablet.
  pause
  exit /b 2
)

echo [2/4] Verificando acesso seguro ao aplicativo...
adb shell run-as %PKG% id >nul 2>nul
if errorlevel 1 (
  echo ERRO: nao foi possivel acessar os dados privados do aplicativo com run-as.
  echo NAO desinstale o aplicativo. Envie uma foto desta tela para continuarmos o resgate por outra rota.
  pause
  exit /b 3
)

echo [3/4] Fechando o aplicativo sem apagar dados...
adb shell am force-stop %PKG% >nul 2>nul

echo [4/4] Copiando armazenamento privado...
if exist "%OUT%" del /q "%OUT%"
adb exec-out run-as %PKG% sh -c "cd /data/data/%PKG% && tar -cf - files shared_prefs databases app_webview no_backup 2>/dev/null" > "%OUT%"

if not exist "%OUT%" (
  echo ERRO: o arquivo de resgate nao foi criado.
  pause
  exit /b 4
)

for %%A in ("%OUT%") do set SIZE=%%~zA
if "%SIZE%"=="0" (
  echo ERRO: o arquivo foi criado vazio. NAO desinstale o aplicativo.
  del /q "%OUT%"
  pause
  exit /b 5
)

echo.
echo ========================================================
echo RESGATE CONCLUIDO.
echo Arquivo criado: %OUT%
echo Tamanho: %SIZE% bytes
echo.
echo GUARDE ESTE ARQUIVO. NAO DESINSTALE O APP AINDA.
echo ========================================================
pause
endlocal
