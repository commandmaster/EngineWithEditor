import ModuleBase from './moduleBase.js';

export default class AudioSystem extends ModuleBase{
    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    Start(){
        // Temporary fix for audio context
        //
        const startContext = this.p5.createButton("Start Audio Context");
        startContext.position(this.p5.width, 0);
        startContext.mousePressed(() => {
            this.audioContext = new AudioContext();
        });
        //
        // End of temporary fix
    
        
    }
}