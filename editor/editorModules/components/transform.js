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

    updateFromNewConfig(newConfig){
        this.SetLocalFromWorld(newConfig.position);
        this.SetLocalRotFromWorld(newConfig.rotation);
        this.localScale = newConfig.scale;

        this.#setWorldTransform();
    }

    generateComponentConfig(){
        return {
            position: this.worldPosition,
            rotation: this.worldRotation,
            scale: this.worldScale
        }
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
    SetLocalFromWorld(worldPosition){
        if (this.gameObject.parent === "world") {
            this.localPosition = worldPosition;
            return;
        }


        this.parentTransform = ScriptingAPI.getComponentByName(this.engineAPI, this.gameObject.parent, "Transform");
        const parentPosition = this.parentTransform.worldPosition;
        const parentRotation = this.parentTransform.worldRotation;

        const degToRad = Math.PI / 180;
        const theta = parentRotation * degToRad;

        const x1 = worldPosition.x - parentPosition.x;
        const y1 = worldPosition.y - parentPosition.y;

        const rotatedX = x1 * Math.cos(theta) + y1 * Math.sin(theta);
        const rotatedY = -x1 * Math.sin(theta) + y1 * Math.cos(theta);

        this.localPosition = {x: rotatedX, y: rotatedY};
        this.#setWorldTransform(); // update world transform based on new local position
    }

    SetLocalRotFromWorld(worldRotation){
        if (this.gameObject.parent === "world") {
            this.localRotation = worldRotation;
            return;
        }

        this.parentTransform = ScriptingAPI.getComponentByName(this.engineAPI, this.gameObject.parent, "Transform");
        this.localRotation = worldRotation - this.parentTransform.worldRotation;
        this.#setWorldTransform(); // update world transform based on new local rotation
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