@echo off
REM Compile the handlebars templates.
handlebars %~dp0stylebot\js\templates\style.handlebars %~dp0stylebot\js\templates\style-modal.handlebars -f %~dp0stylebot\js\templates.js
