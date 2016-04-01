import Game from "./Game";
import * as X from "../node_modules/xorox/xorox";
import * as XI from "../node_modules/xorox-input/xorox-input";


export default class InputController extends X.Component {
    private game: Game;
    private input: XI.Input;
    
    public onStart() {
        this.game = <Game> this.gameObject.getComponent(Game.id);
        this.input = <XI.Input> this.engine.getService(XI.Input.id);
    }
    
    public onUpdate(delta: number) {
        if (this.input.isKeyDown(37)) {
            this.game.translateItemsToDrop(-1);
        }
        if (this.input.isKeyDown(38)) {
            this.game.rotateItemsToDrop();
        }
        if (this.input.isKeyDown(39)) {
            this.game.translateItemsToDrop(1);
        }
        if (this.input.isKeyDown(40)) {
            this.game.dropItemsToDrop();
        }
    }
}