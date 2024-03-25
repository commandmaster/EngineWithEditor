let editor = function(p5){
  let editorEngine = new EditorEngine(p5);

  p5.setup = function(){
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
    this.#inspectorFolder.open();
  }

  Hide(){
    super.Hide();

  }


}

window.addEventListener("load", () => {
  let editorSketch = new p5(editor);
});