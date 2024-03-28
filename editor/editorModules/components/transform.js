import ComponentBase from "./componentBase.js";
import { RendererAPI } from "../modules/renderer.js";

export default class Transform extends ComponentBase {
   
    //#region Public Fields
    worldPosition;
    worldRotation;
    worldScale;

    localPosition;
    localRotation;
    localScale;
    //#endregion

    constructor(engineAPI, componentConfig, gameObject) {
        super(engineAPI, componentConfig, gameObject);

        this.localPosition = this.componentConfig.position;
        this.localRotation = this.componentConfig.rotation;
        this.localScale = this.componentConfig.scale;


        this.worldPosition = this.localPosition;
        this.worldRotation = this.localRotation;
        this.worldScale = this.localScale;
    }

    //#region Engine Callbacks
    Start() {
        if (this.gameObject.parent !== "world" && this.gameObject.parent !== undefined && this.gameObject.parent !== null) this.parentTransform = ScriptingAPI.getComponentByName(this.engineAPI, this.gameObject.parent, "Transform");
        this.#setWorldTransform();
    }

    Update() {
        this.#setWorldTransform();
        this.#updateStoredConfig();
    }
    //#endregion

    //#region Private Methods
    #setWorldTransform(){
       

        if (this.gameObject.parent === "world") {
            this.worldPosition = this.localPosition;
            this.worldRotation = this.localRotation;
            this.worldScale = this.localScale;

            this.parentTransform = null;
        }

        else if (this.gameObject.parent !== undefined && this.gameObject.parent !== null) {
            this.parentTransform = ScriptingAPI.getComponentByName(this.engineAPI, this.gameObject.parent, "Transform");

            const parentPosition = this.parentTransform.worldPosition;
            const parentRotation = this.parentTransform.worldRotation;
            const degToRad = Math.PI / 180;

            const x1 = parentPosition.x + this.localPosition.x;
            const y1 = parentPosition.y + this.localPosition.y;

            const rotatedX = (x1 - parentPosition.x) * Math.cos(parentRotation * degToRad) - (y1 - parentPosition.y) * Math.sin(parentRotation * degToRad) + parentPosition.x;
            const rotatedY = (x1 - parentPosition.x) * Math.sin(parentRotation * degToRad) + (y1 - parentPosition.y) * Math.cos(parentRotation * degToRad) + parentPosition.y;

            this.worldPosition = {x: rotatedX, y: rotatedY}

            this.worldRotation =  this.parentTransform.worldRotation + this.localRotation;
            this.worldScale = this.localScale;
        }

        else{
            const name = this.gameObject.gameObjectConfig.name;
            console.error("Parent transform not found for game object: " + name + ". Defaulting to world as the parent.");
            this.worldPosition = this.localPosition;
            this.worldRotation = this.localRotation;
            this.worldScale = this.localScale;
        }
    }

    #updateStoredConfig(){
        const storedConfig = JSON.parse(localStorage.getItem('gameData'));
        const name = this.gameObject.gameObjectConfig.name;


        let transform = storedConfig.scenes[this.engineAPI.engine.currentSceneName].gameObjects[name].overideComponents["Transform"];

        
            
        

        if (transform === undefined || transform === undefined) {
            transform = {}
        }

        transform.position = this.localPosition;
        transform.rotation = this.localRotation;
        transform.scale = this.localScale;
        storedConfig.scenes[this.engineAPI.engine.currentSceneName].gameObjects[name].overideComponents["Transform"] = transform;
        

        

        localStorage.setItem('gameData', JSON.stringify(storedConfig));
    }
    //#endregion

    //#region Public Methods
    SetLocalFromWorld(){
        
    }
    //#endregion

    //#region Getters and Setters
    get worldPosition() {
        return this.worldPosition;
    }

    get worldRotation() {
        return this.worldRotation;
    }

    get worldScale() {
        return this.worldScale;
    }
    //#endregion
}