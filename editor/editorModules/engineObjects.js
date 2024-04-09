import Transform from "./components/transform.js";
import Rigidbody from "./components/rigidBody.js";
import StateMachine from "./components/stateMachine.js";
import ParticleComponent from "./components/particleComponent.js";
import EditorComponent from "./components/editorComponent.js";


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
        this.components["EditorComponent"] = new EditorComponent(this.engineAPI, this);

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
    
    Reset(){
        this.components = {};
    }

    createComponentFromDefault(componentName){
        const defaults = {
            "Transform": {
                "position": {x: 0, y: 0},
                "rotation": 0,
                "scale": {x: 1, y: 1}
            },
            "Rigidbody": {
                "colliders": []
            },
            "StateMachine": {
                "stateMachineName": "Insert State Machine Name Here"
            },
            "ParticleSystem": {
                "particleSystemName": "Insert Particle System Name Here"
            }
        }

        const componentConfig = defaults[componentName];
        this.#addComponent(componentName, componentConfig);
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

        this.zoom = this.cameraConfig.zoom;

        let zoomAmount = 0.14;
        window.addEventListener("wheel", (event) => {
            if (event.deltaY > 0){
                this.zoom -= zoomAmount;
            }

            else{
                this.zoom += zoomAmount;
            }

            const maxZoom = 4;
            const minZoom = 0.1;
            this.zoom = this.p5.constrain(this.zoom, minZoom, maxZoom);
        });

        window.addEventListener("keydown", (event) => {
            const cameraMoveSpeed = 12;
            if (event.key === "w" || event.key === "ArrowUp"){
                this.position.y -= 1 * cameraMoveSpeed;
            }

            if (event.key === "s" || event.key === "ArrowDown"){
                this.position.y += 1 * cameraMoveSpeed;
            }

            if (event.key === "a" || event.key === "ArrowLeft"){
                this.position.x -= 1 * cameraMoveSpeed;
            }

            if (event.key === "d" || event.key === "ArrowRight"){
                this.position.x += 1 * cameraMoveSpeed;
            }

            if (event.ctrlKey && (event.key === "ArrowUp" || event.key === "w")){
                this.zoom += zoomAmount;
            }

            if (event.ctrlKey && (event.key === "ArrowDown" || event.key === "s")){
                this.zoom -= zoomAmount;
            }

            const maxZoom = 4;
            const minZoom = 0.1;
            this.zoom = this.p5.constrain(this.zoom, minZoom, maxZoom);
        });

        

        this.mouseDown = false;
        window.addEventListener("mousedown", (event) => {
            if (event.button === 2){
                this.mouseDown = true;
                this.p5.requestPointerLock();
            }
            
        });

        window.addEventListener("mouseup", (event) => {
            if (event.button === 2){
                this.mouseDown = false;
                this.p5.exitPointerLock()
            }
            
        });
    }

    Update(){
        // Compute Scalling

        // Transformation Matrix is saved in the renderer update method
        // That is why we don't need to push() or pop() here

        if (this.mouseDown){
            const sensitivity = 1.7;
            this.position.x += -this.p5.movedX * sensitivity * 1/this.zoom;
            this.position.y += -this.p5.movedY * sensitivity * 1/this.zoom;
        }

        this.aspectRatio = this.p5.width / this.p5.height;
        this.scaleFactor = this.p5.width / this.cameraConfig.defaultViewAmount * this.zoom;
        const screenWidth = this.p5.width
        const screenHeight = this.p5.height;

        // Center the camera around the middle of the screen at its position
        const cameraX = screenWidth / 2 - this.position.x * this.scaleFactor;
        const cameraY = screenHeight / 2 - this.position.y * this.scaleFactor;

        this.p5.translate(cameraX, cameraY);
        this.p5.scale(this.scaleFactor);

    }

    ScreenToWorld(screenPos){
        const worldPos = {x: (screenPos.x - this.p5.width / 2) / this.scaleFactor + this.position.x, y: (screenPos.y - this.p5.height / 2) / this.scaleFactor + this.position.y};
        return worldPos;
    }
}