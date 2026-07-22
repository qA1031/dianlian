const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const myShops = await db.collection('shops')
      .where({
        source: 'user',
        _openid: openid
      })
      .field({
        shopName: true,
        address: true,
        createdAt: true,
        _id: true
      })
      .orderBy('createdAt', 'desc')
      .get();

    return { code: 0, data: myShops.data, msg: 'success' };
  } catch (e) {
    console.error('getMyShops 云函数执行失败:', e);
    return { code: -1, data: [], msg: '服务器错误，获取我的店铺失败', error: e };
  }
};