#!/bin/bash

TOOLS=$(cd `dirname $0` && pwd)

echo "Working"

# application root
SRC="$TOOLS/.."

# enyo location
ENYO="$SRC/enyo"

# deploy script location
DEPLOY="$ENYO/tools/deploy.js"

# check for node, but quietly
if command -v node >/dev/null 2>&1; then
	# use node to invoke deploy with imported parameters
	# echo "node $DEPLOY -T -s $SRC -o $SRC/deploy $@"
	node "$DEPLOY" -T -s "$SRC" -o "$SRC/deploy" $@
else
	echo "No node found in path"
	exit 1
fi

# copy files and package if deploying to cordova webos
while [ "$1" != "" ]; do
	case $1 in
		-w | --cordova-webos )
			# copy appinfo.json and cordova*.js files
			DEST="$TOOLS/../deploy/"${PWD##*/}
			
			cp "$SRC"/appinfo.json "$DEST" -v
			cp "$SRC"/cordova*.js "$DEST" -v
			
			# package it up
			mkdir -p "$DEST/bin"
			palm-package "$DEST/bin"
			;;
	esac
	case $1 in --fxos )
		echo "Packaging for FirefoxOS"
		#copy FirefoxOS files
		DEST="$SRC/deploy/"
		# DEST="$TOOLS/../deploy/"

		cp -a "$SRC/fxos/." "$DEST"
	esac
	case $1 in --bb10 )
		echo "Packaging for BlackBerry 10"
		
	esac
	case $1 in --chrome )
		echo "Packaging for Chrome"
		#copy Chrome files
		DEST="$SRC/deploy/"
		# DEST="$TOOLS/../deploy/"

		cp -a "$SRC/chrome/." "$DEST"
	esac
	case $1 in --webos )
		echo "Packaging for webOS"
		#copy webOS files
		DEST="$SRC/deploy/"
		# DEST="$TOOLS/../deploy/"

		cp -a "$SRC/webOS/." "$DEST"
	esac
    case $1 in --luneos-deploy )
        echo "Packaging for LuneOS"
        
        # Copy LuneOS files
        DEST="$SRC/deploy/"
        cp -a "$SRC/luneos/." "$DEST"
        
        # Package it as an ipk
        palm-package -o ./deploy ./deploy
        
        # Locate the new ipk and store in a variable
        ipkLocation="$(find ./deploy -maxdepth 1 -name '*.ipk' -print -quit)"

        # Copy the ipk over to the LuneOS emulator
        scp -P 5522 $ipkLocation root@localhost:/media/internal

    esac
	shift
done