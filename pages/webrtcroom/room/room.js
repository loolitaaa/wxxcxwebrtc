var webrtcroom = require('../../../utils/webrtcroom.js')
var imHandler = require('./im_handler.js')
var webim = require('../../../utils/webim_wx');

const SHOWINTERACT_TYPE = {
    BOARD: 1, // 白板
    COMMENT: 2 // 聊天
}

const ROLE_TYPE = {
    AUDIENCE: 'audience', // 观众， 可以看到白板
    PRESENTER: 'presenter' // 主播， 没有白板，暂时不支持小程序端作为老师
}

Page({
    /**
     * 页面的初始数据
     */
    data: {
        webrtcroomComponent: null,
        roomID: '', // 房间id
        roomname: '', // 房间名称
        beauty: 0,
        muted: false,
        debug: false,
        frontCamera: true,
        role: ROLE_TYPE.AUDIENCE, // presenter 代表主播，audience 代表观众
        userID: '',
        userSig: '',
        sdkAppID: '',
        roomCreator: '',
        comment: [],
        toview: null,
        showInteractType: SHOWINTERACT_TYPE.COMMENT, // 标识不展示
        // 互动类型
        SHOWINTERACT_TYPE: SHOWINTERACT_TYPE,
        ROLE_TYPE: ROLE_TYPE,
        sketchpad: {
            width: 0,
            height: 0
        },
        isErrorModalShow: false,
        heartBeatFailCount: 0, //心跳失败次数
        autoplay: true,
        enableCamera: true,
        enableIM: false
    },

    /**
     * 监听房间事件
     */
    onRoomEvent: function (e) {
        var self = this;
        switch (e.detail.tag) {
            case 'error':
                if (this.data.isErrorModalShow) {
                    return;
                }
                if (e.detail.code === -10) { // 进房失败，一般为网络切换的过程中
                    this.data.isErrorModalShow = true;
                    wx.showModal({
                        title: '提示',
                        content: e.detail.detail,
                        confirmText: '重试',
                        cancelText: '退出',
                        success: function (res) {
                            self.data.isErrorModalShow = false
                            if (res.confirm) {
                                self.joinRoom();
                            } else if (res.cancel) { //
                                self.goBack();
                            }
                        }
                    });
                } else {
                    // 在房间内部才显示提示
                    console.error("error:", e.detail.detail);
                    var pages = getCurrentPages();
                    console.log(pages, pages.length, pages[pages.length - 1].__route__);
                    if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/room/room')) {
                        this.data.isErrorModalShow = true;
                        wx.showModal({
                            title: '提示',
                            content: e.detail.detail,
                            showCancel: false,
                            complete: function () {
                                self.data.isErrorModalShow = false
                                pages = getCurrentPages();
                                if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/room/room')) {
                                    wx.showToast({
                                        title: `code:${e.detail.code} content:${e.detail.detail}`
                                    });
                                    wx.navigateBack({
                                        delta: 1
                                    });
                                }
                            }
                        });
                    }
                }
                break;
        }
    },


    /**
     * 切换摄像头
     */
    changeCamera: function () {
        this.data.webrtcroomComponent.switchCamera();
        this.setData({
            frontCamera: !this.data.frontCamera
        })
    },

    /**
     * 设置美颜
     */
    setBeauty: function () {
        this.data.beauty = (this.data.beauty == 0 ? 5 : 0);
        this.setData({
            beauty: this.data.beauty
        });
    },

    /**
     * 切换是否静音
     */
    changeMute: function () {
        this.data.muted = !this.data.muted;
        this.setData({
            muted: this.data.muted
        });
    },

    /**
     * 是否显示日志
     */
    showLog: function () {
        this.data.debug = !this.data.debug;
        this.setData({
            debug: this.data.debug
        });
    },

    /**
     * 创建房间
     * 房间创建成功后，发送心跳包，并启动webrtc-room标签
     */
    createRoom: function () {
        var self = this;
        webrtcroom.createRoom(self.data.userID, this.data.roomname,
            function (res) {
                console.log('创建房间成功:', res);
                self.data.roomID = res.data.roomID;

                // 成功进房后发送心跳包
                self.sendHeartBeat(self.data.userID, self.data.roomID);

                // 设置webrtc-room标签中所需参数，并启动webrtc-room标签
                self.setData({
                    userID: self.data.userID,
                    userSig: self.data.userSig,
                    sdkAppID: self.data.sdkAppID,
                    roomID: self.data.roomID,
                    privateMapKey: res.data.privateMapKey
                }, function () {
                    self.data.webrtcroomComponent.start();
                })
            },
            function (res) {
                console.error('创建房间失败[' + res.errCode + ';' + res.errMsg + ']');
                self.onRoomEvent({
                    detail: {
                        tag: 'error',
                        code: -999,
                        detail: '创建房间失败[' + res.errCode + ';' + res.errMsg + ']'
                    }
                })
            });
    },

    /**
     * 进入房间， 包括进入IM和进入推流房间
     */
    enterRoom: function () {
        var self = this;
        webrtcroom.enterRoom(self.data.userID, self.data.roomID,
            function (res) {

                // 成功进房后发送心跳包
                self.sendHeartBeat(self.data.userID, self.data.roomID);

                // 设置webrtc-room标签中所需参数，并启动webrtc-room标签
                self.setData({
                    userID: self.data.userID,
                    userSig: self.data.userSig,
                    sdkAppID: self.data.sdkAppID,
                    roomID: self.data.roomID,
                    privateMapKey: res.data.privateMapKey
                }, function () {
                    self.data.webrtcroomComponent.start();
                })
            },
            function (res) {
                console.error(self.data.ERROR_CREATE_ROOM, '进入房间失败[' + res.errCode + ';' + res.errMsg + ']')
                self.onRoomEvent({
                    detail: {
                        tag: 'error',
                        code: -999,
                        detail: '进入房间失败[' + res.errCode + ';' + res.errMsg + ']'
                    }
                })
            });
    },

    /**
     * 发送心跳包
     */
    sendHeartBeat(userID, roomID) {
        var self = this;
        // 发送心跳
        webrtcroom.startHeartBeat(userID, roomID, function () {
            self.data.heartBeatFailCount = 0;
        }, function () {
            self.data.heartBeatFailCount++;
            // wx.navigateTo({
            //   url: '../roomlist/roomlist'
            // });
            // 2次心跳都超时，则认为真正超时了
            if (self.data.heartBeatFailCount > 2) {
                wx.hideToast();
                wx.showToast({
                    icon: 'none',
                    title: '连接超时，请重新进入房间',
                    complete: function () {
                        setTimeout(() => {
                            self.goBack();
                        }, 1000);
                    }
                });
            } else {
                wx.hideToast();
                wx.showToast({
                    icon: 'none',
                    title: '连接超时，正在重试...'
                });
            }
        });
    },

    /**
     * 返回上一页
     */
    goBack() {
        var url = '../../main/main';
        wx.navigateTo({
            url: url
        });

    },


    /**
     * 进入房间
     */
    joinRoom() {
        console.log('room.js onLoad');
        var time = new Date();
        time = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
        console.log('*************开始视频问诊：' + time + '**************');

        // webrtcComponent
        this.data.webrtcroomComponent = this.selectComponent('#webrtcroom');
        var self = this;
        wx.showToast({
            icon: 'none',
            title: '获取登录信息中'
        });
        webrtcroom.getLoginInfo(
            self.data.userID,
            function (res) {
                self.data.userID = res.data.userID;
                wx.setStorageSync('webrtc_room_userid', self.data.userID);

                self.data.sdkAppID = res.data.sdkAppID;
                self.data.userSig = res.data.userSig;

                if (!self.data.type) {
                    self.enterRoom();
                } else {
                    self.createRoom();
                }
                if (self.data.userID === self.data.roomCreator || !self.data.roomCreator) { // 如果创建房间是自己，则是主播
                    self.setData({
                        role: ROLE_TYPE.PRESENTER
                    });
                } else {
                    self.setData({
                        role: ROLE_TYPE.AUDIENCE
                    });
                }
            },
            function (res) {
                wx.showToast({
                    icon: 'none',
                    title: '获取登录信息失败，请重试',
                    complete: function () {
                        setTimeout(() => {
                            self.goBack();
                        }, 1500);
                    }
                });
            });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            userID: wx.getStorageSync('webrtc_room_userid'),
            type  : options.type||''
        });
        this.data.roomID = options.roomID || '';
        this.data.roomname = options.roomName;
        this.data.username = options.userName;
        this.setData({
            roomCreator: options.roomCreator || this.data.userID
        });
        this.joinRoom();
    },
    /**
     * 计算宽高
     */
    pixel: function ({
                         value,
                         unit
                     }, cb) {
        wx.getSystemInfo({
            success: function (res) {
                var vw = res.windowWidth;
                var vh = res.windowHeight;
                var resultPixelValue = 0;
                if (unit == 'px') {
                    resultPixelValue = value;
                } else if (unit == 'vw') {
                    resultPixelValue = value / 100 * vw;
                } else if (unit == 'vh') {
                    resultPixelValue = value / 100 * vh;
                } else {
                    console.log('支持单位：vw, vh');
                }
                console.log("{value: %d, unit: %s} ==> %d px", value, unit, resultPixelValue);
                cb(resultPixelValue);
            },
            fail: function () {
                console.log('获取系统信息失败');
                cb(0);
            }
        })
    },

    /**
     * 重置画面的宽高
     */
    resizeSketchpad() {
        var self = this;
        self.pixel({
            value: 100,
            unit: 'vh'
        }, function (res1) {
            self.pixel({
                value: 100,
                unit: 'vw'
            }, function (res2) {
                var fullHeight = res1;
                var fullWidth = res2;

                // 100vh - 100vw*9/16 - 100vw/3 - 1vh - 10vh - 5vh + 2vw/3
                var rHeight = fullHeight - fullWidth * 9 / 16 - fullWidth / 3 - fullHeight * 0.01 - fullHeight * 0.1 - fullHeight * 0.05 + fullWidth * 0.02 / 3;
                self.setData({
                    sketchpad: {
                        height: rHeight,
                        width: fullWidth,
                    }
                }, () => {
                    console.log("normal screen: h1 = %d, w1 = %d", rHeight, fullWidth);
                });
            });
        });
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        // 设置房间标题
        wx.setNavigationBarTitle({
            title: this.data.roomname
        });
        // 计算一次白板的宽高
        this.resizeSketchpad();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var self = this;
        console.log('room.js onShow');
        // 保持屏幕常亮
        wx.setKeepScreenOn({
            keepScreenOn: true
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        var self = this;
        console.log('room.js onHide');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        console.log('room.js onUnload');
        webrtcroom.quitRoom(this.data.userID, this.data.roomID);
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            // title: '',
            path: '/pages/main/main',
            imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
        }
    }
})