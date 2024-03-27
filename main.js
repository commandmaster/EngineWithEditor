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

    ipcMain.on('saveProject', (e, projectData) => {
        if (!projectLoaded) return;
        
        projectData = JSON.parse(projectData);
        
        const gameConfigPath = path.join(currentProject.folderPath, 'gameConfig.json');
        const gameConfigData = JSON.stringify(projectData);

        console.log(gameConfigData);
        fs.writeFile(gameConfigPath, gameConfigData, (err) => {
            if (err) throw err;
        });
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

        fsExtra.copy(path.join(__dirname, '/templates/projectTemplate'), folderPath, (err) => {
            if (err) throw err;

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
            click(){
                if(projectLoaded){
                    createGameWindow(currentProject);
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