

export default class PlayerMovement extends ScriptingAPI.MonoBehaviour {
    constructor(engineAPI, gameObject) {
        super(engineAPI, gameObject);
    }

    Start() {
        this.simepleTimer = 0;
    }

    Update() {
        this.simepleTimer += this.engineAPI.p5.deltaTime;
        if (this.gameObject.components.ParticleSystem !== undefined) {
            if (this.simepleTimer > 2000 && this.simepleTimer < 6000) {
                this.gameObject.components.ParticleSystem.Stop(true);
                //console.log("Particle System Stop")
            }
            else if (this.simepleTimer > 6000){
                this.gameObject.components.ParticleSystem.Play();
                //console.log("Particle System Play")
                this.simepleTimer = 0;
            }


            
        }

        const MovementY = this.engineAPI.engine.inputSystem.getInput("MovementY");
        const MovementX = this.engineAPI.engine.inputSystem.getInput("MovementX");
        const rb = this.gameObject.components.Rigidbody;
        
        if (Math.abs(MovementY) > 0.1) {
            rb.translate(0, MovementY * -20);
            rb.setVelocity(rb.velocity.x, 0);
        }
        
        if (Math.abs(MovementX) > 0.1) {
            rb.translate(MovementX * 20, 0);
            rb.setVelocity(0, rb.velocity.y);
        }
        

        

        
        
    }
}

