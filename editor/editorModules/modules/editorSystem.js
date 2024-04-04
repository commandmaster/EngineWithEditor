import ModuleBase from "./moduleBase.js";

export default class EditorSystem extends ModuleBase{
    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);

        this.editorComponents = []
        this.highlightedObject = null;
    }

    Preload() {
        return new Promise((resolve, reject) => { 
            resolve();
        });
    }

    Start() {
        return;
    }

    Update(dt) {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape'){
                if (this.highlightedObject){
                    this.highlightedObject.inspector.Hide();
                    this.highlightedObject = null;
                }
            }
        });
            
    }

    //#region 
    AddEditorObject(obj){
        this.editorComponents.push(obj);
    }

    HighlightObject(obj){
        this.highlightedObject = obj;
        this.highlightedObject.inspector.Show();
        
        for (const obj of this.editorComponents){
            if (obj !== this.highlightedObject){
                obj.showEditor = false;
                obj.inspector.Hide();
            }
        }
    }
    //#endregion
    
}