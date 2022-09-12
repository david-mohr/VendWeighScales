@echo off
echo Administrative permissions required. Detecting permissions...

net session >nul 2>&1
if %errorLevel% == 0 (
    echo Success: Administrative permissions confirmed.
) else (
    echo Failure: Please run this script as admin
    exit /b 1
)

copy nssm.exe c:\windows\system32
md "c:\Program Files\WeighScale"
md "c:\Program Files\WeighScale\chrome"
copy WeighScale "c:\Program Files\WeighScale"
copy WeighScale\chrome "c:\Program Files\WeighScale\chrome"
c:
cd c:\windows\system32
nssm install WeighScale "C:\Program Files\WeighScale\weigh_scale_server.exe"
nssm set WeighScale AppDirectory "C:\Program Files\WeighScale"
nssm set WeighScale AppExit Default Restart
sc failure WeighScale reset= 0 actions= restart/0/restart/0/restart/0
sc start WeighScale
start "" http://localhost:3000
