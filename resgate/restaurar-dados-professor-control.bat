@echo off
setlocal
chcp 65001 >nul
set "PKG=br.com.professor100destino.docenciafacil.permanente"
set "BACKUP=ProfessorControl-RESGATE.tar"
set "REMOTE=/data/local/tmp/ProfessorControl-RESGATE.tar"

echo ========================================================
echo   RESTAURACAO DE DADOS - DOCENCIA FACIL
echo ========================================================
echo.

where adb >nul 2>nul
if errorlevel 1 (
  echo ERRO: adb nao foi encontrado.
  pause
  exit /b 1
)

if not exist "%BACKUP%" (
  echo ERRO: %BACKUP% nao esta nesta pasta.
  echo Copie o arquivo de resgate para a mesma pasta deste utilitario.
  pause
  exit /b 2
)

adb get-state >nul 2>nul
if errorlevel 1 (
  echo ERRO: nenhum aparelho autorizado foi encontrado.
  pause
  exit /b 3
)

adb shell run-as %PKG% id >nul 2>nul
if errorlevel 1 (
  echo ERRO: a nova instalacao nao esta acessivel por run-as.
  echo NAO limpe dados e nao tente outra reinstalacao antes de revisar isto.
  pause
  exit /b 4
)

echo [1/5] Fechando o aplicativo...
adb shell am force-stop %PKG% >nul 2>nul

echo [2/5] Enviando o arquivo de resgate...
adb push "%BACKUP%" %REMOTE%
if errorlevel 1 (
  echo ERRO ao enviar o arquivo para o tablet.
  pause
  exit /b 5
)
adb shell chmod 644 %REMOTE% >nul 2>nul

echo [3/5] Restaurando dados privados...
adb shell run-as %PKG% sh -c "cd /data/data/%PKG% && tar -xf %REMOTE%"
if errorlevel 1 (
  echo ERRO durante a restauracao. O arquivo de resgate continua preservado no computador.
  pause
  exit /b 6
)

echo [4/5] Removendo apenas caches que podem manter a tela antiga...
adb shell run-as %PKG% sh -c "cd /data/data/%PKG% && rm -rf cache code_cache app_webview/Default/Cache app_webview/Default/GPUCache app_webview/Default/Service\ Worker" >nul 2>nul

echo [5/5] Limpando arquivo temporario...
adb shell rm -f %REMOTE% >nul 2>nul

echo.
echo ========================================================
echo RESTAURACAO CONCLUIDA.
echo Agora abra o Docencia Facil no tablet.
echo O arquivo %BACKUP% foi mantido no computador por seguranca.
echo ========================================================
pause
endlocal
