const {desktopCapturer, ipcRenderer} = require('electron')
let recorder
let localStream
let recordedChunks = []
let numRecordedChunks = 0
let localId
let recording
let recordingId = null
let localViews

window.onload = function(){
    setInterval(function(){
        let options = { types: ['window']}
        desktopCapturer.getSources(options, (error, views) => {
            let count = 0
            let id = []
            views.forEach(item => {
                if(item.name.indexOf('newway.com') > -1){
                    count++                    
                    id.push(item.id)
                }
            })
            if(recordingId != null && id.indexOf(recordingId) == -1){
                stopRecord()
                recording = false
                recordingId = null
            }
            else if(count > 0 &&!recording){
                recording = true
                recordingId = id[id.length-1]
                startRecord()
            } else if(count == 0 && recording) {
                stopRecord()
                recording = false
            }
        })
    }, 5000)
}

ipcRenderer.on('getViewId', (event,id) => {
    console.log(id)
    if (!id) {
        console.log('Access rejected.')
        return
    }
    localId = id
})

const loadWindow = (id) => {
    if (!id) {
        console.log('Access rejected.')
        return
    }
    console.log('Window ID: ', id)
    navigator.webkitGetUserMedia({
        audio: false,
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id,
        maxWidth: window.screen.width, maxHeight: window.screen.height, maxFrameRate: 60 } }
    }, getMediaStream, getUserMediaError)
}

const getUserMediaError = () => {
    console.log('getUserMedia() failed.')
}

const recorderOnDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data)
      numRecordedChunks += event.data.byteLength
    }
}

const getMediaStream = (stream) => {
    localStream = stream

    let videoTracks = localStream.getVideoTracks()

    try {
        console.log('Start recording the stream.')
        let options = {mimeType: 'audio/webm'}
        recorder = new MediaRecorder(stream,options)
        console.log(recorder)
    } catch (e) {
        console.assert(false, 'Exception while creating MediaRecorder: ' + e)
        return
    }

    recorder.ondataavailable = recorderOnDataAvailable
    recorder.onstop = () => { download() }
    recorder.start()
}

const startRecord = () => {
    loadWindow(localId)
}

const stopRecord = () => {
    recorder.stop()
    localStream.getVideoTracks()[0].stop()
    console.log('stopped record')
}

const resumeRecord = () => {
    recorder.resume()
}

const pauseRecord = () => {
    recorder.pause()
    console.log('paused record')
}

const download = () => {
    let blob = new Blob(recordedChunks, {type: 'video/webm'})
    recordedChunks = []
    let url = URL.createObjectURL(blob)
    let a = document.createElement('a')
    a.style = 'display: none'
    a.href = url
    a.download = 'a.webm'
    a.click()
}

const publish = () => {

}

const exit = () => {
    ipcRenderer.send('exit')
}