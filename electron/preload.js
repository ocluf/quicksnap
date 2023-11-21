const { contextBridge, ipcRenderer } = require("electron");

const api = {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  getWindows: () => ipcRenderer.invoke("getWindows"),
  hideWindow: () => ipcRenderer.send("hideWindow"),
  onReceiveMessage: (channel, callback) => {
    // Filtering the channel to those we want to allow to avoid security problems
    const validChannels = ["message-from-main"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  // You may also want to expose a function to unsubscribe from the event
  removeReceiveMessageListener: (channel, callback) => {
    const validChannels = ["message-from-main"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
  sendScreenshot: (imageDataUrl) =>
    ipcRenderer.send("sendScreenshot", imageDataUrl),
};

contextBridge.exposeInMainWorld("api", api);
