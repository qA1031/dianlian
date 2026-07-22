// cloudfunctions/getShopDetail/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const {
    shopId
  } = event;

  if (!shopId) {
    return {
      code: -1,
      msg: '缺少必要的参数：shopId'
    };
  }

  try {
    // 1. 获取店铺详情
    const shopRes = await db.collection('shops').doc(shopId).get();
    if (!shopRes.data) {
      return {
        code: 1, // 使用1表示未找到店铺，而不是-1，方便前端区分
        msg: '未找到对应店铺'
      };
    }
    const shopDetail = shopRes.data;

    // 2. 查询当前有效WiFi密码
    const wifiRecordsRes = await db.collection('wifiRecords')
      .where({
        shopId: shopId,
        status: 1 // 只查询有效密码
      })
      .orderBy('reportedAt', 'desc') // 按提交时间倒序
      .limit(1)
      .get();

    let currentWifi = null;
    if (wifiRecordsRes.data && wifiRecordsRes.data.length > 0) {
      currentWifi = wifiRecordsRes.data[0];
      // 移除敏感信息，例如 reportedBy
      delete currentWifi.reportedBy;
      delete currentWifi.reportedAt;
      delete currentWifi.status;
    }

    return {
      code: 0,
      data: {
        shopDetail,
        currentWifi
      },
      msg: 'success'
    };

  } catch (e) {
    console.error('getShopDetail 云函数执行失败:', e);
    return {
      code: -1,
      data: {},
      msg: '服务器错误，获取店铺详情失败',
      error: e
    };
  }
};
