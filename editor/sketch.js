
let editor = function(p5){
  let editorEngine = new EditorEngine(p5);

  p5.setup = function(){
    window.electronAPI.on('projectLoaded', (e, projectData) => {
      const parsedData = JSON.parse(JSON.stringify(projectData));
      const gameData = JSON.parse(parsedData.gameConfigData);
      p5.storeItem('gameData', gameData);

    });

    editorEngine.Start();
  };

  p5.draw = function(){
    editorEngine.Update(p5.deltaTime);
  };
}

class EditorEngine {
  constructor(p5){
    this.p5 = p5;
    
    
  }

  Start(){
    this.p5.createCanvas(800, 600);
    this.Inspector = new Inspector(this.p5);
    this.Inspector.Show();
   
  }

  Update(deltaTime){
    this.p5.background(0);
  }

  SaveProject(){
    if (this.p5.getItem('gameData') === undefined || this.p5.getItem('gameData') === null) return;
    const gameData = this.p5.getItem('gameData');
    window.electronAPI.send('saveProject', JSON.stringify(gameData));
  }
}

class GuiElement {
  constructor(p5){
    this.p5 = p5;
    this.datGui = new dat.GUI();
    this.Hide();
  }

  Show(){
    this.datGui.show();
  }

  Hide(){
    this.datGui.hide();
  }  
}

class Inspector extends GuiElement {
  #inspectorFolder;
  #selectedObject;

  constructor(p5){
    super(p5);
  }

  Show(){
    super.Show();
    this.#inspectorFolder = this.datGui.addFolder('Inspector');

    const saveButton = { Save:function(){ console.log("saved") }};
    this.datGui.add(saveButton,'Save');

    this.#inspectorFolder.open();

  }

  Hide(){
    super.Hide();

  }


}

window.addEventListener("load", () => {
  let editorSketch = new p5(editor);
});