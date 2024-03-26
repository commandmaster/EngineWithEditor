import ComponentBase from "./componentBase.js";
import { RendererAPI } from "../systems/renderer.js";


class ParticleInstance{
    //#region Public Fields
    texture;
    color;
    position;
    localPosition;
    velocity;
    acceleration;
    rotation;
    angularVelocity;
    transparency;
    lifeRemaining;
    size;
    //#endregion

    constructor(engineAPI, particleObj){
        this.engineAPI = engineAPI;
        this.particleObj = particleObj;

        this.#initialize(particleObj);
    }

    //#region Particle Callbacks
    Start(){

    }

    Update(dt){
        // integrate velocity, acceleration, and position using semi implicit euler method (https://gafferongames.com/post/integration_basics/)
        this.velocity.x += this.acceleration.x * dt / 1000;
        this.velocity.y += this.acceleration.y * dt / 1000;

        this.localPosition.x += this.velocity.x * dt / 1000; 
        this.localPosition.y += this.velocity.y * dt / 1000;

        this.rotation += this.angularVelocity * dt / 1000;

        this.#render();
    }
    //#endregion

    //#region Private Methods
    #initialize(particleObj){
        this.texture = this.engineAPI.engine.renderer.textures[particleObj.textureName];
        this.color = particleObj.color;
        this.position = particleObj.position;
        this.velocity = particleObj.velocity;
        this.acceleration = particleObj.acceleration;
        this.rotation = particleObj.rotation;
        this.angularVelocity = particleObj.angularVelocity;
        this.transparency = particleObj.transparency;
        this.lifeRemaining = particleObj.lifeSpan;
        this.size = particleObj.size;
        this.localPosition = particleObj.localPosition;
    }

    #render(){
        const particleRenderTask = new RendererAPI.ParticleRenderTask(this.engineAPI, {texture: this.texture, color: this.color, position: this.position, rotation: this.rotation, transparency: this.transparency, size: this.size});
        this.engineAPI.engine.renderer.addRenderTask(particleRenderTask);
    }
    //#endregion

    //#region Public Methods
    forceDestroy(){
        this.lifeRemaining = 0;
    }
    //#endregion
}

class ParticleEmitterInstance{
    //#region Private Fields
    #particles = [];
    #enabled = false;
    #shouldFadeOut = false;
    #emitterConfig = {};
    #runtime = 0;
    #lastUpdateTime = performance.now();
    #systemInstance;
    #timeLastBurst = 0;
    #continousTimer = 0;

    // Attributes
    #lifeSpan;
    #position;
    #velocity;
    #acceleration;
    #rotation;
    #angularVelocity;
    #size;
    #textureName;
    #color;
    #transparency;
    #spawnDelay;
    #amountOfBursts;
    #burstCount;
    #burstInterval;   
    #continuousRate;
    #maxParticleCount;
    #spawnRadius;

    // Over Lifetime Behaviors
    #colorOverTimeData;
    #sizeOverTimeData;
    #transparencyOverTimeData;
    //#endregion




    constructor(engineAPI, emitterConfig, systemInstance){
        this.engineAPI = engineAPI;
        this.p5 = engineAPI.p5;
        this.#emitterConfig = emitterConfig;
        this.#systemInstance = systemInstance;
    }

    //#region Particle Emitter Callbacks
    Start(){
        this.Play();
    }

    Update(){
        if (!this.#enabled && !this.#shouldFadeOut) return;
        
        const dt = Math.min(performance.now() - this.#lastUpdateTime, 50); // Capping the delta time to 50ms to prevent unwanted behavior
        this.#runtime += dt;

        this.#updateParticles(dt);
        
        this.#lastUpdateTime = performance.now();
    }
    //#endregion

    //#region Private Methods
    #resetEmitter(){
        this.#particles = [];
        this.#runtime = 0;
        this.#lastUpdateTime = performance.now();
        this.#timeLastBurst = 0;
        this.#continousTimer = 0;
    }

    #initailizeAttributes(){
        // Start Atributes
        this.#lifeSpan = this.#emitterConfig.startAttributes.lifeSpan;
        this.#position = this.#emitterConfig.startAttributes.position;
        this.#velocity = this.#emitterConfig.startAttributes.velocity;
        this.#acceleration = this.#emitterConfig.startAttributes.acceleration;
        this.#rotation = this.#emitterConfig.startAttributes.rotation;
        this.#angularVelocity = this.#emitterConfig.startAttributes.angularVelocity;

        

        // Render Atributes
        this.#textureName = this.#emitterConfig.renderAttributes.textureName;
        this.#color = this.#emitterConfig.renderAttributes.color;
        this.#transparency = this.#emitterConfig.renderAttributes.transparency;

        // Behaviors
        this.#spawnDelay = this.#emitterConfig.spawnBehavior.spawnDelay;

        this.#amountOfBursts = this.#emitterConfig.spawnBehavior.amountOfBursts;
        this.#burstInterval = this.#emitterConfig.spawnBehavior.burstInterval;
        this.#timeLastBurst = this.#burstInterval;
        this.#burstCount = this.#emitterConfig.spawnBehavior.burstCount;

        this.#spawnRadius = this.#emitterConfig.spawnBehavior.spawnRadius;

        this.#continuousRate = this.#emitterConfig.spawnBehavior.continuousRate; // Particles per second
        this.#maxParticleCount = this.#emitterConfig.spawnBehavior.maxParticleCount;

        // Over Lifetime Attributes
        this.#colorOverTimeData = this.#emitterConfig.overLifetime.colorOverTimeData;
        this.#sizeOverTimeData = this.#emitterConfig.overLifetime.sizeOverTimeData;
        this.#transparencyOverTimeData = this.#emitterConfig.overLifetime.transparencyOverTimeData;
        

    }

    #updateParticles(dt){
        //#region Update Logic
        this.#timeLastBurst += dt;
        this.#continousTimer += dt;

        for (const particle of this.#particles){
            // Apply Lifetime Behaviors
            if (this.#colorOverTimeData.curve === "linear") particle.color = ScriptingAPI.lerpColor(this.#colorOverTimeData.color1, this.#colorOverTimeData.color2, 1 - (particle.lifeRemaining / this.#lifeSpan)); // custom color lerp function from scriptingAPI, colors must be in the form of {r: 0-255, g: 0-255, b: 0-255}
            if (this.#sizeOverTimeData.curve === "linear") particle.size = this.#applyLinearCurveOverTime(this.#sizeOverTimeData.size1, this.#sizeOverTimeData.size2, 1 - (particle.lifeRemaining / this.#lifeSpan));
            if (this.#transparencyOverTimeData.curve === "linear") particle.transparency = this.#applyLinearCurveOverTime(this.#transparencyOverTimeData.transparency1, this.#transparencyOverTimeData.transparency2, 1 - (particle.lifeRemaining / this.#lifeSpan));
            if (this.#sizeOverTimeData.curve === "linear") particle.size = this.#applyLinearCurveOverTime(this.#sizeOverTimeData.size1, this.#sizeOverTimeData.size2, 1 - (particle.lifeRemaining / this.#lifeSpan));

            if (this.#systemInstance.spawningSpace === "local"){
                particle.position = {x: particle.localPosition.x + this.#systemInstance.gameObject.components.Transform.worldPosition.x, y: particle.localPosition.y + this.#systemInstance.gameObject.components.Transform.worldPosition.y};
            }

            else if (this.#systemInstance.spawningSpace === "world"){
                particle.position = {x: particle.localPosition.x, y: particle.localPosition.y};
            }

            particle.lifeRemaining -= dt;
            particle.Update(dt);

            if (particle.lifeRemaining <= 0){
                this.#particles.splice(this.#particles.indexOf(particle), 1);
            }
        }
        //#endregion


        if (!this.#enabled) return;
        //#region Spawn Logic
        if (this.#runtime < this.#spawnDelay) return;
        

        //spawn particles in bursts
        if (this.#amountOfBursts > 0 && this.#timeLastBurst >= this.#burstInterval){
            
            for (let i = 0; i < this.#burstCount; i++){
                this.#spawnParticle();
            }

            this.#timeLastBurst = 0;

            this.#amountOfBursts--;
        }

        //spawn particles continuously
        const particlesToSpawn = Math.floor(this.#continousTimer / (1000 / this.#continuousRate))
        for (let i = 0; i < particlesToSpawn; i++){
            if (this.#particles.length >= this.#maxParticleCount) break;
            this.#spawnParticle();
        }

        this.#continousTimer -= particlesToSpawn * (1000 / this.#continuousRate);


        //#endregion
    }

    #applyLinearCurveOverTime(value1, value2, fraction){
        return value1 + (value2 - value1) * fraction;
    }

    #spawnParticle(){
        const generateVectorInRange = (vector1, vector2) => {
            const biggerX = vector1.x > vector2.x ? vector1.x : vector2.x;
            const smallerX = vector1.x < vector2.x ? vector1.x : vector2.x;
            const biggerY = vector1.y > vector2.y ? vector1.y : vector2.y;
            const smallerY = vector1.y < vector2.y ? vector1.y : vector2.y;
            
            return {x: this.p5.random(smallerX, biggerX), y: this.p5.random(smallerY, biggerY)};
        }

        const multiplyVector = (vector, scalar) => {
            return {x: vector.x * scalar, y: vector.y * scalar};
        }

        // This is really the offset from the parent objects world or local position depending on the spawning space configuration
        const randomPos = {x: this.#position.x, y: this.#position.y}
        randomPos.x += this.p5.random(-this.#spawnRadius, this.#spawnRadius);
        randomPos.y += this.p5.random(-this.#spawnRadius, this.#spawnRadius);

        // Even if the spawning space is local, the position is still offset by the parent objects world position
        // The only change is that the the random postion is now not going to be changed with the parent in the update loop while in world space
        // In local space the offset is still applied so the position is still relative to the parent object
        let position;
        let localPosition;
        if (this.#systemInstance.spawningSpace === "local"){
            position = {x: randomPos.x + this.#systemInstance.gameObject.components.Transform.worldPosition.x, y: randomPos.y + this.#systemInstance.gameObject.components.Transform.worldPosition.y};
            localPosition = {x: randomPos.x, y: randomPos.y};
        }

        else if (this.#systemInstance.spawningSpace === "world"){
            position = {x: randomPos.x + this.#systemInstance.gameObject.components.Transform.worldPosition.x, y: randomPos.y + this.#systemInstance.gameObject.components.Transform.worldPosition.y};
            localPosition = {x: randomPos.x + this.#systemInstance.gameObject.components.Transform.worldPosition.x, y: randomPos.y + this.#systemInstance.gameObject.components.Transform.worldPosition.y};
        }
        


        const randomVel = multiplyVector(generateVectorInRange({x:this.#velocity.x1, y:this.#velocity.y1}, {x:this.#velocity.x2, y:this.#velocity.y2}), this.#velocity.scalar);
        const randomAcc = multiplyVector(generateVectorInRange({x:this.#acceleration.x1, y:this.#acceleration.y1}, {x:this.#acceleration.x2, y:this.#acceleration.y2}), this.#acceleration.scalar);
        const randomRot = this.p5.random(this.#rotation.z1, this.#rotation.z2);
        const randomAngVel = this.p5.random(this.#angularVelocity.z1, this.#angularVelocity.z2);
        this.#particles.push(new ParticleInstance(this.engineAPI, {textureName: this.#textureName, color: this.#color, position, localPosition, velocity: randomVel, acceleration: randomAcc, rotation: randomRot, angularVelocity: randomAngVel, transparency: this.#transparency, lifeSpan: this.#lifeSpan, size: this.#sizeOverTimeData.size1}));
    }

    //#endregion

    //#region Public Methods
    Play(){
        this.#resetEmitter();
        this.#initailizeAttributes();
        this.#enabled = true;
    }

    Stop(shouldFadeOut = false){
        this.#shouldFadeOut = shouldFadeOut;
        this.#enabled = false;
    }
    //#endregion
}

class SystemOfEmitters{
    //#region Private Fields
    #emitters = {};
    #enabled = false;
    #systemConfig = {};
    //#endregion



    constructor(engineAPI, systemConfig, gameObject){
        this.engineAPI = engineAPI;
        this.gameObject = gameObject;
        this.#systemConfig = systemConfig;
        this.spawningSpace = systemConfig.spawningSpace;
    }

    //#region Particle System Callbacks
    Start(){
        this.Play();
    }

    Update(){
        for (const emitterName in this.#emitters){
            this.#emitters[emitterName].Update();
        }
    }
    //#endregion



    //#region Private Methods
    #InitializeEmitters(){ 
        this.#emitters = {};

        for (const emitterName in this.#systemConfig.emitters){
            const emitterConfig = this.#systemConfig.emitters[emitterName];
            this.#emitters[emitterName] = new ParticleEmitterInstance(this.engineAPI, emitterConfig, this);
            this.#emitters[emitterName].Start();
        }
    }
    //#endregion



    //#region Public Methods
    Play(){
        this.#InitializeEmitters();
        this.#enabled = true;
        for (const emitterName in this.#emitters){
            this.#emitters[emitterName].Play();
        }
    }

    Stop(shouldFadeOut = false){
        this.#enabled = false;
        for (const emitterName in this.#emitters){
            this.#emitters[emitterName].Stop(shouldFadeOut);
        }
    }
    //#endregion

    //#region Public Getters
    get config (){
        return this.#systemConfig;
    }

    get IsEnabled(){
        return this.#enabled;
    }
    //#endregion
}


export default class ParticleComponent extends ComponentBase{
    constructor(engineAPI, componentConfig, gameObject){
        super(engineAPI, componentConfig, gameObject);

        const systemConfig = this.engineAPI.engine.particleSystem.systemConfigs[this.componentConfig.name];
        this.systemInstance = new SystemOfEmitters(this.engineAPI, systemConfig, this.gameObject);
        this.engineAPI.engine.particleSystem.SpawnSystem(this.systemInstance);
    }



    Play(){
        this.systemInstance.Play();
    }

    Stop(shouldFadeOut = false){
        this.systemInstance.Stop(shouldFadeOut);
    }

    IsEnabled(){
        return this.systemInstance.IsEnabled;
    }
}
