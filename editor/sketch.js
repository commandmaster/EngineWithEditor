
let editor = function(p5){
  let editorEngine = new EditorEngine(p5);

  p5.setup = function(){
    window.electronAPI.on('projectLoaded', (e, projectData) => {
      const parsedData = JSON.parse(JSON.stringify(projectData));
      const gameData = JSON.parse(parsedData.gameConfigData);
      const folderPath = JSON.parse(parsedData.folderPath);

      p5.storeItem('gameData', gameData);
      p5.storeItem('folderPath', folderPath);

    });

    editorEngine.Start();
  };

  p5.draw = function(){
    editorEngine.Update(p5.deltaTime);
  };
}

class EditorEngine {
  constructor(p5){
    this.p5 = p5;
    
    
  }

  Start(){
    this.p5.createCanvas(800, 600);
    this.Inspector = new Inspector(this.p5);
    this.Inspector.Show();
    
    this.MenuBar = new MenuBar(this.p5);
    this.MenuBar.SaveButton.Onclick(() => {
      this.SaveProject();
    });
  }

  Update(deltaTime){
    this.p5.background(0);
  }

  SaveProject(){
    if (this.p5.getItem('gameData') === undefined || this.p5.getItem('gameData') === null) return;
    const gameData = this.p5.getItem('gameData');
    window.electronAPI.send('saveProject', JSON.stringify(gameData));
  }
}



class MenuBar {
  #saveButton;
  #createSceneButton;
  #prefabEditorButton;
  #createParticleSystem


  constructor(p5){
    this.p5 = p5;
    this.#saveButton = new MenuButton(this.p5, 'Save', 0, 0);
    this.#createSceneButton = new MenuButton(this.p5, 'Create Scene', this.#saveButton.positionX + this.#saveButton.sizeX, 0);
    this.#prefabEditorButton = new MenuButton(this.p5, 'Prefab Editor', this.#createSceneButton.positionX + this.#createSceneButton.sizeX, 0);
    this.#createParticleSystem = new MenuButton(this.p5, 'Create Particle System', this.#prefabEditorButton.positionX + this.#prefabEditorButton.sizeX, 0);
  }

  get SaveButton(){
    return this.#saveButton;
  }

  get CreateSceneButton(){
    return this.#createSceneButton;
  }

  get PrefabEditorButton(){
    return this.#prefabEditorButton;
  }

  get CreateParticleSystem(){
    return this.#createParticleSystem;
  }
}

class MenuButton {
  constructor(p5, text, positionX, positionY){
    this.p5 = p5;
    this.text = text;

    this.positionX = positionX;
    this.positionY = positionY;

    this.button = this.p5.createButton(this.text);



    this.button.style('width', 'fit-content');
    this.button.position(this.positionX, this.positionY);
    this.button.class('menuButton');

    this.sizeX = this.button.size().width;
    this.sizeY = this.button.size().height;
  }

  Onclick(callback){
    this.button.mousePressed(callback);
    console.log("button pressed");
  }
}


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


// window.addEventListener("load", () => {
//   let editorSketch = new p5(editor);
// });










































// 
// Bennett Friesen
// 
//
// Extra for Experts:



//#region Imports
import Renderer from './editorModules/modules/renderer.js';
import InputSystem from './editorModules/modules/inputSystem.js';
import PhysicsSystem from './editorModules/modules/physicsSystem.js';
import ScriptingSystem from './editorModules/modules/scriptingSystem.js';
import AudioSystem from './editorModules/modules/audioSystem.js';
import ParticleSystem from './editorModules/modules/particleSystem.js';

import {GameObjectInstance, Camera}  from './editorModules/engineObjects.js';
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
      if (e){
        console.error(e);
        reject(e);
      }


      
  
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
window.electronAPI.on('projectLoaded', (e, projectData) => {
  const parsedData = JSON.parse(JSON.stringify(projectData));
  const gameData = JSON.parse(parsedData.gameConfigData);
  const folderPath = JSON.parse(parsedData.folderPath);

  p5.storeItem('gameData', gameData);
  p5.storeItem('folderPath', folderPath);

  resolve(gameData);
});
window.addEventListener("load", async () => {
  new p5(game);
});
//#endregion
