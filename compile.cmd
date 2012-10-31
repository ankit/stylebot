@ECHO OFF
SETLOCAL
REM Compile the handlebars templates.
SET handlebars=
FOR /r %%i in (stylebot\js\templates\*.handlebars) DO CALL :concat %%i
handlebars %handlebars% -f %~dp0stylebot\js\templates.js
GOTO :eof

:concat
SET handlebars=%handlebars%%1 
GOTO :eof

:eof
ENDLOCAL