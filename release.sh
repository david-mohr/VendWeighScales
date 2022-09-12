#!/bin/bash

cd app || exit 1
yarn pkg:win
cd ..
mkdir -p dist/WeighScale
cp -a app/bin/win/weigh_scale_server.exe app/node_modules/@serialport/bindings-cpp/prebuilds dist/WeighScale/
cp install.bat dist
cd dist || exit 1
if [[ ! -e nssm.exe ]]; then
  wget https://nssm.cc/release/nssm-2.24.zip
  unzip -j nssm-2.24.zip nssm-2.24/win64/nssm.exe
  rm nssm-2.24.zip
fi
cd ..
zip -r weigh_scale.zip dist/*
