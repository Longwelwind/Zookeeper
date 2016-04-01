var require = {
    paths: {
        "createjs-easeljs": "./node_modules/createjs-easeljs/lib/easeljs-0.8.2.min",
        "createjs-soundjs": "./node_modules/createjs-soundjs/lib/soundjs-0.6.2.min",
        "vue": "./node_modules/vue/dist/vue.min"
    },
    shim: {
        "createjs-easeljs": {
            exports: 'createjs'
        },
        "createjs-soundjs": {
            exports: 'createjs'
        }
    }
};