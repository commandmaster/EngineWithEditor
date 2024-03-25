import { RendererAPI } from "../systems/renderer.js";
import ComponentBase from "./componentBase.js";

export default class Rigidbody extends ComponentBase {
    constructor(engineAPI, componentConfig, gameObject) {
        super(engineAPI, componentConfig, gameObject);
    }

    //#region Physics System Callbacks
    Start(){
        // Set up Matter.js physics 'Composite' <- (collection of rigid bodies)
        this.colliderConfigs = this.componentConfig.colliders;
        
        const compound = [];
        this.colliders = [];

    

        const addColliderBodyToBody = (collider) => {
            let body;
            
            const xPos = collider.offsetX;
            const yPos = collider.offsetY;

            if (collider.type === "rectangle" || collider.type === "box"){
                body = Matter.Bodies.rectangle(
                    xPos, 
                    yPos, 
                    collider.width, 
                    collider.height, 
                    {isStatic: false}
                );

                this.colliders.push(new BoxCollider(body, collider));
            }

            else if (collider.type === "circle"){
                body = Matter.Bodies.circle(
                    xPos, 
                    yPos, 
                    collider.radius, 
                    {isStatic: false}
                );
                this.colliders.push(new CircleCollider(body, collider));
            }


            compound.push(body);
            
        }

        this.colliderConfigs.forEach(config => {
            addColliderBodyToBody(config);
        });

        this.bodies = compound;
        this.componentConfig.matterBodyConfig.parts = compound;
        this.composite = Matter.Body.create(this.componentConfig.matterBodyConfig);
        Matter.Body.setPosition(this.composite, {x:this.gameObject.components.Transform.localPosition.x, y:this.gameObject.components.Transform.localPosition.y});
        Matter.Body.setAngle(this.composite, this.gameObject.components.Transform.localRotation * Math.PI / 180);
        this.engineAPI.engine.physicsSystem.addRigidBody(this);
    }

    Update(shouldDebug=false){
        if (!this.composite) return; // if the composite is not yet created, return (this can happen when the physics system update runs before the start function)

        this.gameObject.components.Transform.localPosition.x = this.composite.position.x;
        this.gameObject.components.Transform.localPosition.y = this.composite.position.y;
        this.gameObject.components.Transform.localRotation = this.composite.angle * 180 / Math.PI;
    
        

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
                task = new RendererAPI.CircleColliderRenderTask(this.engineAPI, {x: collider.body.position.x, y: collider.body.position.y, radius: collider.body.circleRadius, rotation: this.composite.angle * 180 / Math.PI});
            }

            else if (collider.type === "box"){
                task = new RendererAPI.BoxColliderRenderTask(this.engineAPI, {x: collider.body.position.x, y: collider.body.position.y, width: collider.colliderConfig.width, height: collider.colliderConfig.height, rotation: this.composite.angle * 180 / Math.PI});
            }

            this.engineAPI.engine.renderer.addRenderTask(task);
        }
    }
    //#endregion


    //#region Public Methods for interacting with the Matter.js Body (https://brm.io/matter-js/docs/classes/Body.html)
    addForce(x, y){
        Matter.Body.applyForce(this.composite, {x: this.composite.position.x, y: this.composite.position.y}, {x, y});
    }

    setVelocity(x, y){
        Matter.Body.setVelocity(this.composite, {x, y});
    }

    setPosition(x, y){
        Matter.Body.setPosition(this.composite, {x, y});
    }

    translate(x, y){
        Matter.Body.translate(this.composite, {x, y});
    }

    setAngularVelocity(angularVel){
        Matter.Body.setAngularVelocity(this.composite, angularVel);
    }

    setAngle(angle){
        Matter.Body.setAngle(this.composite, angle * Math.PI / 180);
    }

    setAngleRadians(angle){
        Matter.Body.setAngle(this.composite, angle);
    }
    
    rotate(angle){
        Matter.Body.rotate(this.composite, angle * Math.PI / 180);
    }

    rotateRadians(angle){
        Matter.Body.rotate(this.composite, angle);
    }

    
    setStatic(isStatic){
        Matter.Body.setStatic(this.composite, isStatic);
    }

    setMass(mass){
        Matter.Body.setMass(this.composite, mass);
    }

    scale(scaleX, scaleY){
        Matter.Body.scale(this.composite, scaleX, scaleY);
    }
    //#endregion

    //#region Getters
    get position(){
        return this.composite.position;
    }

    get velocity(){
        return this.composite.velocity;
    }

    get angle(){
        return this.composite.angle;
    }

    get rotation(){
        return this.composite.angle;
    }

    get angularVelocity(){
        return this.composite.angularVelocity;
    }

    get mass(){
        return this.composite.mass;
    }

    get inertia(){
        return this.composite.inertia;
    }

    get bounds(){
        return this.composite.bounds;
    }

    get isStatic(){
        return this.composite.isStatic;
    }

    get acceleration(){
        return this.composite.acceleration;
    }

    //#endregion
}


//#region Collider Container Classes

// class only used to store data in a more readable format
class CircleCollider{
    constructor(matterBody, colliderConfig){
        this.type = "circle";
        this.body = matterBody;
        this.colliderConfig = colliderConfig;
    }
}

// class only used to store data in amore readable format
class BoxCollider{
    constructor(matterBody, colliderConfig){
        this.type = "box";
        this.body = matterBody;
        this.colliderConfig = colliderConfig;
    }
}

//#endregion

