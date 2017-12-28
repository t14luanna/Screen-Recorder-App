const {app, ipcMain, BrowserWindow, Menu, Tray} = require('electron')

let selectWindow
let mainWindow
let appIcon = null

if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

const init = () => {
  initMainWindow()
  initSelectWindow()
  appIcon = new Tray('logo.png')  
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Quit', type: 'normal'}
  ])

  contextMenu.items[0].click = function() {
    app.quit()
  }

  // Call this again for Linux because we modified the context menu
  appIcon.setContextMenu(contextMenu)
}

const initSelectWindow = () => {
  //Create 
  selectWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    show: false,
    height: 0,
    width: 0
  })

  selectWindow.loadURL('file://' + __dirname + '/src/view/selectWindow.html')
  selectWindow.hide()
}

const initMainWindow = () => {
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    width: 0,
    height: 0,
  })  

  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    let path = '/videos/'
    var d = new Date()    
    let filename = '' + d.getUTCDate() + d.getUTCMonth() + d.getFullYear() + '_' + d.getHours() + '' + d.getUTCMinutes() + '' + d.getUTCSeconds() + '.webm'
    item.setSavePath(path + filename)
    
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully')
      } else {
        console.log(`Download failed: ${state}`)
      }
    })
  })

  mainWindow.loadURL('file://' + __dirname + '/src/view/main.html')
  mainWindow.hide();
}

app.on('ready', () => {
  init();
})

ipcMain.on("selected-window",(event, id) => {
  selectWindow.close()
  mainWindow.webContents.send('getViewId',id)
})

ipcMain.on('exit',()=>{
  app.quit()
})

function handleSquirrelEvent(application) {
  if (process.argv.length === 1) {
      return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
      let spawnedProcess, error;

      try {
          spawnedProcess = ChildProcess.spawn(command, args, {
              detached: true
          });
      } catch (error) {}

      return spawnedProcess;
  };

  const spawnUpdate = function(args) {
      return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
          // Optionally do things such as:
          // - Add your .exe to the PATH
          // - Write to the registry for things like file associations and
          //   explorer context menus

          // Install desktop and start menu shortcuts
          spawnUpdate(['--createShortcut', exeName]);

          setTimeout(application.quit, 1000);
          return true;

      case '--squirrel-uninstall':
          // Undo anything you did in the --squirrel-install and
          // --squirrel-updated handlers

          // Remove desktop and start menu shortcuts
          spawnUpdate(['--removeShortcut', exeName]);

          setTimeout(application.quit, 1000);
          return true;

      case '--squirrel-obsolete':
          // This is called on the outgoing version of your app before
          // we update to the new version - it's the opposite of
          // --squirrel-updated

          application.quit();
          return true;
  }
};