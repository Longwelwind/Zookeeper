import * as X from "../node_modules/xorox/xorox";
import * as XA from "../node_modules/xorox-audio/xorox-audio";
import * as soundjs from "createjs-soundjs";
import Game from "./Game";

export default class SoundController extends X.Component {
    static id: string = "soundcontroller";
    
    soundPlayer: XA.SoundPlayer;
    game: Game;
    
    public onStart() {
        this.soundPlayer = <XA.SoundPlayer> this.engine.getService(XA.SoundPlayer.id);
        this.game = <Game> this.gameObject.getComponent(Game.id);
        
        this.game.onRotate = () => {
            this.soundPlayer.play("rotate", (s: soundjs.AbstractSoundInstance) => {
                s.volume = 0.1;
            });
        }
        this.game.onTranslate = () => {
            this.soundPlayer.play("translate", (s: soundjs.AbstractSoundInstance) => {
                s.volume = 0.1;
            });
        }
        this.game.onUnlock = () => {
            this.soundPlayer.play("unlock", (s: soundjs.AbstractSoundInstance) => {
                s.volume = 0.1;
            });
        }
    }
    
}