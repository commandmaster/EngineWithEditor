import ModuleBase from "./moduleBase.js";
import { RendererAPI } from "./renderer.js";

export default class ParticleSystem extends ModuleBase{ 
    //#region Private Fields
    #systemConfigs = {};
    //#endregion

    //#region Public Fields
    systemInstances = {};
    //#endregion

    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    //#region Enigine Callbacks
    Preload(){
        return new Promise(async (resolve, reject) => {
            this.#systemConfigs = await this.#loadSystems(this.gameConfig);
            resolve();
        });
    }

    Start(){
        
    }

    Update(){
        for (const systemName in this.systemInstances){
            this.systemInstances[systemName].Update();
        }
    }
    //#endregion



    //#region Public Methods
    SpawnSystem(systemInstance){
        this.systemInstances[systemInstance.config.name + "_" + crypto.randomUUID()] = systemInstance;
        systemInstance.Start();
    }
    //#endregion



    //#region Private Methods
    async #loadSystems(gameConfig){
        return new Promise(async (resolve, reject) => {
            const tempConfigs = {};
            for (const systemName in gameConfig.assets.particleSystems){
                const systemConfig = await this.#loadSystem(gameConfig, systemName);
                tempConfigs[systemName] = systemConfig;
            }
            resolve(tempConfigs);
        });
    }

    #loadSystem(gameConfig, systemName){
        return new Promise((resolve, reject) => {
            const systemConfigPath = gameConfig.assets.particleSystems[systemName].pathToParticleSystemConfig;
            this.p5.loadJSON(systemConfigPath, (data) => {
                resolve(data);
            });
        });
    }
    //#endregion

    //#region Public Getters
    get systemConfigs(){
        return this.#systemConfigs;
    }
}

