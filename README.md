FoxCasts
========

A fully-featured podcatcher app for FirefoxOS.

#### Current App Listings
* [FirefoxOS Marketplace](https://marketplace.firefox.com/app/foxcasts)

#### How do I build this?
_Requirements_
* Node.js
* Unix environment 

Set up the build environment the first time you check out the code:

    git submodule init
    git submodule update

Now that you have the basics set up, building the app is easy. Just run the deploy.sh file from the main directory. Easy as that. Platform-specific examples below.

#####FirefoxOS:

    tools/deploy.sh --fxos

#####LuneOS:

Running the command below will build the app and package it as an ipk. The ipk file will be in the /deploy directory.

    tools/deploy.sh --luneos
    
If you want to build the app and also send it to the emulator, use this command instead. The ipk will be sent to /media/internal.
    
    tools/deploy.sh --luneos-deploy

Build and install right to a LuneOS device over adb.

    tools/deploy.sh --luneos-install
