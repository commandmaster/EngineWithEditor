import ModuleBase from './moduleBase.js';


class RendererLoaders{
    constructor(p5){
        this.p5 = p5;
    }

    async preloadStateMachines(gameConfig){
        return new Promise(async (resolve, reject) => {
            try {
                const loadedMachines = {};
                const stateMachines = gameConfig.assets.stateMachines;
                const promises = [];

                for (const stateMachineName in stateMachines){
                    const stateMachine = stateMachines[stateMachineName];
                    const sm = await this.#loadJSONAsync(stateMachine.pathToStateMachineConfig);
                    loadedMachines[stateMachine.stateMachineName] = sm;
                }

                await Promise.all(promises);
                resolve(loadedMachines);
            } catch (err) {
                reject(err);
            }
        });
    }

    async preloadAnimConfigs(gameConfig){
        return new Promise(async (resolve, reject) => {
            try {
                const animations = {};
                const promises = []

                for (const animName in gameConfig.assets.animations){
                    const anim = gameConfig.assets.animations[animName];
                    const animConfig = await this.#loadJSONAsync(anim.pathToAnimationConfig);
                    animations[animName] = animConfig;
                }

                await Promise.all(promises);
                resolve(animations);
            } catch (err) {
                reject(err);
            }
        });
    }

    async preloadAnimSheets(gameConfig){
        return new Promise(async (resolve, reject) => {
            try {
                const animationsSheets = {};
                const animations = gameConfig.assets.animations;
                const promises = [];

                for (const animName in animations){
                    const anim = animations[animName];
                    const img = await this.#loadImageAsync(anim.pathToSpriteSheet);
                    animationsSheets[animName] = img;
                }

                await Promise.all(promises);
                resolve(animationsSheets);
            } catch (err) {
                reject(err);
            }
        });
    }

    async preloadTextures(gameConfig){
        return new Promise(async (resolve, reject) => {
            try {
                const textures = {};
                const promises = gameConfig.assets.textures.map(async (texture) => {
                    const img = await this.#loadImageAsync(texture.path);
                    textures[texture.name] = img;
                });

                await Promise.all(promises);
                resolve(textures);
            } catch (err) {
                reject(err);
            }
        });
    }

    //#region Private Methods
    #loadImageAsync(path){
        return new Promise((resolve, reject) => {
            this.p5.loadImage(path, (img) => {
                resolve(img);
            }, (err) => {
                reject(err);
            });
        });
    }

    #loadJSONAsync(path){
        return new Promise((resolve, reject) => {
            this.p5.loadJSON(path, (json) => {
                resolve(json);
            }, (err) => {
                reject(err);
            });
        });
    }
    //#endregion
    
}

class BaseRenderTask{
    constructor(engineAPI){
        this.engineAPI = engineAPI;
        this.p5 = engineAPI.p5;
        this.gameEngine = engineAPI.gameEngine;
    }

    render(){
        return;
    }
}

class AnimationRenderTask extends BaseRenderTask{
    constructor(engineAPI, {img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight, rotation}){
        super(engineAPI);
        this.img = img;
        this.dx = dx;
        this.dy = dy;
        this.dWidth = dWidth;
        this.dHeight = dHeight;
        this.sx = sx;
        this.sy = sy;
        this.sWidth = sWidth;
        this.sHeight = sHeight;      
        this.rotation = rotation;  
    }

    render(){
        this.p5.push();
        this.p5.translate(this.dx, this.dy);
        this.p5.rotate(this.rotation);
        this.p5.image(this.img, 0, 0, this.dWidth, this.dHeight, this.sx, this.sy, this.sWidth, this.sHeight);
        this.p5.pop();
    }
}

class BoxColliderRenderTask extends BaseRenderTask{
    constructor(engineAPI, {x, y, width, height, rotation}){
        super(engineAPI);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }

    render(){
        this.p5.push();
        this.p5.rectMode(this.engineAPI.p5.CENTER);
        this.p5.translate(this.x, this.y);
        this.p5.rotate(this.rotation);
        this.p5.noFill();
        this.p5.stroke(255);
        this.p5.strokeWeight(2);
        this.p5.rect(0, 0, this.width, this.height);
        this.p5.pop();
    }
}

class CircleColliderRenderTask extends BaseRenderTask{
    constructor(engineAPI, {x, y, radius, rotation}){
        super(engineAPI);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = rotation;
    }

    render(){
        this.p5.push();
        this.p5.translate(this.x, this.y);
        this.p5.rotate(this.rotation);
        this.p5.noFill();
        this.p5.stroke(255);
        this.p5.strokeWeight(2);
        this.p5.circle(0, 0, this.radius*2)
        this.p5.pop();
    }
}

class ParticleRenderTask extends BaseRenderTask{
    constructor(engineAPI, {texture, position, rotation, transparency, color, size}){
        super(engineAPI);
        this.x = position.x;
        this.y = position.y;
        this.texture = texture;
        this.rotation = rotation;
        this.transparency = transparency;
        this.color = color;
        this.size = size;
    }

    render(){
        this.p5.push();
        
        this.p5.translate(this.x, this.y);
        this.p5.rotate(this.rotation);
        this.p5.noFill();
        this.p5.noStroke();
        this.p5.imageMode(this.p5.CENTER);
        this.p5.scale(this.size, this.size);
        
        this.p5.tint(this.color.r, this.color.g, this.color.b, this.transparency);


        this.p5.image(this.texture, 0, 0);
        
        //this.p5.fill(this.p5.color(this.color.r, this.color.g, this.color.b, this.transparency));
        this.p5.circle(0, 0, 10);
        this.p5.pop();
    }
}

class CustomRenderTask extends BaseRenderTask{
    constructor(engineAPI, renderCallback){
        super(engineAPI);
        this.renderCallback = renderCallback;
    }

    render(){
        this.p5.push();
        
        this.p5.angleMode(this.p5.DEGREES);
        this.p5.rectMode(this.p5.CENTER);
        this.p5.imageMode(this.p5.CENTER);

        this.renderCallback(this.p5);
        this.p5.pop();
    }
}



export default class Renderer extends ModuleBase{
    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    Preload(){
        this.rendererLoaders = new RendererLoaders(this.p5);
        return new Promise(async (resolve, reject) => {
            try{
                this.stateMachines = await this.rendererLoaders.preloadStateMachines(this.gameConfig);
                this.animationConfigs = await this.rendererLoaders.preloadAnimConfigs(this.gameConfig);
                this.animationsSheets = await this.rendererLoaders.preloadAnimSheets(this.gameConfig);
                this.textures = await this.rendererLoaders.preloadTextures(this.gameConfig);

                this.renderQueue = []; // This will be used to store all the objects that need to be rendered this frame and will be reset every frame

                resolve();
            }
            catch(err){
                reject(err);
            }
        });
    }

    

    Start(){
        this.p5.createCanvas(this.gameConfig.renderSettings.canvasSizeX, this.gameConfig.renderSettings.canvasSizeY);

        this.enableCameraRendering = false;
    }

    Update(){
        this.#Render();

    }

    #Render(){
        this.p5.push();
        
        // P5 Draw Configuation
        this.p5.imageMode(this.p5.CENTER);
        this.p5.rectMode(this.p5.CENTER);
        this.p5.angleMode(this.p5.DEGREES);

        // Canvas Reszing
        if (this.p5.width !== this.p5.windowWidth || this.p5.height !== this.p5.windowHeight) this.p5.resizeCanvas(this.p5.windowWidth, this.p5.windowHeight);

        // Color the background
        this.p5.background(this.gameConfig.renderSettings.backgroundColor);

        if (this.enableCameraRendering){
            if (this.camera !== undefined && this.camera !== null){
                this.camera.Update();
            }   
        }

        for (const renderable of this.renderQueue){
            // could be a bunch of or statements but this is cleaner

            if (renderable instanceof AnimationRenderTask) renderable.render();

            if (renderable instanceof BoxColliderRenderTask) renderable.render();
            
            if (renderable instanceof CircleColliderRenderTask) renderable.render();

            if (renderable instanceof ParticleRenderTask) renderable.render();
            
            if (renderable instanceof CustomRenderTask) renderable.render();

        }

        this.renderQueue = [];
        this.p5.pop();
    }

    addRenderTask(renderable){
        this.renderQueue.push(renderable);
    }

    setCamera(cameraInstance){
        this.camera = cameraInstance;
        this.enableCameraRendering = true;
    }

    static RendererLoaders = RendererLoaders;
}


export class RendererAPI{
    static AnimationRenderTask = AnimationRenderTask;
    static BoxColliderRenderTask = BoxColliderRenderTask;
    static CircleColliderRenderTask = CircleColliderRenderTask;
    static ParticleRenderTask = ParticleRenderTask;
    static CustomRenderTask = CustomRenderTask;
}




