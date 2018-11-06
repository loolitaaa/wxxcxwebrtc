var webrtcroom = require('../../../utils/webrtcroom.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		roomName: '',
		roomList: [],
		userName: '',
		firstshow: true, // 第一次显示页面
		tapTime: '',
		tapJoinRoom: false
	},

	// 拉取房间列表
	getRoomList: function (callback) {
		var self = this;
		webrtcroom.getRoomList(0, 20, function (res) {
			var isRoomCreated = false;
			var targetRoom;
			console.log('拉取房间列表成功:', res);
			if (res.data && res.data.rooms) {
				self.setData({
					roomList: res.data.rooms
				});
                var rooms = self.data.roomList;
                if(rooms.length == 0){
                    self.create(function () {});
				} else {
                    for(var i=0;i<rooms.length;i++){
                        if(rooms[i].roomInfo == '111'){
                            isRoomCreated = true;
                            targetRoom = rooms[i];
                        }
                    }
                    if(isRoomCreated)self.goRoom(targetRoom)
				}
			}
		}, function (res) {});
	},

	// 创建房间，进入创建页面
	create: function () {
        var self = this;
        var nowTime = new Date();
        //roomName后三位为随机生成的整数
        var roomName = '111';
        var url = '../room/room?type=create&roomName=' + roomName + '&userName=' + self.data.userName;
        wx.redirectTo({
            url: url
        });
        wx.showToast({
            title: '进入房间',
            icon: 'success',
            duration: 1000
        })
        self.setData({ 'tapTime': nowTime });
	},

	// 进入webrtcroom页面
	goRoom: function (e) {

		var url = '../room/room?roomID=' + e.roomID + '&roomName=' + e.roomInfo + '&userName=' + this.data.userName + '&roomCreator=' + e.roomCreator;
		if (!this.data.tapJoinRoom) { // 如果没有点击进入房间
			this.data.tapJoinRoom = true;
			wx.navigateTo({
				url: url,
				complete: () => {
					this.data.tapJoinRoom = false; // 不管成功还是失败，重置tapJoinRoom
				}
			});
		}
		this.setData({
			'tapTime': nowTime
		});
	},

	compareVersion: function (v1, v2) {
		v1 = v1.split('.')
		v2 = v2.split('.')
		var len = Math.max(v1.length, v2.length)

		while (v1.length < len) {
			v1.push('0')
		}
		while (v2.length < len) {
			v2.push('0')
		}

		for (var i = 0; i < len; i++) {
			var num1 = parseInt(v1[i])
			var num2 = parseInt(v2[i])

			if (num1 > num2) {
				return 1
			} else if (num1 < num2) {
				return -1
			}
		}

		return 0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {
		var self = this;
		console.log(this.data);
		var systemInfo = wx.getSystemInfoSync();
		console.error('系统消息:', systemInfo);
		// if (self.compareVersion(systemInfo.version, '6.6.6') < 0) {
		// 	var pages = getCurrentPages();
		// 	if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/roomlist/roomlist')) {
		// 		wx.showModal({
		// 			title: '提示',
		// 			content: "当前微信版本不支持webrtc功能，请使用6.6.6以上的版本",
		// 			showCancel: false,
		// 			complete: function () {
		// 				pages = getCurrentPages();
		// 				if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/roomlist/roomlist')) {
		// 					wx.navigateBack({
		// 						delta: 1
		// 					});
		// 				}
		// 			}
		// 		});
		// 	}
		// }
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		console.log('roomlist onshow');
		var self = this;
		if(self.data.firstshow){
		    self.data.firstshow = false;
            self.getRoomList(function (){});
        } else{
		    wx.navigateTo({
                url : '../../main/main'
            })
        }

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {
		this.getRoomList(function () {});
		wx.stopPullDownRefresh();
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
			// path: '/pages/multiroom/roomlist/roomlist',
			path: '/pages/main/main',
			imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
		}
	}
})
/*
Page({

    data: {
        roomName:'',
        userName: '',
        tapTime: ''
    },
    // 进入rtcroom页面
    create: function() {
        var self = this;
        var nowTime = new Date();
        //roomName后三位为随机生成的整数
        var roomName = userName+Math.ceil(100+Math.random()*900);
        var url = '../room/room?type=create&roomName=' + roomName + '&userName=' + self.data.userName;
        wx.redirectTo({
            url: url
        });
        wx.showToast({
            title: '进入房间',
            icon: 'success',
            duration: 1000
        })
        self.setData({ 'tapTime': nowTime });
    },
})*/
