import Game from "./src/Game";
import TileType from "./src/TileType";
import InputController from "./src/InputController";
import SoundController from "./src/SoundController";
import * as X from "./node_modules/xorox/xorox";
import * as XC from "./node_modules/xorox-canvas/xorox-canvas";
import * as XI from "./node_modules/xorox-input/xorox-input";
import * as XUI from "./node_modules/xorox-ui/xorox-ui";
import * as XA from "./node_modules/xorox-audio/xorox-audio";
import * as easeljs from "createjs-easeljs";
import * as soundjs from "createjs-soundjs";

var engine = new X.Engine();

/**
 * Initializing services
 */
// Canvas
var canvasService = new XC.Canvas("gameCanvas");
engine.addService(canvasService);
// Input
engine.addService(new XI.Input());
// Sound
var soundPlayer = new XA.SoundPlayer();
engine.addService(soundPlayer);

/**
 * Initializing the "main" object
 */
var gameObject = engine.createGameObject();

var spriteSheet = new XC.SpriteSheet({
    images: [
        "./public/tiles.png"
    ],
    frames: {
        width: 48,
        height: 48,
        regX: 24,
        regY: 24
    }
});
var tileTypes = [
    new TileType("rabbit", 5, 10),
    new TileType("pig", 11, 30),
    new TileType("monkey", 17, 90),
    new TileType("snake", 10, 270),
    //new TileType("penguin", 1),
    new TileType("parrot", 0, 810),
    new TileType("giraffe", 15, 2430),
    //new TileType("hippo", 16),
    new TileType("panda", 6, 7290),
];
var game = new Game(tileTypes, spriteSheet);

gameObject.addComponent(new InputController());
gameObject.addComponent(new SoundController());
gameObject.addComponent(game);

/**
 * Ambient sound
 */
soundPlayer.registerSounds("public/ambient.ogg", "ambient");
soundPlayer.registerSounds("public/rotate2.wav", "rotate");
soundPlayer.registerSounds("public/rotate2.wav", "translate");
soundPlayer.registerSounds("public/win.mp3", "unlock");
var sound = soundPlayer.play("ambient", (s: soundjs.AbstractSoundInstance) => {
    s.loop = -1;
});

/**
 * Initializing the UI
 */
// Tilebar
var tilebarUiObject = engine.createGameObject();
var tilebarTemplate = new XUI.Template("tilebar-container", "tilebar-template", game);
tilebarUiObject.addComponent(tilebarTemplate);

// Gameover panel
var gameoverUiObject = engine.createGameObject();
gameoverUiObject.addComponent(new XUI.Template("game-over-container", "game-over-template", game));

// Score panel
var scoreUiObject = engine.createGameObject();
scoreUiObject.addComponent(new XUI.Template("score-container", "score-template", game));

/**
 * Launching the engine
 */
// Debugging purpose
window["engine"] = engine;
window["game"] = game;
// We launch the main loop
engine.start();
engine.startUpdateLoop();
