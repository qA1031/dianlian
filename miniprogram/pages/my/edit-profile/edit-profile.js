// pages/my/edit-profile/edit-profile.js
Page({

  data: {
    nickName: '', // 用户昵称
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', // 用户头像，默认头像
    loading: false,
  },

  onLoad: function (options) {
    this._loadUserInfo(); // 页面加载时读取用户信息
  },

  onShow: function () {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({ themeClass: theme, isDarkMode: app.globalData.isDarkMode });
  },

  // 读取用户信息
  _loadUserInfo: async function () {
    wx.showLoading({
      title: '加载中...'
    });
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo', // 这里复用 updateUserInfo 云函数来读取
        data: {},
        // openid 会在云函数中自动获取
      });
      wx.hideLoading();
      console.log('从云函数读取用户资料结果:', res.result);
      if (res.result.code === 0 && res.result.data) {
        // 如果用户已存在，且返回了数据
        const userData = res.result.data;
        this.setData({
          nickName: userData.nickName || '',
          avatarUrl: userData.avatarUrl || this.data.avatarUrl,
        });
        console.log('页面已绑定用户资料:', this.data.nickName, this.data.avatarUrl);
      } else {
        // 用户可能不存在或云函数返回空数据，保持默认值
        console.log('未找到用户资料或返回数据为空，保持默认值');
      }
    } catch (err) {
      wx.hideLoading();
      console.error('读取用户资料失败', err);
      wx.showToast({
        title: '加载用户资料失败',
        icon: 'none'
      });
    }
  },

  // 选择并上传头像
  chooseAvatar: function () {
    wx.chooseImage({
      count: 1, // 只能选择一张图片
      sizeType: ['compressed'], // 压缩图
      sourceType: ['album', 'camera'], // 从相册或相机选择
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        console.log('选择图片成功，临时路径:', tempFilePath);
        this.setData({ loading: true });
        wx.showLoading({
          title: '上传中...'
        });
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`, // 云存储路径
            filePath: tempFilePath,
          });
          console.log('头像上传成功，fileID:', uploadRes.fileID);
          this.setData({
            avatarUrl: uploadRes.fileID, // 更新头像URL为云存储fileID
            loading: false,
          });
          wx.hideLoading();
          wx.showToast({
            title: '头像上传成功',
            icon: 'success'
          });
        } catch (uploadErr) {
          wx.hideLoading();
          this.setData({ loading: false });
          console.error('头像上传失败', uploadErr);
          wx.showToast({
            title: '头像上传失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.log('选择图片取消或失败', err);
      }
    });
  },

  onNickNameInput: function (e) {
    this.setData({
      nickName: e.detail.value
    });
  },

  onSaveProfile: async function () {
    const { nickName, avatarUrl } = this.data;

    if (!nickName.trim()) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({
      title: '保存中...'
    });
    console.log('调用 updateUserInfo 云函数，提交数据:', { nickName, avatarUrl });
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          nickName: nickName.trim(),
          avatarUrl: avatarUrl,
        },
      });
      wx.hideLoading();
      this.setData({ loading: false });

      if (res.result.code === 0) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        // 直接更新上一页（我的页面）的数据
        const pages = getCurrentPages();
        if (pages.length > 1) {
          const prevPage = pages[pages.length - 2];
          prevPage.setData({
            'userInfo.nickName': nickName.trim(),
            'userInfo.avatarUrl': avatarUrl
          });
        }

        setTimeout(() => {
          wx.navigateBack(); // 返回上一页
        }, 1000);
      } else {
        wx.showToast({
          title: res.result.msg || '保存失败',
          icon: 'none'
        });
        console.error('保存用户资料失败:', res.result);
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
      console.error('调用 updateUserInfo 云函数失败', err);
    }
  },

});