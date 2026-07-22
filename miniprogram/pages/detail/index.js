// pages/detail/index.js
const app = getApp();

// 计算两点距离（单位：米）
function getDistance(lat1, lng1, lat2, lng2) {
  const EARTH_RADIUS = 6378137.0; // 单位M
  const PI = Math.PI;

  function getRad(d) {
    return d * PI / 180.0;
  }

  const radLat1 = getRad(lat1);
  const radLat2 = getRad(lat2);

  const a = radLat1 - radLat2;
  const b = getRad(lng1) - getRad(lng2);

  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000;
  return s;
}

Page({
  data: {
    shopId: null,
    shopDetail: null,
    currentWifi: null,
    showPassword: false,
    userLocation: {
      lat: 0,
      lng: 0
    }, // 用户当前位置
  },

  onLoad: function (options) {
    if (options.shopId) {
      this.setData({
        shopId: options.shopId
      });
      this._getShopDetail();
    } else {
      wx.showToast({
        title: '店铺ID缺失',
        icon: 'error'
      });
    }
  },

  onShow: function () {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({ themeClass: theme, isDarkMode: app.globalData.isDarkMode });
    this._getUserLocation(); // 每次进入页面获取用户位置
    this._getShopDetail(); // 刷新数据
  },

  // 获取用户当前位置
  _getUserLocation: function () {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'userLocation.lat': res.latitude,
          'userLocation.lng': res.longitude,
        });
      },
      fail: (err) => {
        console.error("获取用户位置失败", err);
        wx.showToast({
          title: '请授权地理位置',
          icon: 'none'
        });
        // 尝试打开设置页面让用户授权
        wx.openSetting({
          success: (res) => {
            if (res.authSetting['scope.userLocation']) {
              this._getUserLocation(); // 重新获取
            }
          }
        });
      }
    });
  },

  // 获取店铺详情和WiFi信息
  _getShopDetail: async function () {
    wx.showLoading({
      title: '加载中...'
    });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getShopDetail',
        data: {
          shopId: this.data.shopId
        }
      });
      wx.hideLoading();

      if (res.result.code === 0) {
        this.setData({
          shopDetail: res.result.data.shopDetail,
          currentWifi: res.result.data.currentWifi
        });
      } else {
        wx.showToast({
          title: res.result.msg || '获取店铺详情失败',
          icon: 'none'
        });
        console.error('获取店铺详情失败:', res.result.msg);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
      console.error('调用 getShopDetail 云函数失败:', err);
    }
  },

  // 切换密码显示/隐藏
  togglePasswordVisibility: function () {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 复制密码
  copyPassword: function () {
    if (this.data.currentWifi && this.data.currentWifi.password) {
      wx.setClipboardData({
        data: this.data.currentWifi.password,
        success: () => {
          wx.showModal({
            title: '复制成功',
            content: '请前往系统设置连接WiFi',
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      });
    } else {
      wx.showToast({
        title: '无密码可复制',
        icon: 'none'
      });
    }
  },

  // 报告密码失效
  reportInvalidWifi: function () {
    const {
      shopId,
      shopDetail,
      currentWifi,
      userLocation
    } = this.data;

    if (!shopDetail || !currentWifi || !currentWifi._id) {
      wx.showToast({
        title: 'WiFi信息不完整',
        icon: 'none'
      });
      return;
    }

    if (!userLocation.lat || !userLocation.lng) {
      wx.showToast({
        title: '未能获取您的位置',
        icon: 'none'
      });
      this._getUserLocation(); // 尝试重新获取
      return;
    }

    // 前端距离校验
    const distance = getDistance(userLocation.lat, userLocation.lng, shopDetail.location.lat, shopDetail.location.lng);
    if (distance > 500) {
      wx.showModal({
        title: '提示',
        content: '请到店后再反馈',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.showModal({
      title: '确认反馈',
      content: '确认该WiFi密码已失效吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '提交中...'
          });
          try {
            const reportRes = await wx.cloud.callFunction({
              name: 'reportInvalid',
              data: {
                shopId: shopId,
                recordId: currentWifi._id,
                userLat: userLocation.lat,
                userLng: userLocation.lng,
              }
            });
            wx.hideLoading();

            if (reportRes.result.code === 0) {
              wx.showToast({
                title: '反馈成功，感谢您的贡献',
                icon: 'success'
              });
              this._getShopDetail(); // 刷新页面数据
            } else if (reportRes.result.code === 1) { // 云函数返回距离过远
              wx.showModal({
                title: '提示',
                content: reportRes.result.msg,
                showCancel: false,
                confirmText: '我知道了'
              });
            } else {
              wx.showToast({
                title: reportRes.result.msg || '反馈失败',
                icon: 'none'
              });
              console.error('反馈失败:', reportRes.result.msg);
            }
          } catch (err) {
            wx.hideLoading();
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
            console.error('调用 reportInvalid 云函数失败:', err);
          }
        }
      }
    });
  },

  // 跳转到提交新密码页面
  goToSubmitNewWifi: function () {
    const {
      shopId,
      shopDetail
    } = this.data;
    if (shopId && shopDetail) {
      wx.navigateTo({
        url: `/pages/submit/index?shopId=${shopId}&shopName=${shopDetail.shopName}&shopAddress=${shopDetail.address}`
      });
    } else {
      wx.showToast({
        title: '店铺信息不完整',
        icon: 'none'
      });
    }
  },
})