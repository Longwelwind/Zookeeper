import TileType from "./TileType";
import Game from "./Game";
import * as X from "../node_modules/xorox/xorox";

export default class Tile extends X.Component {
    sizeSide = 48;
    speedMovement = this.sizeSide * 10;
    
    game: Game;
    type: TileType;
    tilePosition: X.Vector;
    moveFinishedCallback: () => void;
    
    public constructor(game: Game, type: TileType, tilePosition: X.Vector) {
        super();
        this.game = game;
        this.type = type;
        this.tilePosition = tilePosition;
    }
    
    public onStart() {
        this.transform.position = this.tileToRender(this.tilePosition);
    }
    
    public move(tilePosition: X.Vector, callback: () => void): void {
        this.tilePosition = tilePosition;
        
        if (this.moveFinishedCallback != null) {
            this.moveFinishedCallback();
        }
        this.moveFinishedCallback = callback;
    }
    
    public onUpdate(delta: number): void {
        var curPosition = this.transform.position;
        var targetPosition = this.tileToRender(this.tilePosition);
        
        curPosition.x = X.Util.moveTowards(curPosition.x, targetPosition.x, this.speedMovement * delta / 1000);
        curPosition.y = X.Util.moveTowards(curPosition.y, targetPosition.y, this.speedMovement * delta / 1000);
        
        this.transform.position = curPosition;
        if (curPosition.equals(targetPosition)) {
            // Movement is finished
            if (this.moveFinishedCallback != null) {
                var callback = this.moveFinishedCallback;
                this.moveFinishedCallback = null;
                callback();
            }
        }
    }
    
    public tileToRender(vec: X.Vector): X.Vector {
        return new X.Vector((vec.x + 0.5) * this.sizeSide, -(this.game.height - 1 - vec.y + 0.5) * this.sizeSide);
    }
}