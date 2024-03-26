const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel, funct) => {
      ipcRenderer.on(channel, funct);
    },

    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },

  })

  