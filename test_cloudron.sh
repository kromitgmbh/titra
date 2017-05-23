#!/bin/bash
rm titra.tar.gz
meteor build --architecture os.linux.x86_64 /Users/fabian/build/titra/
cp /Users/fabian/build/titra/titra.tar.gz .
cloudron build
cloudron install
