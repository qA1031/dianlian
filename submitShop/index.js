const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 计算两点间距离 (单位：米)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // 地球半径，单位：米
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { shopName, address, lat, lng, ssid, password, userLat, userLng } = event;
  const wxContext = cloud.getWXContext();

  // 参数校验
  if (!shopName || !address || !lat || !lng || !ssid || !password || !userLat || !userLng) {
    return {
      code: 1,
      data: {},
      msg: '缺少必要的参数'
    };
  }

  // 校验用户位置是否在目标店铺 500 米内
  const distance = getDistance(userLat, userLng, lat, lng);
  if (distance > 500) {
    return {
      code: 1, // 修改错误码为1
      data: { distance: distance.toFixed(2) },
      msg: '请到店后再提交' // 修改错误信息
    };
  }

  try {
    // 1. 插入店铺信息到 shops 集合
    const shopResult = await db.collection('shops').add({
      data: {
        shopName: shopName,
        address: address,
        location: new db.Geo.Point(lng, lat),
        source: 'user',
        createdAt: new Date()
      }
    });

    const shopId = shopResult._id;

    // 2. 插入 WiFi 记录到 wifiRecords 集合
    const wifiRecordResult = await db.collection('wifiRecords').add({
      data: {
        shopId: shopId,
        ssid: ssid,
        password: password,
        status: 1, // 默认为有效
        reportedBy: wxContext.OPENID,
        reportedAt: new Date()
      }
    });

    const recordId = wifiRecordResult._id; // 获取新插入的WiFi记录ID

    return {
      code: 0,
      data: { shopId: shopId, recordId: recordId }, // 返回 recordId
      msg: '提交成功' // 修改成功信息
    };

  } catch (e) {
    console.error(e);
    return {
      code: -1,
      data: {},
      msg: '服务器错误，提交失败',
      error: e
    };
  }
};