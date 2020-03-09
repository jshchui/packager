// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
// const {dialog} = require('electron').remote;
const path = require("path");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  // apparently enabling node integration is not advised, but since this is a controlled app and we have no users, it should be fine.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nativeWindowOpen: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // uncomment this to pass things to new window
  mainWindow.webContents.on(
    "new-window",
    (event, url, frameName, disposition, options, additionalFeatures) => {
      if (frameName === "modal") {
        // open window as modal
        console.log("modal hit");
        event.preventDefault();
        Object.assign(options, {
          modal: true,
          parent: mainWindow,
          width: 100,
          height: 100
        });
        event.newGuest = new BrowserWindow(options);
      }
    }
  );

  // mainWindow.openDevTools();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // let pathToBanners = dialog.showOpenDialog({
  //   properties: ['openDirectory']
  // }).then((info) => {
  //   console.log('info: ', info)
  //   mainWindow.webContents.send('store-data', info);
  // })
}

ipcMain.on("selectBannerPath", (event, arg) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"]
    })
    .then(path => {
      mainWindow.webContents.send("path-data", path);
    });
  console.log("ipc from window received");
  console.log("arg: ", arg);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
