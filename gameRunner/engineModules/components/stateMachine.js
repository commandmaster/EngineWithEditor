import ComponentBase from './componentBase.js';
import { RendererAPI} from '../systems/renderer.js';

export default class StateMachine extends ComponentBase{
    constructor(engineAPI, componentConfig, gameObject) {
        super(engineAPI, componentConfig, gameObject);
    }

    Preload(){
        return new Promise((resolve, reject) => {
            this.animations = {};
            this.machineConfig = this.engineAPI.gameEngine.renderer.stateMachines[this.componentConfig.stateMachineName];
            for (const animationName in this.machineConfig.animations){
                const animation = this.machineConfig.animations[animationName];

                const sheet = this.engineAPI.gameEngine.renderer.animationsSheets[animation.name];
                const animConfig = this.engineAPI.gameEngine.renderer.animationConfigs[animation.name];

                this.animations[animation.name] = new Animation(this.engineAPI, this.gameObject, {
                    name:animConfig.name, 
                    type: animConfig.type, 
                    frameStartIndex: animConfig.frameStartIndex, 
                    frameEndIndex: animConfig.frameEndIndex, 
                    framesAcross: animConfig.framesAcross, 
                    framesDown: animConfig.framesDown, 
                    speed: animConfig.speed, 
                    size: animConfig.size, 
                    sheet
                });
            }

            resolve();
        });
    }

    Start(){
        for (const animation in this.animations){
            this.animations[animation].Start();
        }
    }

    Update(){
        for (const animation in this.animations){
            this.animations[animation].Update();
        }
    }

}

class Animation{
    constructor(engineAPI, gameObject, {name, type, frameStartIndex, frameEndIndex, framesAcross, framesDown, speed, size, sheet}){
        this.engineAPI = engineAPI;
        this.gameObject = gameObject;

        this.name = name;
        this.type = type;
        this.frameStartIndex = frameStartIndex;
        this.frameEndIndex = frameEndIndex;
        this.framesAcross = framesAcross;
        this.framesDown = framesDown;
        this.speed = speed;
        this.sheet = sheet;
        this.size = size;

        this.frames = [];
        this.#cutSheet();

        this.timeSinceLastFrameUpdate = 0;
        this.currentFrameIndex = 0;
    }

    #cutSheet(){
        this.frameWidth = this.sheet.width / this.framesAcross;
        this.frameHeight = this.sheet.height / this.framesDown;

        for (let i = this.frameStartIndex; i < this.frameEndIndex; i++){
            let j = Math.floor(i / this.framesAcross);
            this.frames.push({"img": this.sheet, "sWidth": this.frameWidth, "sHeight": this.frameHeight, "sx": ((i) % this.framesAcross) * this.frameWidth, "sy": j * this.frameHeight, "size": this.size})
        }
    }

    Start(){
        
    }

    Update(){
        // loop through frames
        this.timeSinceLastFrameUpdate += this.engineAPI.p5.deltaTime;

        if (this.timeSinceLastFrameUpdate >= 1000 / this.speed){
            this.timeSinceLastFrameUpdate = 0;
            this.currentFrameIndex++;

            if (this.currentFrameIndex >= this.frames.length){
                this.currentFrameIndex = 0;
            }
        }

        
        this.#sendRenderTask(this.frameStartIndex + this.currentFrameIndex % this.frames.length);
        
    }

    #sendRenderTask(frameIndex = 0){
        const img = this.frames[frameIndex].img;
        const dx = ScriptingAPI.getComponentFromGameObject(this.gameObject, "Transform").worldPosition.x;
        const dy = ScriptingAPI.getComponentFromGameObject(this.gameObject, "Transform").worldPosition.y;
        const dWidth = this.frames[frameIndex].sWidth*this.frames[frameIndex].size;
        const dHeight = this.frames[frameIndex].img.height*this.frames[frameIndex].size;
        const sx = this.frames[frameIndex].sx;
        const sy = this.frames[frameIndex].sy;
        const sWidth = this.frames[frameIndex].sWidth;
        const sHeight = this.frames[frameIndex].sHeight;
        const rotation = ScriptingAPI.getComponentFromGameObject(this.gameObject, "Transform").worldRotation;
    
        this.engineAPI.engine.renderer.addRenderTask(new RendererAPI.AnimationRenderTask(this.engineAPI, {img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight, rotation}));
    }
}
