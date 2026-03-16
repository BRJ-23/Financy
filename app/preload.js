const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  guardarMovimiento: (datos) => ipcRenderer.send('guardar-movimiento', datos),
  obtenerMovimientos: () => ipcRenderer.invoke('obtener-movimientos')
});