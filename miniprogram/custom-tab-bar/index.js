Component({
  data: {
    selected: 0,
    isDarkMode: false, // 新增 isDarkMode 状态
    list: [
      { pagePath: "/pages/index/index", text: "首页" },
      { pagePath: "/pages/submit/index", text: "提交" },
      { pagePath: "/pages/my/index", text: "我的" }
    ]
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      wx.switchTab({ url: path });
      this.setData({ selected: index });
    }
  },

  pageLifetimes: {
    show() {
      const app = getApp();
      this.setData({ isDarkMode: app.globalData.isDarkMode });
    }
  }
});