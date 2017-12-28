const {desktopCapturer, ipcRenderer} = require('electron')
let sources

window.onload = () => {

  let options = { types: ['screen']}

  desktopCapturer.getSources(options, (error, views) => {
    sources = views
    console.log(views)
    ipcRenderer.send('selected-window',views[0].id)
  })
}
