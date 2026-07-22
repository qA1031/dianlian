// pages/my-shops/index.js
Page({
  data: {
    myShops: [],
    loading: true,
    themeClass: '', // 用于深色模式
  },

  onLoad: function () {
    this._loadMyShops();
  },

  onShow: function () {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({ themeClass: theme, isDarkMode: app.globalData.isDarkMode });
    // 确保每次进入页面都刷新数据
    this._loadMyShops();
  },

  async _loadMyShops() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyShops',
        data: {}
      });

      wx.hideLoading();

      if (res.result.code === 0) {
        const shops = res.result.data.map(shop => ({
          ...shop,
          // 格式化时间，如果需要
          createdAt: shop.createdAt ? new Date(shop.createdAt).toLocaleString() : '未知时间',
        }));
        this.setData({ myShops: shops });
      } else {
        wx.showToast({
          title: res.result.msg || '获取我的店铺失败',
          icon: 'none'
        });
        console.error('获取我的店铺失败:', res.result.msg);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
      console.error('调用 getMyShops 云函数失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goToDetail: function (e) {
    const shopId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/index?shopId=${shopId}`,
    });
  },

  goToSubmit: function () {
    wx.switchTab({
      url: '/pages/submit/index'
    });
  },
});