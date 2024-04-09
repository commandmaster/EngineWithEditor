import { RendererAPI } from "../modules/renderer.js";
import ComponentBase from "./componentBase.js";

export default class Rigidbody extends ComponentBase {
    constructor(engineAPI, componentConfig, gameObject) {
        super(engineAPI, componentConfig, gameObject);
    }

    Preload(){
        return new Promise((resolve, reject) => {
            this.colliders = [];
            resolve();
        });
    }

    //#region Physics System Callbacks
    Start(){
        this.updateFromNewConfig(this.componentConfig);
    }

    updateFromNewConfig(newConfig){
        this.colliderConfigs = newConfig.colliders;

        this.colliders = [];

        const addColliderBodyToBody = (collider) => {

            if (collider.type === "rectangle" || collider.type === "box"){
                this.colliders.push(new BoxCollider(collider));
            }

            else if (collider.type === "circle"){
                this.colliders.push(new CircleCollider(collider));
            }

            
        }

        this.colliderConfigs.forEach(config => {
            addColliderBodyToBody(config);
        });
    }

    Update(shouldDebug=true){
        if (shouldDebug){
            this.#debugRender();
        }
    }

    //#endregion


    //#region Private Methods
    #debugRender(){
        for (const collider of this.colliders){
            let task;

            if (collider.type === "circle"){
            const { x, y } = this.gameObject.components.Transform.worldPosition;
            const { offsetX, offsetY } = collider.colliderConfig;
            const rot = this.gameObject.components.Transform.worldRotation;
            const degToRad = Math.PI / 180;
            const transformedX = x + offsetX * Math.cos(rot * degToRad) - offsetY * Math.sin(rot * degToRad);
            const transformedY = y + offsetX * Math.sin(rot * degToRad) + offsetY * Math.cos(rot * degToRad);
            // Create a CircleColliderRenderTask with the transformed position and rotation
            task = new RendererAPI.CircleColliderRenderTask(this.engineAPI, {x:transformedX, y:transformedY, radius: collider.colliderConfig.radius, rotation: rot});
            }

            else if (collider.type === "box"){
            const { x, y } = this.gameObject.components.Transform.worldPosition;
            const { offsetX, offsetY } = collider.colliderConfig;
            const rot = this.gameObject.components.Transform.worldRotation;
            const degToRad = Math.PI / 180;
            const transformedX = x + offsetX * Math.cos(rot * degToRad) - offsetY * Math.sin(rot * degToRad);
            const transformedY = y + offsetX * Math.sin(rot * degToRad) + offsetY * Math.cos(rot * degToRad);
            
            // Create a BoxColliderRenderTask with the transformed position, size, and rotation
            task = new RendererAPI.BoxColliderRenderTask(this.engineAPI, {x:transformedX, y:transformedY, width: collider.colliderConfig.width, height: collider.colliderConfig.height, rotation: rot});
            }

            // Add the render task to the renderer
            this.engineAPI.engine.renderer.addRenderTask(task);
        }
    }
    //#endregion

}


//#region Collider Container Classes

// class only used to store data in a more readable format
class CircleCollider{
    constructor(colliderConfig){
        this.type = "circle";
        this.colliderConfig = colliderConfig;

    }
}

// class only used to store data in amore readable format
class BoxCollider{
    constructor(colliderConfig){
        this.type = "box";
        this.colliderConfig = colliderConfig;
    }
}

//#endregion

