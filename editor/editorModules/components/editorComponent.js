import ComponentBase from "./componentBase.js";
import { RendererAPI } from "../modules/renderer.js";

export default class EditorComponent extends ComponentBase{
    constructor(editorAPI, gameObject) {
        super(editorAPI, null, gameObject);

    }

    Start(){
        this.showEditor = false;
        this.isDragging = false;

        window.addEventListener("mousedown", (e) => {
            if (e.button === 0){
                const clickedPos = this.engineAPI.engine.renderer.camera.ScreenToWorld({x: e.clientX, y: e.clientY});

                const clickedOnRadius = 80;
                const pos = this.gameObject.components.Transform.worldPosition;

                const isWithRadius = (pos, clickedPos, radius) => {
                    return Math.sqrt((pos.x - clickedPos.x) ** 2 + (pos.y - clickedPos.y) ** 2) < radius;
                }

                if (isWithRadius(pos, clickedPos, clickedOnRadius)){
                    this.showEditor = true;
                    this.isDragging = true;
                }

                else{
                    this.showEditor = false;
                }
            }
        });

        window.addEventListener("mouseup", (e) => {
            if (e.button === 0){
                this.isDragging = false;
            }
        }); 

    }

    Update(){
        if (!this.showEditor) return;
        this.#debugRender();

        if (this.isDragging){
            const pos = this.engineAPI.engine.renderer.camera.ScreenToWorld({x: this.p5.mouseX, y: this.p5.mouseY});

            this.gameObject.components.Transform.WorldToLocalPos(pos);

            
        }
    }

    #debugRender(){
        const pos = this.gameObject.components.Transform.worldPosition;
        const task = new RendererAPI.CustomRenderTask(this.engineAPI, (p5) => {
            const img = this.engineAPI.engine.renderer.editorTextures["movingArrow2"];

            const arrowOffsetsX = [0, -150, 0, 150];
            const arrowOffsetsY = [150, 0, -150, 0];

            for (let i = 0; i < 4; i++){
                p5.push();
                p5.translate(pos.x, pos.y);
                p5.translate(arrowOffsetsX[i], arrowOffsetsY[i]);
                p5.rotate(i * 90 - 90);
                
                p5.scale(0.03);
                p5.rotate(-180)
                p5.tint(255, 0, 0, 1000);
                p5.image(img, 0, 0);
                p5.pop();
            }
 
        });

        this.engineAPI.engine.renderer.addRenderTask(task);
    }
}