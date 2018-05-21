/**
 * Created by lLei on 2018/5/21.
 */
var FlvNative = function (params) {
    this.videoDivId = params.videoDivId;
    this.url = "https://dev.teleus.cn/api/v2/masService/ebox/getPlayAddr/" + params.eboxSN;
    this.player = null;
}
FlvNative.prototype = {
    constructor: FlvNative,
    play: function () {
        var _this = this;
        this.masPush(null, function (ajaxPlayAddr) {
            _this.player = new flvPrivate(_this.videoDivId, _this.hostName);
            _this.player.loadVideo(ajaxPlayAddr, _this.reloadPlayAddrFun);
        });
    },
    stopPlay: function () {
        try {
            this.player.dispose();
        } catch (error) {
            console.error(error);
        }
    },
    reloadPlayAddrFun: function (callback) {
        this.masPush(null, function (ajaxPlayAddr) {
            callback(ajaxPlayAddr);
        });
    },
    masPush: function (renew, okCallback) {
        var _this = this;
        var errorCode;
        //÷ÿ ‘¥Œ ˝
        var pushRetryIndex = 0;
        pushRetryIndex++;
        var ajax = new XMLHttpRequest();
        ajax.open('post',_this.url);
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        ajax.send();
        ajax.onreadystatechange = function () {
            console.log(ajax)
            if (ajax.readyState==4&&ajax.status==200) {
                console.log(ajax.responseText);
                var data = JSON.parse(ajax.responseText);
                if (data.status == 1) {
                    pushRetryIndex = 0;
                    okCallback(data.data.playAddr);
                }else {
                    if (pushRetryIndex < 5) {
                        console.debug(data);
                        setTimeout(function () {
                            _this.masPush(renew, okCallback);
                        }, 500);
                    }else {
                        var dataStatus = data.status;
                        if (errorCode != dataStatus) {
                            errorCode = dataStatus;
                        }
                    }
                }
            }
        }

    }
}
var flvPrivate = function(videoDivId) {
    this.videoDivId = videoDivId;
    this.reloadPlayAddrFun = null;
    this.myPlayer = null;
}
flvPrivate.prototype = {
    loadVideo: function (playAddrParam, reloadPlayAddrParamFun) {
        var than = this;
        var playAddr;
        playAddr = new String(playAddrParam);
        playAddr = than.getFlvAddressFromRtmp(playAddr);
        this.reloadPlayAddrFun = reloadPlayAddrParamFun;
        than.innerLoadVideoJS(playAddr);
    },
    innerLoadVideoJS: function (playAddr) {
        var myPlayer = this.myPlayer = flvjs.createPlayer({
            type: 'flv',
            isLive: true,
            hasAudio: false,
            cors: true,
            duration: 0,
            url: playAddr
        });
        var videoElement = document.getElementById(this.videoDivId);
        myPlayer.attachMediaElement(videoElement);

        myPlayer.load();

    },
    getFlvAddressFromRtmp : function (address) {
        var httpProtocol = 'https';
        var flvPlayAddr = address.replace("rtmp",httpProtocol);
        flvPlayAddr = flvPlayAddr.replace(":11988","");
        flvPlayAddr = flvPlayAddr.replace("matv/","live?stream=");
        return flvPlayAddr;
    },
    dispose : function(){
        var player = this.myPlayer;
        if (typeof player !== "undefined") {
            if (player != null) {
                player.unload();
                player.detachMediaElement();
                player.destroy();
                player = null;
            }
        }
    }
}

export default FlvNative;