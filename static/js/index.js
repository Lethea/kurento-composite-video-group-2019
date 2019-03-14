var ws = new WebSocket('wss://' + location.host + '/call');
var video;
var webRtcPeer;

window.onload = function () {
    video = document.getElementById('video');
}

window.onbeforeunload = function () {
    ws.close();
}
var candidates = [];
ws.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {
        case 'response':
            response(parsedMessage);
            break;
        case 'stopCommunication':
            dispose();
            break;
        case 'onIceCandidate':
            console.log("hahaha");
            if(webRtcPeer.peerConnection){
                webRtcPeer.addIceCandidate(parsedMessage.candidate, function(err){
                    console.log("err----------------------->",err)
                });
            }else {
                candidates.push(parsedMessage.candidate);
            }
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
}

function response(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.info('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function onicecandidate(candidate) {
    var message = {
        id: 'candidate',
        candidate: candidate
    };
    sendMessage(message);
}

function start() {
    if (!webRtcPeer) {
        showSpinner(video);

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv({
            mediaConstraints: {
                audio: true,
                video: true,
            },
            remoteVideo: video,
            onicecandidate: onicecandidate,

        }, function (error) {
            if (!error) {
                this.generateOffer(function (error, offerSdp) {
                    console.log("Candidate", candidates);
                    if(webRtcPeer.peerConnection){
                        console.log("Webrtc Peer Var");

                        for(var i=0;i<candidates.length;i++){
                            webRtcPeer.addIceCandidate(candidates[i]);
                        }
                        candidates=[];
                    }

                    var message = {
                        id: 'client',
                        sdpOffer: offerSdp
                    };
                    sendMessage(message);
                });
            }
        });
    }
}

function stop() {
    var message = {
        id: 'stop'
    }
    sendMessage(message);
    dispose();
}

function dispose() {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
    hideSpinner(video);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}
