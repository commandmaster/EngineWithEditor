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


app.on('ready', function(){

    nativeTheme.themeSource = 'dark';


    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'editor/preload.js')
          }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'editor/index.html'),
        protocol:'file:',
        slashes: true
    }));

    mainWindow.on('closed', () => {
        app.quit();
    })

   
    
    const mainMenuTemplate = [
        {
            label:'File',
            submenu:[
                {
                    label: 'New Project',
                    click(){

                    }
                },

                {
                    label: 'Save Project',
                    click(){}
                },

                {
                    label: 'Load Project',
                    click(){}
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
                const gameMenuTemplate = [
                    {
                        label:"Quit",
                        click(){app.quit();}
                    },
                    {
                        label:"Restart",
                        click(){
                            mainWindow.reload();
                        }
                    },
                    {
                        label:"Open Dev Tools",
                        click(){
                            mainWindow.toggleDevTools();
                        }
                    },
                    {
                        label:"Close Dev Tools",
                        click(){
                            mainWindow.closeDevTools();
                        }
                    }
                ];

                const gameMenu = Menu.buildFromTemplate(gameMenuTemplate);

                const startWindow = new BrowserWindow({
                    webPreferences: {
                        preload: path.join(__dirname, 'gameRunner/preload.js')
                    }

                });

                startWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'gameRunner/index.html'),
                    protocol:'file:',
                    slashes: true
                }));

                startWindow.setMenu(gameMenu);

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

