export default class ModuleBase {
    constructor(engineAPI, gameConfig) {
        this.engineAPI = engineAPI;
        this.engine = engineAPI.engine;
        this.p5 = engineAPI.engine.p5;
        this.gameConfig = gameConfig;
    }

    Preload() {
        return new Promise((resolve, reject) => { 
            resolve();
        });
    }

    Start() {
        return;
    }

    Update(dt) {
        return;
    }
}