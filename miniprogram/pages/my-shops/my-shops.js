Page({
  data: {
    shopList: [],
    submittedShopsCount: 0,
  },

  onShow() {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({ themeClass: theme });
    this.loadMyShops();
  },

  // 加载我提交的店铺
  loadMyShops() {
    wx.showLoading({ title: '加载中...' });

    // 调用云函数获取数据
    wx.cloud.callFunction({
      name: 'getMyShops',
      success: (res) => {
        const shops = res.result.data || [];
        const formattedList = this.formatShopList(shops);
        this.setData({
          shopList: formattedList,
          submittedShopsCount: formattedList.length,
        });
      },
      fail: () => {
        // 开发调试用模拟数据
        const mockData = [
          {
            _id: '1',
            shopName: '星巴克咖啡（科技园店）',
            shopType: '咖啡',
            addressName: '深圳市南山区',
            ssid: 'Starbucks_Free_WiFi',
            hasPassword: true,
            viewCount: 234,
            createTime: '2026-07-15',
            status: 'approved',
          },
          {
            _id: '2',
            shopName: '喜茶（海岸城店）',
            shopType: '奶茶',
            addressName: '深圳市南山区',
            ssid: 'HEYTEA_Free',
            hasPassword: true,
            viewCount: 56,
            createTime: '2026-07-18',
            status: 'pending',
          },
          {
            _id: '3',
            shopName: '肯德基（万象城店）',
            shopType: '餐饮',
            addressName: '深圳市罗湖区',
            ssid: 'KFC_Free_WiFi',
            hasPassword: true,
            viewCount: 892,
            createTime: '2026-06-20',
            status: 'expired',
          },
        ];
        const formattedList = this.formatShopList(mockData);
        this.setData({
          shopList: formattedList,
          submittedShopsCount: formattedList.length,
        });
      },
      complete: () => {
        wx.hideLoading();
      },
    });
  },

  // 格式化店铺数据
  formatShopList(shops) {
    const statusMap = {
      approved: { text: '审核通过', icon: '✓', color: '#07C160', colorLight: '#34d399', bg: '#f0f9f4' },
      pending: { text: '审核中', icon: '⏳', color: '#ff9800', colorLight: '#ffb74d', bg: '#fff8e1' },
      expired: { text: '已失效', icon: '✕', color: '#f44336', colorLight: '#ef9a9a', bg: '#ffebee' },
      rejected: { text: '未通过', icon: '✕', color: '#999', colorLight: '#ccc', bg: '#f5f5f5' },
    };

    const typeMap = {
      '餐饮': { icon: '🍔', color: '#f44336', bg: '#ffebee' },
      '咖啡': { icon: '☕', color: '#07C160', bg: '#f0f9f4' },
      '奶茶': { icon: '🧋', color: '#ff9800', bg: '#fff8e1' },
      '便利店': { icon: '🏪', color: '#2196F3', bg: '#e3f2fd' },
      '书店': { icon: '📚', color: '#9c27b0', bg: '#f3e5f5' },
      '酒店': { icon: '🏨', color: '#009688', bg: '#e0f2f1' },
      '其他': { icon: '🏢', color: '#666', bg: '#f5f5f5' },
    };

    return shops.map(shop => {
      const status = statusMap[shop.status] || statusMap['pending'];
      const type = typeMap[shop.shopType] || typeMap['其他'];

      return {
        ...shop,
        statusText: status.text,
        statusIcon: status.icon,
        statusColor: status.color,
        statusColorLight: status.colorLight,
        statusBg: status.bg,
        typeIcon: type.icon,
        typeColor: type.color,
        typeBg: type.bg,
        createTimeStr: this.formatDate(shop.createTime),
      };
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 编辑店铺
  editShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/submit/index?editId=${id}`,
    });
  },

  // 删除店铺
  deleteShop(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          wx.cloud.callFunction({
            name: 'deleteShop',
            data: { id },
            success: () => {
              const newList = [...this.data.shopList];
              newList.splice(index, 1);
              this.setData({
                shopList: newList,
                submittedShopsCount: newList.length,
              });
              wx.showToast({ title: '删除成功', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '删除失败', icon: 'none' });
            },
            complete: () => {
              wx.hideLoading();
            },
          });
        }
      },
    });
  },

  // 跳转到提交页
  goToSubmit() {
    wx.switchTab({ url: '/pages/submit/index' });
  },
});