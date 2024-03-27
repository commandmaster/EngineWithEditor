class MonoBehaviour {
    constructor(engineAPI, gameObject) {
        this.engineAPI = engineAPI;
        this.gameObject = gameObject;
        this.engine = engineAPI.gameEngine;
        this.p5 = engineAPI.gameEngine.p5;
    }

    Start(){

    }

    Update(){

    }

    getObjectByName(name){
        return this.engineAPI.gameEngine.instantiatedObjects[name];
    }

    getComponentByName(objectName, componentName){
        return this.engineAPI.gameEngine.instantiatedObjects[objectName].components[componentName];
    }

    getComponentFromGameObject(gameObject, componentName){
        return gameObject.components[componentName];
    }
}

function getObjectByName(engineAPI, name){
    return engineAPI.gameEngine.instantiatedObjects[name];
}

function getComponentByName(engineAPI, objectName, componentName){
    return engineAPI.gameEngine.instantiatedObjects[objectName].components[componentName];
}

function getComponentFromGameObject(gameObject, componentName){
    return gameObject.components[componentName];
}

function lerpColor(color1, color2, amount){
    const r = Math.floor(color1.r + (color2.r - color1.r) * amount);
    const g = Math.floor(color1.g + (color2.g - color1.g) * amount);
    const b = Math.floor(color1.b + (color2.b - color1.b) * amount);
    return {r, g, b};
}



function waitForCondition(condition, timeBetweenChecks = 50){
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (typeof condition !== "function" && typeof condition !== "boolean"){
                console.error("Condition must be a function (function should also return a boolean) or a boolean value.");
                reject("Condition must be a function or a boolean value.");
            }

            else if (typeof condition === "boolean"){
                if (condition){
                    clearInterval(interval);
                    resolve();
                }
            }

            else if (typeof condition === "function"){
                if (condition()){
                    clearInterval(interval);
                    resolve();
                }
            }
            
        }, timeBetweenChecks);
    });
}



class ScriptingAPI{
    //#region Classes
    static MonoBehaviour = MonoBehaviour;
    //#endregion

    //#region Functions
    static waitForCondition = waitForCondition;
    static getObjectByName = getObjectByName;
    static getComponentByName = getComponentByName;
    static getComponentFromGameObject = getComponentFromGameObject;
    static lerpColor = lerpColor;
    //#endregion
}
