// Modules to control application life and create native browser window
const { log } = require("console");
const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  desktopCapturer,
  screen,
  clipboard,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");

if (require("electron-squirrel-startup")) app.quit();

const isDevEnvironment = process.env.DEV_ENV === "true";

// enable live reload for electron in dev mode
if (isDevEnvironment) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "..", "node_modules", ".bin", "electron"),
    hardResetMethod: "exit",
  });
}

const settingsPath = path.join(__dirname, "settings.json");
let settings = getSettings();
let mainWindow;
let tray = null;

const createTray = () => {
  try {
    const iconPath = path.join(__dirname, "../public/logo2Template@4x.png");
    tray = new Tray(iconPath);

    // Function to build the context menu
    const buildContextMenu = () => {
      let startOnLoginLabel = settings.startOnStartup
        ? "Disable Start on Login"
        : "Enable Start on Login";

      return Menu.buildFromTemplate([
        {
          label: "Make screenshot",
          click: function () {
            mainWindow.show();
          },
        },
        {
          label: startOnLoginLabel,
          click: function () {
            settings.startOnStartup = !settings.startOnStartup;
            updateSettings(settings);
            updateStartupSettings();
            tray.setContextMenu(buildContextMenu());
          },
        },
        { type: "separator" }, // Divider
        {
          label: "Exit",
          click: function () {
            app.isQuitting = true;
            tray.destroy();
            app.quit();
          },
        },
      ]);
    };

    tray.setToolTip("Quicksnap");
    tray.setContextMenu(buildContextMenu());
  } catch (error) {
    console.error("Tray creation failed", error);
  }
};

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    width,
    height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    skipTaskbar: true,
  });

  const shortcutKey = settings.shortcutKey || "CmdOrCtrl+Shift+1";
  globalShortcut.register(shortcutKey, async () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      const windows = await getWindows();
      if (windows.length > 0) {
        mainWindow.webContents.send("message-from-main", windows);
        mainWindow.show();
      }
    }
  });

  // Unregister the global shortcut when the window is closed
  mainWindow.on("closed", () => {
    globalShortcut.unregister(shortcutKey);
    mainWindow = null;
  });

  ipcMain.on("hideWindow", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  mainWindow.on("close", function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  screen.on("display-metrics-changed", updateWindowSize);

  if (isDevEnvironment) {
    mainWindow.loadURL("http://localhost:5173/");
    mainWindow.webContents.on("did-frame-finish-load", () => {
      //mainWindow.webContents.openDevTools();
    });
    log("Electron running in dev mode: 🧪");
  } else {
    mainWindow.loadFile(path.join(__dirname, "build", "index.html"));
    log("Electron running in prod mode: 🚀");
  }
}

function updateWindowSize() {
  if (mainWindow) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ width, height });
  }
}

app.on("ready", handleReady);
app.on("before-quit", () => {
  app.isQuitting = true;
  if (mainWindow) {
    mainWindow.destroy();
  }
  ipcMain.removeAllListeners("sendScreenshot");
  ipcMain.removeAllListeners("getWindows");
});

async function handleReady() {
  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }

  ipcMain.on("sendScreenshot", (event, dataURL) => {
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
    const binaryData = Buffer.from(base64Data, "base64");
    clipboard.writeBuffer("public.png", binaryData);
  });
  ipcMain.handle("getWindows", getWindows);
  createTray();
  createMainWindow();
}

async function getWindows() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      fetchWindowIcons: true,
      thumbnailSize: { width: 500, height: 500 },
    });

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
    }));
  } catch (err) {
    console.error("Error fetching video sources:", err);
    return [];
  }
}

function updateStartupSettings() {
  const openAtLoginSettings = settings.startOnStartup || false;
  const systemloginSettings = app.getLoginItemSettings();
  if (systemloginSettings.openAtLogin != openAtLoginSettings) {
    app.setLoginItemSettings({
      openAtLogin: openAtLoginSettings,
      openAsHidden: process.platform === "darwin" ? true : false,
    });
  }
}

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (err) {
    return {};
  }
}

function updateSettings(settings) {
  fs.writeFile("settings.json", JSON.stringify(settings), (err) => {
    if (err) {
      console.error("Error updating settings:", err);
    }
  });
}
