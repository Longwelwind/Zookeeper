import Tile from "./Tile";
import TileType from "./TileType";
import * as X from "../node_modules/xorox/xorox";
import * as XC from "../node_modules/xorox-canvas/xorox-canvas";

export default class Game extends X.Component {
    static id: string = "game";

    timeBegin: number = 0;
    timeEnd: number = 0;
    tileTypes: TileType[];
    spriteSheet: XC.SpriteSheet;
    width: number = 6;
    height: number = 10;
    heightLimit: number = 8;
    grid: Tile[][];
    itemsToDrop: Tile[][];
    positionItemsToDrop: number = Math.floor(this.width / 2);
    phase: Phase = Phase.WAITING_DROP;
    lastUnlockedTier: number = 2;
    score: number = 0;
    
    onRotate: () => void;
    onTranslate: () => void;
    onUnlock: () => void;

    public constructor(tileTypes: TileType[], spriteSheet: XC.SpriteSheet) {
        super();
        this.tileTypes = tileTypes;
        this.spriteSheet = spriteSheet;

        this.grid = X.Util.generateArray2D<Tile>(this.width, this.height);
    }

    public onStart(): void {
        this.timeBegin = X.Util.getTimestamp();
        this.generateItemsToDrop();
    }

    public generateItemsToDrop(): void {
        this.itemsToDrop = X.Util.generateArray2D<Tile>(1, 2);

        // We populate the new items to drop with tiles
        this.itemsToDrop.forEach((column, i) => {
            column.forEach((tile, j) => {
                 this.itemsToDrop[i][j] = this.createTile(
                     this.getRandomTileType(),
                     new X.Vector(this.positionItemsToDrop + i, this.heightLimit + j));
            });
        });
    }

    public translateItemsToDrop(direction: number): void {
        if (this.phase != Phase.WAITING_DROP) {
            return;
        }
        
        var newPos = this.positionItemsToDrop + direction;
        if (newPos < 0 || this.width < newPos + this.itemsToDrop.length) {
            return;
        }
        this.positionItemsToDrop = newPos;

        this.updateItemsToDrop();
        
        if (this.onTranslate != null) {
            this.onTranslate();
        }
    }

    public rotateItemsToDrop(): void {
        if (this.phase != Phase.WAITING_DROP) {
            return;
        }
        
        // To rotate clockwise, we:
        // 1. Transpose
        var transposedItems: Tile[][] = [];
        for (var i = 0;i < this.itemsToDrop[0].length;i++) {
            transposedItems[i] = [];
            for (var j = 0;j < this.itemsToDrop.length;j++) {
                transposedItems[i][j] = this.itemsToDrop[j][i];
            }
        }
        // 2. Reverse each column
        var newItemsToDrop: Tile[][] = [];
        for (var i = 0;i < transposedItems.length;i++) {
            newItemsToDrop[i] = [];
            for (var j = 0;j < transposedItems[0].length;j++) {
                newItemsToDrop[i][j] = transposedItems[i][transposedItems[0].length - j - 1];
            }
        }
        
        // We must check if didn't go out of bounds by rotating
        var delta = this.width - this.positionItemsToDrop - newItemsToDrop.length;
        if (delta < 0) {
            
            this.positionItemsToDrop += delta;
        }
        
        this.itemsToDrop = newItemsToDrop;
        this.updateItemsToDrop();
        
        if (this.onRotate != null) {
            this.onRotate();
        }
    }

    public dropItemsToDrop(): void {
        if (this.phase != Phase.WAITING_DROP) {
            return;
        }
        this.phase = Phase.PROCESSING;
        
        // We cast the items into the grid
        this.itemsToDrop.forEach((c, i) => {
            c.forEach((tile, j) => {
                this.grid[this.positionItemsToDrop + i][this.heightLimit + j] = tile;
            });
        });
        this.itemsToDrop = [];
        
        this.processTurn(() => {
            // Is game finished ?
            if (this.checkItemsOverLimit()) {
                // Game over !
                this.phase = Phase.FINISHED;
                this.timeEnd = X.Util.getTimestamp();
                return;
            }
            
            this.generateItemsToDrop();
            this.phase = Phase.WAITING_DROP;
        });
    }
    
    public checkItemsOverLimit(): boolean {
        for (var i = 0;i < this.width;i++) {
            for (var j = this.heightLimit;j < this.height;j++) {
                if (this.getTileAt(new X.Vector(i, j))) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    public processTurn(callback: () => void) {
        // We drop the items
        this.dropItems(() => {
            this.updateScore();
            
            window.setTimeout(() => {
                var matchFound = this.findAndProcessMatchedTiles(() => {
                    this.updateScore();
                    // We make an other turn to see if there is a
                    // cascade effect
                    window.setTimeout(() => {
                        this.processTurn(callback);
                    }, 400);
                });
                
                if (!matchFound) {
                    this.updateScore();
                    callback();
                }
            }, 400);
            
        });
    }
    
    public dropItems(callback: () => void): void {
        var tilesMoved: number = 0;
        var tilesMoveFinished: number = 0;
        for (var i = 0;i < this.width;i++) {
            for (var j = 0;j < this.height;j++) {
                var tile = this.grid[i][j];
                if (tile != null) {
                    // We find the lowest free tile
                    var finalHeight = j;
                    while (finalHeight > 0 && this.grid[i][finalHeight-1] == null) {
                        finalHeight--;
                    }
                    
                    if (finalHeight != j) {
                        // The tile has to be dropped !
                        tilesMoved++;
                        var newPosition = new X.Vector(i, finalHeight);
                        this.grid[i][j] = null;
                        this.grid[i][finalHeight] = tile;
                        
                        tile.move(newPosition, () => {
                            tilesMoveFinished++;
                            
                            if (tilesMoveFinished == tilesMoved) {
                                // All tiles have finished their moves
                                callback();
                            }
                        });
                    }
                }
            }
        }
        
        if (tilesMoved == 0) {
            // No tiles moved
            callback();
        }
    }

    public findAndProcessMatchedTiles(callback: () => void): boolean {
        var matchFound: number = 0;
        var matchFoundFinished: number = 0;
        
        for (var j = 0;j < this.height;j++) {
            for (var i = 0;i < this.width;i++) {
                var pos = new X.Vector(i, j);
                var tile = this.getTileAt(pos);
                if (tile != null) {
                    // Is there a match
                    let matchedTiles: Tile[] = this.findAdjacentTiles(tile, []);
                    var nextTileType = this.getNextType(tile.type);
                    
                    if (matchedTiles.length >= 3 && nextTileType != null) {
                        this.processMatchedTiles(tile, nextTileType, matchedTiles, () => {
                            matchFoundFinished++;
                            if (matchFound == matchFoundFinished) {
                                callback();
                            }
                        });
                        matchFound++;
                    }
                }
            }
        }
        
        return matchFound != 0;
    }
    
    private processMatchedTiles(tile: Tile, type: TileType, matchedTiles: Tile[], callback: () => void) {
        // We found a match !
        let tilesMoveFinished = 0;
        var pos = tile.tilePosition;
        
        matchedTiles.forEach((t, it, matchedTiles) => {
            this.grid[t.tilePosition.x][t.tilePosition.y] = null;
            
            t.move(pos, () => {
                tilesMoveFinished++;
                
                if (tilesMoveFinished == matchedTiles.length) {
                    // All tiles have moved !
                    // We destroy all tiles
                    matchedTiles.forEach((t) => {
                        this.grid[t.tilePosition.x][t.tilePosition.y] = null;
                        t.gameObject.destroy();
                    })
                    
                    // We spawn the new tile if there is a
                    // tile in the new tier
                    if (type != null) {
                        var tile: Tile = this.createTile(type, pos);
                        this.grid[pos.x][pos.y] = tile;
                    }
                    
                    this.checkIfTypeUnlock(type);
                    callback();
                }
            });
        });
    }
    
    private checkIfTypeUnlock(type: TileType) {
        var lastUnlockedType = this.tileTypes[this.lastUnlockedTier];
        if (lastUnlockedType == type) {
            this.lastUnlockedTier++;
            
            if (this.onUnlock != null) {
                this.onUnlock();
            }
        }
    }
    
    private updateScore() {
        this.score = this.getScore();
    }
    
    private getScore() {
        var score: number = 0;
        for (var i = 0;i < this.width;i++) {
            for (var j = 0;j < this.height;j++) {
                var item = this.getTileAt(new X.Vector(i, j));
                if (item != null) {
                    score += item.type.score;
                }
            }
        }
        return score;
    }
    
    public getAvailableTileTypes(): TileType[] {
        return this.tileTypes.slice(0, this.lastUnlockedTier);
    }
    
    private getNextType(tileType: TileType): TileType {
        var i = 0;
        while (i < this.tileTypes.length && this.tileTypes[i] != tileType) {
            i++;
        }
        
        return (i+1 < this.tileTypes.length) ? this.tileTypes[i+1] : null;
    }
    
    public isAllUnlocked(): boolean {
        return this.lastUnlockedTier == this.tileTypes.length;
    }
    
    private findAdjacentTiles(tile: Tile, alreadyFoundTiles: Tile[]): Tile[] {
        alreadyFoundTiles.push(tile);
                
        var sides = [
            new X.Vector(1, 0),
            new X.Vector(-1, 0),
            new X.Vector(0, 1),
            new X.Vector(0, -1)
        ];
        
        sides.forEach((side) => {
            var newPosition = tile.tilePosition.add(side);
            var adjacentTile = this.getTileAt(newPosition);
            
            if (adjacentTile != null && adjacentTile.type == tile.type
                    && alreadyFoundTiles.indexOf(adjacentTile) == -1) {
                        
                alreadyFoundTiles = this.findAdjacentTiles(adjacentTile, alreadyFoundTiles);
            }
        });
        
        return alreadyFoundTiles;
    }
    
    public getTileAt(pos: X.Vector): Tile {
        if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height) {
            return null;
        }
        
        return this.grid[pos.x][pos.y];
    }

    public updateItemsToDrop(): void {
        this.itemsToDrop.forEach((c, i) => {
            c.forEach((tile, j) => {
                tile.move(new X.Vector(this.positionItemsToDrop + i , this.heightLimit + j), null);
            });
        });
    }

    public getRandomTileType(): TileType {
        var availableTypes = this.getAvailableTileTypes();
        // Secret formula:  each item has half 
        var probabilites = [];
        var cur = 1;
        var tierFactor = 0.35;
        var sum = 0;
        
        availableTypes.forEach((t, i) => {
            probabilites.push(cur);
            sum += cur;
            cur = cur * tierFactor;
        });
        
        var rng = Math.random() * sum;
        // We find which tier was picked
        var sum = 0;
        return availableTypes.filter((t, i) => {
            sum += probabilites[i];
            return rng < sum;
        })[0];
    }
    
    public getTierType(tileType: TileType): number {
        var tier: number = 0;
        this.tileTypes.forEach((type, i) => {
            if (type == tileType) {
                tier = i;
            }
        });
        return tier;
    }

    public createTile(tileType: TileType, tilePosition: X.Vector): Tile {
        var object = this.engine.createGameObject();

        var tile = new Tile(this, tileType, tilePosition);
        object.addComponent(tile);

        var sprite = new XC.Sprite(this.spriteSheet);
        object.addComponent(sprite);
        sprite.sprite.gotoAndStop(tileType.frameNumber);

        return tile;
    }
    
    public getTimeElapsed(): any {
        var deltaSeconds = Math.floor((this.timeEnd - this.timeBegin) / 1000);
        var minutes = Math.floor(deltaSeconds / 60);
        var seconds = deltaSeconds % 60;
        
        return {
            minutes: minutes,
            seconds: seconds
        };
    }
}

enum Phase {
    WAITING_DROP,
    PROCESSING,
    FINISHED = 2
}