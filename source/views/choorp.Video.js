enyo.kind({
    name: 'choorp.Video',
    kind: 'Control',
    tag: 'video',
    style: "width: 100%; max-height: 100vh;",
    published: {
        src: ''
    },
    attributes: {
        controls: true
    },
    srcChanged: function() {
        this.log('New url: ' + this.url);
        
        this.hasNode().src = this.src;
    },
    pause: function() {
        this.hasNode().pause();
    },
    play: function() {
        this.hasNode().play();
    }
})