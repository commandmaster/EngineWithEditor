
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
    
    this.MenuBar = new MenuBar(this.p5);
    this.MenuBar.SaveButton.Onclick(() => {
      this.SaveProject();
    });
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



class MenuBar {
  #saveButton;
  #createSceneButton;
  #prefabEditorButton;
  #createParticleSystem


  constructor(p5){
    this.p5 = p5;
    this.#saveButton = new MenuButton(this.p5, 'Save', 0, 0);
    this.#createSceneButton = new MenuButton(this.p5, 'Create Scene', this.#saveButton.positionX + this.#saveButton.sizeX, 0);
    this.#prefabEditorButton = new MenuButton(this.p5, 'Prefab Editor', this.#createSceneButton.positionX + this.#createSceneButton.sizeX, 0);
    this.#createParticleSystem = new MenuButton(this.p5, 'Create Particle System', this.#prefabEditorButton.positionX + this.#prefabEditorButton.sizeX, 0);
  }

  get SaveButton(){
    return this.#saveButton;
  }

  get CreateSceneButton(){
    return this.#createSceneButton;
  }

  get PrefabEditorButton(){
    return this.#prefabEditorButton;
  }

  get CreateParticleSystem(){
    return this.#createParticleSystem;
  }
}

class MenuButton {
  constructor(p5, text, positionX, positionY){
    this.p5 = p5;
    this.text = text;

    this.positionX = positionX;
    this.positionY = positionY;

    this.button = this.p5.createButton(this.text);



    this.button.style('width', 'fit-content');
    this.button.position(this.positionX, this.positionY);
    this.button.class('menuButton');

    this.sizeX = this.button.size().width;
    this.sizeY = this.button.size().height;
  }

  Onclick(callback){
    this.button.mousePressed(callback);
    console.log("button pressed");
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