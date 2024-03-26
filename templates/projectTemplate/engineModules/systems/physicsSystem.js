import ModuleBase from './moduleBase.js';
import { RendererAPI } from './renderer.js';

const Engine = Matter.Engine,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Render = Matter.Render


export default class PhysicsSystem extends ModuleBase{
    //#region Private Fields
    #lastPhysicsUpdate = performance.now();
    #timeStepLimit = 50; //Unit: ms, Prevents spiral of death and a bug when alt tabbing causes dt to be very large and the physics to break
    //#endregion

    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    Start() {
        this.matterEngine = Engine.create({gravity: {x: 0, y: 1}});
        this.matterWorld = this.matterEngine.world;
        
        this.debugMode = true;

        this.rigidBodies = [];
    }

    Update(dt) {
        const timeSinceLastUpdate = Math.min(performance.now() - this.#lastPhysicsUpdate, this.#timeStepLimit); // Prevents spiral of death and a bug when alt tabbing causes dt to be very large and the physics to break
        Engine.update(this.matterEngine, timeSinceLastUpdate);
        this.#lastPhysicsUpdate = performance.now();
        

        for (const body of this.rigidBodies){
            body.Update(this.debugMode);
        }
    }



    // called from within the rigidbody component
    addRigidBody(rigidBodyComponent){
        this.rigidBodies.push(rigidBodyComponent);
        Matter.World.add(this.matterWorld, rigidBodyComponent.composite);
    }

    debug(enable=true){
        this.debugMode = enable;
    }

    enableDebug(){
        this.debug(true);
    }

    disableDebug(){
        this.debug(false);
    }

    
}