import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopStorage', {
  isDesktop: true,
  readDataset: (userId, key) =>
    ipcRenderer.invoke('desktop-storage:read-dataset', { userId, key }),
  writeDataset: (userId, key, value) =>
    ipcRenderer.invoke('desktop-storage:write-dataset', { userId, key, value }),
  getRootPath: () => ipcRenderer.invoke('desktop-storage:get-root-path'),
});
