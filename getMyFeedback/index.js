const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const $ = db.command.aggregate;

    const feedbackRecords = await db.collection('wifiRecords').aggregate()
      .match({
        reportedBy: openid,
        status: 0 // 标记为失效的记录
      })
      .lookup({
        from: 'shops',
        localField: 'shopId',
        foreignField: '_id',
        as: 'shopInfo',
      })
      .unwind('$shopInfo') // 将 shopInfo 数组展开为单个对象
      .project({
        _id: 1,
        ssid: 1,
        reportedAt: 1,
        shopName: '$shopInfo.shopName',
        shopId: '$shopInfo._id'
      })
      .orderBy('reportedAt', 'desc')
      .get();

    return { code: 0, data: feedbackRecords.data, msg: 'success' };
  } catch (e) {
    console.error('getMyFeedback 云函数执行失败:', e);
    return { code: -1, data: [], msg: '服务器错误，获取反馈记录失败', error: e };
  }
};