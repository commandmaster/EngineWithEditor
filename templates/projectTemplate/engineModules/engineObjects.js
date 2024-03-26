import Transform from "./components/transform.js";
import Rigidbody from "./components/rigidbody.js";
import Script from "./components/script.js";
import StateMachine from "./components/stateMachine.js";
import ParticleComponent from "./components/particleComponent.js";



export class GameObjectInstance {
    constructor(engineAPI, gameObjectConfig) {
        this.engineAPI = engineAPI;
        this.gameObjectConfig = gameObjectConfig;

        this.gameEngine = engineAPI.gameEngine;
        this.p5 = engineAPI.gameEngine.p5;
        this.parent = gameObjectConfig.parent;
    }

    async Preload(){
        return new Promise(async (resolve, reject) => { 
            this.#initializeComponents();
            const preloadPromises = [];
            for (const componentName in this.components) {
                preloadPromises.push(this.components[componentName].Preload());
            }
            try {
                await Promise.all(preloadPromises);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    

    #initializeComponents(){
        this.components = {};
        for (const componentName in this.gameObjectConfig.components) {
            const componentConfig = this.gameObjectConfig.components[componentName];
            if (componentConfig === undefined || componentConfig === null){
                continue;
            }

            else{
                this.#addComponent(componentName, componentConfig);
            }

            
        }
    }

    #addComponent(componentName, componentConfig){
        if (componentName === "Transform"){
            this.components[componentName] = new Transform(this.engineAPI, componentConfig, this);
        }

        if (componentName === "Rigidbody"){
            this.components[componentName] = new Rigidbody(this.engineAPI, componentConfig, this);
        }

        if (componentName === "StateMachine"){
            this.components[componentName] = new StateMachine(this.engineAPI, componentConfig, this);
        }

        if (componentName === "ScriptingComponent"){
            this.components[componentName] = new Script(this.engineAPI, componentConfig, this);
        }

        if (componentName === "ParticleSystem"){
            this.components[componentName] = new ParticleComponent(this.engineAPI, componentConfig, this);
        }
    }

    Start(){
        for (const componentName in this.components) {
            this.components[componentName].Start();
        }
    }

    Update(){
        for (const componentName in this.components) {
            this.components[componentName].Update();
        }
    }
    
}

export class Camera{
    constructor(engineAPI, cameraConfig) {
        this.engineAPI = engineAPI;
        this.cameraConfig = cameraConfig;

        this.gameEngine = engineAPI.gameEngine;
        this.p5 = engineAPI.gameEngine.p5;

    }

    Start(){
        if (this.cameraConfig === undefined){
            console.error("Camera Config is missing");
            throw new Error("Camera Config is missing");
        }

        else {
            this.position = this.cameraConfig.startingPosition;
        }
    }

    Update(){
        // Compute Scalling

        // Transformation Matrix is saved in the renderer update method
        // That is why we don't need to push() or pop() here

        if (this.cameraConfig.willFollow){
            if (this.gameEngine.instantiatedObjects[this.cameraConfig.followSettings.objectToFollow] !== undefined){
                this.position = this.gameEngine.instantiatedObjects[this.cameraConfig.followSettings.objectToFollow].components["Transform"].worldPosition;
            } 
            
        }

        this.aspectRatio = this.p5.width / this.p5.height;
        this.scaleFactor = this.p5.width / this.cameraConfig.defaultViewAmount * this.cameraConfig.zoom;
        const screenWidth = this.p5.width
        const screenHeight = this.p5.height;

        // Center the camera around the middle of the screen at its position
        const cameraX = screenWidth / 2 - this.position.x * this.scaleFactor;
        const cameraY = screenHeight / 2 - this.position.y * this.scaleFactor;

        this.p5.translate(cameraX, cameraY);
        this.p5.scale(this.scaleFactor);

    }
}