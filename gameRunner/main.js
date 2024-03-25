// 
// Bennett Friesen
// 
//
// Extra for Experts:



//#region Imports
import Renderer from './engineModules/systems/renderer.js';
import InputSystem from './engineModules/systems/inputSystem.js';
import PhysicsSystem from './engineModules/systems/physicsSystem.js';
import ScriptingSystem from './engineModules/systems/scriptingSystem.js';
import AudioSystem from './engineModules/systems/audioSystem.js';
import ParticleSystem from './engineModules/systems/particleSystem.js';

import {GameObjectInstance, Camera}  from './engineModules/engineObjects.js';
//#endregion



//#region P5js Game Loop and Instance creation using the Engine
let preloadDone = false;
let firstUpdate = false
let game = function(p5){
  let gameEngine = new Engine(p5);

  p5.preload = async function(){
    await gameEngine.Preload();
    preloadDone = true;
  };

  p5.setup = function(){
    ScriptingAPI.waitForCondition(() => {return preloadDone}).then(() => {
      gameEngine.Start();
    }, 50);
    
  }

  p5.draw = function(){
    // avoid issues where the draw loop will run before the preload is done and setup is called
    // it will run aproximately 50 ms after setup is called

    if (preloadDone) {
      if (!firstUpdate){
        setTimeout(() => {
          gameEngine.Update(p5.deltaTime);
          firstUpdate = true;
        }, 100);
        
      }

      else {
        gameEngine.Update(p5.deltaTime);
      }
    }
  };
}

//#endregion



//#region Engine Classes
class EngineAPI {
  constructor(engine){
    this.engine = engine;
    this.gameEngine = engine;
    this.p5 = engine.p5;
    this.gameConfig = engine.gameConfig;
  }
}

class Engine {
  constructor(p5){
    this.p5 = p5;
  }

  //#region P5js Callbacks (Preload, Setup, Draw)
  async Preload(){
    const gameConfig = await this.#loadGameConfigAsync();

    // Setup Objects
    this.prefabs = {};
    this.instantiatedObjects = {};
    this.#loadPrefabs(gameConfig); // gameConfig is loaded in loadGameConfigAsync

    this.engineAPI = new EngineAPI(this);

    this.renderer = new Renderer(this.engineAPI, gameConfig);
    this.inputSystem = new InputSystem(this.engineAPI, gameConfig);
    this.physicsSystem = new PhysicsSystem(this.engineAPI, gameConfig);
    this.scriptingSystem = new ScriptingSystem(this.engineAPI, gameConfig);
    this.audioSystem = new AudioSystem(this.engineAPI, gameConfig);
    this.particleSystem = new ParticleSystem(this.engineAPI, gameConfig);

    return Promise.all([
      this.inputSystem.Preload(),
      this.physicsSystem.Preload(),
      this.audioSystem.Preload(),
      this.particleSystem.Preload(),
      this.scriptingSystem.Preload(),
      this.renderer.Preload(),
      this.#loadGameConfigAsync()
    ]);
  }

  Start(){
    // Load Engine Modules
    this.inputSystem.Start();
    this.physicsSystem.Start();
    this.particleSystem.Start();
    this.scriptingSystem.Start();
    this.renderer.Start();
    this.audioSystem.Start();

    this.#loadScene("level1");
  }

  

  Update(dt){
    this.inputSystem.Update(dt);
    this.physicsSystem.Update(dt);
    
    for (const objName in this.instantiatedObjects){
      this.instantiatedObjects[objName].Update(dt);
    }

    this.scriptingSystem.Update(dt);
    this.audioSystem.Update(dt);
    this.particleSystem.Update(dt);
    this.renderer.Update(dt);
  }

  //#endregion


  //#region Private Methods
  #loadGameConfigAsync(){
    return new Promise((resolve, reject) => {
      this.p5.loadJSON("./gameConfig.json", (data) => {
        this.gameConfig = data;
        resolve(data);
      });
    });
  }

  #loadPrefabs(gameConfig){
    for (const prefabName in gameConfig.prefabs){
      const prefab = gameConfig.prefabs[prefabName];
      this.prefabs[prefabName] = prefab;
    }
  }

  async #loadScene(sceneName){
    const scene = this.gameConfig.scenes[sceneName];
    const cameraConfig = this.gameConfig.scenes[sceneName].cameraConfig;
    const cameraInstance = new Camera(this.engineAPI, cameraConfig);
    cameraInstance.Start();
    this.renderer.setCamera(cameraInstance);

    if (scene === undefined){
      console.error(`Scene ${sceneName} not found in gameConfig`);
      return;
    }

    for (const objName in scene.gameObjects){
      const obj = scene.gameObjects[objName];
      const objPrefab = this.prefabs[obj.prefab];

      if (objPrefab === undefined || objPrefab === null){
        console.error(`Prefab ${obj.prefab} not found in gameConfig prefabs`);
        continue;
      }

      let objToInstantiate = JSON.parse(JSON.stringify(objPrefab)); // deep clone the prefab
      for (const componentName in obj.overideComponents){
        objToInstantiate.components[componentName] = obj.overideComponents[componentName];
      }

      objToInstantiate.name = obj.name;
      objToInstantiate.parent = obj.parent;

      this.instantiatedObjects[obj.name] = await this.#instantiateSceneObject(objToInstantiate);
    }

    // Start all objects
    for (const objName in this.instantiatedObjects){
      this.instantiatedObjects[objName].Start();
    }
  }


  #instantiateSceneObject(obj){
    return new Promise((resolve, reject) => {
      const gameObjectInstance = new GameObjectInstance(this.engineAPI, obj);
    
      gameObjectInstance.Preload().then(() => {
        resolve(gameObjectInstance);
      });
    });
  }
  //#endregion
}

//#endregion



//#region Create P5js Game Instance
window.addEventListener("load", async () => {
  new p5(game);
});
//#endregion
