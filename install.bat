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
copy weigh_scale_server.exe c:\windows\system32
c:
cd c:\windows\system32
nssm install WeighScale C:\windows\system32\weigh_scale_server.exe
nssm set WeighScale AppExit Default Restart
sc failure WeighScale reset= 0 actions= restart/0/restart/0/restart/0
