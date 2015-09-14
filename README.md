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

FirefoxOS:

    git submodule
    tools/deploy.sh --fxos
