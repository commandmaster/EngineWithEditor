import ModuleBase from './moduleBase.js';

export default class ScriptingSystem extends ModuleBase{
    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    Preload(){
        this.scriptClasses = {};
        this.scriptInstances = {};
        return new Promise((resolve, reject) => { 
            const assetData = this.engineAPI.gameConfig.assets;
            for (const script of assetData.scripts){
                let scriptPath = assetData.assetsPath + '/scripts/' + script;

                if (scriptPath.includes('.js') === false){
                    scriptPath = scriptPath + '.js';
                }

                import(scriptPath).then((module) => {
                    this.scriptClasses[script] = module.default;
                });
            }
            resolve();
        });
    }

    Start(){
        
    }

    Update(){
        for (const scriptName in this.scriptInstances){
            this.scriptInstances[scriptName].Update();
        }
    }
    
    addScriptInstance(scriptName, gameObject){

        if (this.scriptClasses[scriptName]){
            this.scriptInstances[scriptName] = new this.scriptClasses[scriptName](this.engineAPI, gameObject);
            this.scriptInstances[scriptName].Start();
        }
    }
    
}