Page({
  data: {
    addressName: '请选择店铺地址',
    address: null,
    ssid: '',
    password: '',
    shopType: '餐饮',
    shopTypes: ['餐饮', '咖啡', '奶茶', '便利店', '书店', '酒店', '其他'],
    typeIcons: {
      '餐饮': '🍔',
      '咖啡': '☕',
      '奶茶': '🧋',
      '便利店': '🏪',
      '书店': '📚',
      '酒店': '🏨',
      '其他': '🏢'
    },
    showPassword: false,
    errors: {},
    isSubmitting: false,
    isFormValid: false,
  },

  onLoad() {
    this.checkFormValid();
  },

  onShow() {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({ themeClass: theme, isDarkMode: app.globalData.isDarkMode });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },
  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({ [field]: value });
    this.validateField(field, value);
    this.checkFormValid();
  },

  // 验证单个字段
  validateField(field, value) {
    const errors = { ...this.data.errors };
    if (field === 'ssid' && !value.trim()) {
      errors.ssid = '请输入WiFi名称';
    } else {
      delete errors[field];
    }
    this.setData({ errors });
  },



  // 检查表单是否有效
  checkFormValid() {
    const { address, ssid } = this.data;
    const isValid = address && ssid.trim();
    this.setData({ isFormValid: isValid });
  },

  // 清除字段
  clearField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: '' });
    this.checkFormValid();
  },

  // 切换密码输入框显示/隐藏
  togglePasswordInput() {
    const show = !this.data.showPassword;
    this.setData({ showPassword: show });
  },

  // 选择店铺类型
  selectType(e) {
    this.setData({ shopType: e.currentTarget.dataset.type });
  },

  // 选择地址
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          addressName: res.name || res.address,
          address: res,
        });
        // 清除地址错误
        const errors = { ...this.data.errors };
        delete errors.address;
        this.setData({ errors });
        this.checkFormValid();
        this._syncShopNameToWiFi(); // 调用同步方法
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return;
        wx.showToast({
          title: '选择地址失败',
          icon: 'none',
        });
      },
    });
  },

  // 提交表单
  submitForm: async function () {
    if (!this.data.isFormValid || this.data.isSubmitting) return;

    // 最终验证
    const errors = {};
    if (!this.data.address) errors.address = '请选择店铺地址';
    if (!this.data.ssid.trim()) errors.ssid = '请输入WiFi名称';

    if (Object.keys(errors).length > 0) {
      this.setData({ errors });
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none',
      });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...', mask: true }); // 显示加载提示

    try {
      // 获取用户当前位置
      const locationRes = await wx.getLocation({
        type: 'wgs84',
      });
      const userLat = locationRes.latitude;
      const userLng = locationRes.longitude;

      // 构造提交数据
      const submitData = {
        shopName: this.data.addressName, // 店铺名称从地址名称获取
        address: this.data.address.address, // 详细地址
        lat: this.data.address.latitude,
        lng: this.data.address.longitude,
        ssid: this.data.ssid.trim(),
        password: this.data.password,
        userLat: userLat,
        userLng: userLng,
      };

      // 调用云函数提交
      const res = await wx.cloud.callFunction({
        name: 'submitShop',
        data: submitData,
      });

      wx.hideLoading(); // 隐藏加载提示
      this.setData({ isSubmitting: false });

      if (res.result.code === 0) {
        wx.showToast({
          title: '提交成功！',
          icon: 'success',
          duration: 2000,
        });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/home/index' }); // 提交成功后跳转到首页
        }, 1500);
      } else {
        wx.showToast({
          title: res.result.msg || '提交失败，请重试',
          icon: 'none',
        });
        console.error('提交失败:', res.result);
      }
    } catch (err) {
      wx.hideLoading(); // 隐藏加载提示
      this.setData({ isSubmitting: false });
      let errorMsg = '提交失败，请重试';
      if (err.errMsg && err.errMsg.includes('getLocation:fail')) {
        errorMsg = '获取位置失败，请检查定位权限';
      } else if (err.result && err.result.msg) {
        errorMsg = err.result.msg;
      }
      wx.showToast({
        title: errorMsg,
        icon: 'none',
      });
      console.error('提交失败或获取位置失败', err);
    }
  },

  // 聚焦时清除错误
  onFocus(e) {
    const field = e.currentTarget.dataset.fieldFocus;
    const errors = { ...this.data.errors };
    delete errors[field];
    this.setData({ errors });
  },

  onBlur(e) {
    const field = e.currentTarget.dataset.fieldFocus;
    const value = e.detail.value;
    this.validateField(field, value);
  },

  // 同步店铺名称到WiFi名称
  _syncShopNameToWiFi: function () {
    const { addressName, ssid } = this.data;
    // 只有当ssid为空时才自动填充，避免覆盖用户已输入的WiFi名称
    if (!ssid && addressName && addressName !== '请选择店铺地址') {
      this.setData({
        ssid: addressName
      });
      this.validateField('ssid', addressName);
      this.checkFormValid();
    }
  },
});