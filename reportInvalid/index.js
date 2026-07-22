// cloudfunctions/reportInvalid/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

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

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const {
    shopId,
    recordId,
    userLat,
    userLng
  } = event; // 接收前端传入的用户位置

  if (!shopId || !recordId || !userLat || !userLng) {
    return {
      code: -1,
      msg: '缺少必要的参数：shopId, recordId, userLat, userLng'
    };
  }

  try {
    // 1. 获取店铺位置进行二次校验
    const shopRes = await db.collection('shops').doc(shopId).get();
    if (!shopRes.data) {
      return {
        code: -1,
        msg: '未找到对应店铺'
      };
    }
    const shopLocation = shopRes.data.location;
    const distance = getDistance(userLat, userLng, shopLocation.lat, shopLocation.lng);

    if (distance > 500) {
      return {
        code: 1,
        msg: '请到店后再反馈'
      };
    }

    // 2. 更新 wifiRecords 记录状态为失效 (status: 0)
    const updateResult = await db.collection('wifiRecords').doc(recordId).update({
      data: {
        status: 0,
        reportedBy: openid, // 记录是谁反馈的
        reportedAt: new Date(),
      }
    });

    // 3. 在 feedbackRecords 集合中插入一条反馈记录 (可选，用于统计和追溯)
    await db.collection('feedbackRecords').add({
      data: {
        shopId: shopId,
        recordId: recordId,
        reportedBy: openid,
        type: 'invalid',
        createdAt: new Date(),
      }
    });

    return {
      code: 0,
      data: {},
      msg: '反馈成功'
    };

  } catch (e) {
    console.error('reportInvalid 云函数执行失败:', e);
    return {
      code: -1,
      data: {},
      msg: '服务器错误，反馈失败',
      error: e
    };
  }
};
