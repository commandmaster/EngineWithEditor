



class GuiElement {
  constructor(p5){
    this.p5 = p5;
    this.datGui = new dat.GUI();
    this.Hide();
  }

  Show(){
    this.datGui.show();
  }

  Hide(){
    this.datGui.hide();
  }  
}

class Inspector extends GuiElement {
  #inspectorFolder;
  #selectedObject;

  constructor(p5){
    super(p5);
  }

  Show(){
    super.Show();
    this.#inspectorFolder = this.datGui.addFolder('Inspector');

    this.#inspectorFolder.open();

  }

  Hide(){
    super.Hide();

  }
}















//#region Imports
import Renderer from './editorModules/modules/renderer.js';
import ParticleSystem from './editorModules/modules/particleSystem.js';
import EditorSystem from './editorModules/modules/editorSystem.js';
import {GameObjectInstance, Camera}  from './editorModules/engineObjects.js';

//#endregion



//#region P5js Game Loop and Instance creation using the Engine
let preloadDone = false;
let firstUpdate = false
let game = function(p5){
  let gameEngine = new Engine(p5);

  window.electronAPI.on('reloadGameConfig', (e, config) => {
    localStorage.setItem('gameData', config);
    gameEngine.ReloadGameConfig();
  });


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
    this.gameConfig = gameConfig;

    // Setup Objects
    this.prefabs = {};
    this.instantiatedObjects = {};
    this.#loadPrefabs(gameConfig); // gameConfig is loaded in loadGameConfigAsync

    this.engineAPI = new EngineAPI(this);
    this.renderer = new Renderer(this.engineAPI, gameConfig);
    this.particleSystem = new ParticleSystem(this.engineAPI, gameConfig);
    this.editorSystem = new EditorSystem(this.engineAPI, gameConfig);

    return Promise.all([
      this.particleSystem.Preload(),
      this.renderer.Preload(),
      this.editorSystem.Preload(),
      this.#loadGameConfigAsync()
    ]);
  }

  Start(){
    // Load Engine Modules

    this.particleSystem.Start();
    this.renderer.Start();
    this.editorSystem.Start();

    const defaultScene = this.gameConfig.defaultScene;
    this.#loadScene(defaultScene);

    window.electronAPI.on('loadScene', (e, sceneName) => {
      this.#loadScene(sceneName);
      console.log('Scene Loaded', sceneName);
      
    });
  }

  

  Update(dt){   
    for (const objName in this.instantiatedObjects){
      this.instantiatedObjects[objName].Update(dt);
    }

    this.particleSystem.Update(dt);
    this.renderer.Update(dt);
    this.editorSystem.Update(dt);
  }

  ReloadGameConfig(){
    this.#loadGameConfigAsync().then((gameConfig) => {
      this.gameConfig = gameConfig;
      this.#loadPrefabs(gameConfig);
    });
  }

  //#endregion


  //#region Private Methods
  #loadGameConfigAsync(){
    return new Promise((resolve, reject) => {
      const gameData = localStorage.getItem('gameData');

      if (gameData === undefined || gameData === null){
        console.error('gameData not found in localStorage');
        reject('gameData not found in localStorage');
        return;
      }

      const gameConfig = JSON.parse(gameData);
      resolve(gameConfig);
      
    });
  }

  #loadPrefabs(gameConfig){
    this.prefabs = {};
    for (const prefabName in gameConfig.prefabs){
      const prefab = gameConfig.prefabs[prefabName];
      this.prefabs[prefabName] = prefab;
    }
  }

  async #loadScene(sceneName){
    this.currentSceneName = sceneName;

    // Reset all systems
    this.particleSystem.Reset();
    this.renderer.Reset();
    this.editorSystem.Reset();

    //Reset all objects
    this.instantiatedObjects = {};


    
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
window.electronAPI.on('projectLoaded', (e, projectData) => {
  console.log(projectData);

  const parsedData = JSON.parse(JSON.stringify(projectData));
  const gameData = JSON.parse(parsedData.gameConfigData);
  const folderPath = parsedData.folderPath;

  gameData.assets.assetsPath = folderPath + '/assets/';

  localStorage.setItem('gameData', JSON.stringify(gameData));
  localStorage.setItem('folderPath', folderPath);
  
  new p5(game);


  window.electronAPI.on('getGameData', (e) => {
    window.electronAPI.send('gameData', localStorage.getItem('gameData'));
  });

  window.electronAPI.on('setGameData', (e, gameData) => {
    if (gameData === undefined || gameData === null){
      return;
    }

    else if (typeof gameData === 'string'){
      localStorage.setItem('gameData', gameData);
    }

    else if (typeof gameData === 'object'){
      localStorage.setItem('gameData', JSON.stringify(gameData));
    }
    
    else {
      console.error('Invalid gameData type', typeof gameData);
    }
  });

  
 
});

//#endregion
