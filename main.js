const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const { exec } = require('child_process');
const { rimraf } = require('rimraf');
const prompt = require('electron-prompt');
const Database = require('@bennettf/simpledb'); // My custom js json manipulation npm package

const {dialog, app, BrowserWindow, Menu, shell, ipcMain,  nativeTheme, BrowserView} = electron;

let currentProject = {folderPath: null, projectName: null, gameConfigPath: null, gameConfigData: null};
let projectLoaded = false;
let edtiorLoaded = false;


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


app.on('ready', function(){

    nativeTheme.themeSource = 'dark';


    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'editor/index.html'),
        protocol:'file:',
        slashes: true
    }));

    mainWindow.webContents.on('did-finish-load', () => {
        edtiorLoaded = true;
    });


    mainWindow.on('closed', () => {
        app.quit();
    })

   async function createNewProject(){
        const projectDir = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        const folderPath = projectDir.filePaths[0];
        const projectName = path.basename(folderPath);

        

        fsExtra.copy(path.join(__dirname, '/templates/projectTemplate'), folderPath, async (err) => {
            if (err) throw err;

            // let config = await fs.promises.readFile(path.join(folderPath, 'gameConfig.json'), 'utf8')
            // config = JSON.parse(config);
            // config.assets.assetsPath = folderPath + '/assets/';
            // config = JSON.stringify(config);

            // await fs.promises.writeFile(path.join(folderPath, 'gameConfig.json'), config, 'utf8');


            loadProject(folderPath);
        });



        
    }

    async function loadProject(pathToFolder){
        const projectName = path.basename(pathToFolder);
        const gameConfigPath = path.join(pathToFolder, 'gameConfig.json');
        const gameConfigData = await fs.promises.readFile(gameConfigPath, 'utf8');

        currentProject = {folderPath: pathToFolder, projectName: projectName, gameConfigPath: gameConfigPath, gameConfigData: gameConfigData};
        projectLoaded = true;

        waitForCondition(edtiorLoaded).then(() => {
            mainWindow.webContents.send('projectLoaded', currentProject);
        });

        console.log("Project Loaded: " + currentProject.projectName);
    }
    
    const mainMenuTemplate = [
        {
            label:'Save',
            async click(){
                await saveProject();
            },
            accelerator: 'Ctrl+S'
        },
        {
            label:'File',
            submenu:[
                {
                    label: 'New Project',
                    click(){
                        createNewProject();
                    }
                },
                {
                    label: 'Load Project',
                    async click(){
                        const projectDir = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openDirectory']
                        });

                        loadProject(projectDir.filePaths[0]);
                    }
                },
                {
                    label: 'Quit',
                    click(){app.quit();}
                }
            ]
        },
        {
            label:'Start Game',
            async click(){
                if(projectLoaded){
                    saveProject().then(() => {
                        createGameWindow(currentProject);
                    });
                }

                else{
                    dialog.showErrorBox('Error', 'No project loaded');
                }
            }
        },
        {
            label:'Dev Tools',
            submenu:[
                {
                    label: 'Toggle Dev Tools',
                    click(item, focusedWindow){
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
            
        }
    ];



    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    Menu.setApplicationMenu(mainMenu);
});

function createGameWindow(currentProjectObj){
    const gameWindow = new BrowserWindow({
        webPreferences: {
            preload: path.resolve(currentProjectObj.folderPath, 'preload.js')
        }
    });

    gameWindow.loadURL(url.format({
        pathname: path.resolve(currentProjectObj.folderPath, 'index.html'),
        protocol:'file:',
        slashes: true
    }));

    const gameMenuTemplate = [
        {
            label:"Quit",
            click(){gameWindow.close();}
        },
        {
            label:"Restart",
            click(){
                gameWindow.reload();
            },
            role: 'reload'
        },
        {
            label:"Open Dev Tools",
            click(){
                gameWindow.toggleDevTools();
            }
        }
    ];

    const gameMenu = Menu.buildFromTemplate(gameMenuTemplate);

    gameWindow.setMenu(gameMenu);
    
}

function requestGameData(mainWindow){
    return new Promise((resolve, reject) => {
        mainWindow.webContents.send('getGameData');
        ipcMain.on('gameData', (e, gameData) => {
            resolve(gameData);
        });
    });
}

async function saveProject(){
    if (!projectLoaded) {
        dialog.showErrorBox('Error', 'No project loaded');
        return;
    }
    
    const gameData = await requestGameData(mainWindow);
    const parsedData = JSON.parse(gameData);

    await fs.promises.writeFile(currentProject.gameConfigPath, JSON.stringify(parsedData), 'utf8');
    currentProject.gameConfigData = JSON.stringify(parsedData);
}