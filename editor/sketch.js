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
    console.log("Editor Started");
  }

  Update(deltaTime){
    this.p5.background(0);
    console.log("Editor Updated");
  }
}

window.addEventListener("load", () => {
  let editorSketch = new p5(editor);
});