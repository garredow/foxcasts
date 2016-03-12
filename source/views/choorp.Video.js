enyo.kind({
    name: 'choorp.Video',
    kind: 'enyo.Media',
    tag: 'video',
    style: "width: 100%; max-height: 100vh;",
    published: {
        src: ''
    },
    create: function() {
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);
        this.hasNode().setAttribute('controls', '');
    },
    srcChanged: function() {
        this.log('New src: ' + this.src);
        this.hasNode().src = this.src;
    },
    pause: function() {
        this.hasNode().pause();
    },
    play: function() {
        this.hasNode().play();
    }
})