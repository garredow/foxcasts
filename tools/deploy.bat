@REM don't watch the sausage being made
@ECHO OFF

REM the folder this script is in (*/bootplate/tools)
SET TOOLS=%~DP0

REM application source location
SET SRC=%TOOLS%\..

REM enyo location
SET ENYO=%SRC%\enyo

REM deploy script location
SET DEPLOY=%ENYO%\tools\deploy.js

REM node location
SET NODE=node.exe

REM use node to invoke deploy.js with imported parameters
REM ECHO %NODE% "%DEPLOY%" -T -s "%SRC%" -o "%SRC%\deploy" %*
%NODE% "%DEPLOY%" -T -s "%SRC%" -o "%SRC%\deploy" %*

REM copy files and package if deploying to cordova webos
:again
if not "%1" == "" (

    if "%1" == "--fxos" (
    	echo FirefoxOS
        rem I don't know how to write batch scripts, but this works.
    	:setBase
    	SET BASE=%~dp0..\
    	if [%BASE%] == [] goto setBase
    	rem echo. %BASE%

    	:setDest
    	SET DEST=%BASE%deploy
    	if [%DEST%] == [] goto setDest
    	rem echo. Dest: %DEST%

    	:setChrome
    	SET CHROME=%BASE%fxos
    	if [%CHROME%] == [] goto setChrome
    	rem echo. Chrome: %CHROME%

    	xcopy %CHROME% %DEST% /e /q
	)
)
