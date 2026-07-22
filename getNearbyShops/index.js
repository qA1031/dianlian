// cloudfunctions/getNearbyShops/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 确保所有云函数都校验 OPENID
  if (!openid) {
    return {
      code: -1,
      msg: 'Unauthorized: OPENID is missing.'
    };
  }

  try {
    const {
      lat,
      lng
    } = event;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        code: -1,
        msg: 'Invalid parameters: lat and lng must be numbers.'
      };
    }

    // 查询附近500米内的店铺
    const MAX_DISTANCE = 500; // 500米

    const shopsRes = await db.collection('shops').aggregate()
      .geoNear({
        distanceField: 'distance', // 输出的距离字段
        spherical: true, // 球面距离
        near: db.Geo.Point(lng, lat),
        maxDistance: MAX_DISTANCE,
        minDistance: 0,
        query: {}, // 可以添加额外的查询条件
      })
      .lookup({
        from: 'wifiRecords',
        localField: '_id',
        foreignField: 'shopId',
        as: 'wifiRecordsList',
      })
      .end();

    const shopsWithWifi = shopsRes.list.map(shop => {
      // 筛选出status=1的wifi记录，并按reportedAt倒序
      const validWifiRecords = shop.wifiRecordsList
        .filter(record => record.status === 1)
        .sort((a, b) => b.reportedAt - a.reportedAt); // 倒序排列

      // 取第一条作为当前有效密码
      const currentWifi = validWifiRecords.length > 0 ? {
        ssid: validWifiRecords[0].ssid,
        password: validWifiRecords[0].password,
      } : null;

      // 删除原始的wifiRecordsList，避免返回过多敏感信息
      delete shop.wifiRecordsList;

      return {
        ...shop,
        currentWifi,
        distance: Math.round(shop.distance) // 距离取整
      };
    });

    return {
      code: 0,
      data: shopsWithWifi,
      msg: '查询成功'
    };
  } catch (e) {
    console.error('Error in getNearbyShops:', e);
    return {
      code: -1,
      msg: `Internal server error: ${e.message}`
    };
  }
};
