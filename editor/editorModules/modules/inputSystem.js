import ModuleBase from './moduleBase.js';

export default class InputSystem extends ModuleBase{
    #inputs = {};

    constructor(engineAPI, gameConfig) {
        super(engineAPI, gameConfig);
    }

    //#region Engine Callbacks
    Preload(){
        return new Promise((resolve, reject) => {
            for (const input of this.gameConfig.assets.inputs){
                this.#createInputObject(this.engineAPI, input);
            }
            resolve();
        });
    }

    Update(){
        for (const input in this.#inputs){
            this.#inputs[input].Update();
        }
    }
    //#endregion

    //#region Private Methods
    #createInputObject(engineAPI, inputConfig){
        this.#inputs[inputConfig.inputName] = new Input(engineAPI, inputConfig);
    }
    //#endregion

    //#region Public Methods
    getInput(name){
        if (this.#inputs[name] === undefined){
            throw new Error(`Input ${name} does not exist`);
        }

        return this.#inputs[name].value;
    }

    getInputDown(name){
        if (this.#inputs[name] === undefined){
            throw new Error(`Input ${name} does not exist`);
        }

        return this.#inputs[name].keyDown;
    }

    getInputUp(name){
        if (this.#inputs[name] === undefined){
            throw new Error(`Input ${name} does not exist`);
        }

        return this.#inputs[name].keyUp;

    }
    //#endregion
}

class Input{
    //#region Private Fields
    #inputConfig;
    #inputName;
    #binds;
    #type;
    #actionType;
 
    #defaultValue;
    #keyAlreadyDown = false;
    #keyAlreadyUp = false;
    //#endregion

    //#region Public Fields
    value;
    keyDown = false;
    keyUp = false;
    keyIsPressed = false;
    //#endregion

    constructor(engineAPI, inputConfig){
        this.engineAPI = engineAPI;
        this.p5 = engineAPI.p5;

        this.#inputConfig = inputConfig;
        this.#inputName = inputConfig.inputName;
        this.#binds = inputConfig.binds;
        this.#type = inputConfig.type;
        this.#actionType = inputConfig.actionType;

        this.#defaultValue = this.#actionType === "axis" ? 0 : false; // Default value for axis is 0, for bool is false
        this.#mapKeyCodes();
    }

    Update(){
        let anyBindIsDown = false
        for (let i = 0; i < this.#binds.length; i++){
            if (this.p5.keyIsDown(this.#binds[i].key)){
                this.keyIsPressed = true;
                this.value = this.#binds[i].value;
                anyBindIsDown = true;

                if (!this.#keyAlreadyDown){
                    this.keyDown = true;
                    this.#keyAlreadyDown = true;
                }

                break;
            }
        }

        if (!anyBindIsDown){
            this.keyIsPressed = false;
            this.value = this.#defaultValue;
            if (!this.#keyAlreadyUp){
                this.keyUp = true;
                this.#keyAlreadyUp = true;
            }

            this.#keyAlreadyDown = false;
        }
    }

    //#region Private Methods
    #mapKeyCodes(){
        //#region Keycodes
        const keycodes = {
            "BACKSPACE": 8,
            "TAB": 9,
            "ENTER": 13,
            "SHIFT": 16,
            "CTRL": 17,
            "ALT": 18,
            "PAUSE": 19,
            "CAPS_LOCK": 20,
            "ESCAPE": 27,
            "SPACE": 32,
            "PAGE_UP": 33,
            "PAGE_DOWN": 34,
            "END": 35,
            "HOME": 36,
            "LEFT_ARROW": 37,
            "UP_ARROW": 38,
            "RIGHT_ARROW": 39,
            "DOWN_ARROW": 40,
            "INSERT": 45,
            "DELETE": 46,
            "0": 48,
            "1": 49,
            "2": 50,
            "3": 51,
            "4": 52,
            "5": 53,
            "6": 54,
            "7": 55,
            "8": 56,
            "9": 57,
            "A": 65,
            "B": 66,
            "C": 67,
            "D": 68,
            "E": 69,
            "F": 70,
            "G": 71,
            "H": 72,
            "I": 73,
            "J": 74,
            "K": 75,
            "L": 76,
            "M": 77,
            "N": 78,
            "O": 79,
            "P": 80,
            "Q": 81,
            "R": 82,
            "S": 83,
            "T": 84,
            "U": 85,
            "V": 86,
            "W": 87,
            "X": 88,
            "Y": 89,
            "Z": 90,
            "LEFT_WINDOW_KEY": 91,
            "RIGHT_WINDOW_KEY": 92,
            "SELECT_KEY": 93,
            "NUMPAD_0": 96,
            "NUMPAD_1": 97,
            "NUMPAD_2": 98,
            "NUMPAD_3": 99,
            "NUMPAD_4": 100,
            "NUMPAD_5": 101,
            "NUMPAD_6": 102,
        }
        //#endregion

         for (let i = 0; i < this.#binds.length; i++){
            if (typeof this.#binds[i].key === "string"){
                if (!(Object.keys(keycodes).includes(this.#binds[i].key.toUpperCase()))){
                    throw new Error(`Key ${this.#binds[i].key} is not a valid key`);
                }

                this.#binds[i].key = this.#binds[i].key.toUpperCase();
                this.#binds[i].key = this.#binds[i].key.replaceAll(" ", "");
                this.#binds[i].key = keycodes[this.#binds[i].key];
            }   
            
            else if (typeof this.#binds[i].key === "number"){
                if (!(Object.values(keycodes).includes(this.#binds[i].key))){
                    throw new Error(`Keycode ${this.#binds[i].key} is not a valid keycode`);
                }
            }
         }
    }
    //#endregion
}