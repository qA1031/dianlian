// cloudfunctions/updateUserInfo/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { nickName, avatarUrl } = event;
  console.log('updateUserInfo 云函数接收到参数:', { openid, nickName, avatarUrl });

  try {
    // 如果没有传入 nickName 和 avatarUrl，则认为是读取操作
    if (!nickName && !avatarUrl) {
      const userRes = await db.collection('users').doc(openid).get();
      if (userRes.data) {
        console.log('读取到用户资料:', userRes.data);
        return {
          code: 0,
          data: userRes.data,
          msg: '读取成功'
        };
      } else {
        console.log('未找到用户资料');
        return {
          code: 0,
          data: null, // 返回null表示未找到，而非错误
          msg: '未找到用户资料'
        };
      }
    }

    // 如果传入了 nickName 或 avatarUrl，则认为是更新操作
    console.log('updateUserInfo 云函数参数校验前的值:', { nickName, avatarUrl });
    if (!nickName || !avatarUrl) {
      return {
        code: -1,
        msg: '缺少必要的参数：nickName 或 avatarUrl'
      };
    }

    // 使用 set 方法，如果文档不存在则创建，存在则更新
    await db.collection('users').doc(openid).set({
      data: {
        nickName: nickName,
        avatarUrl: avatarUrl,
        updatedAt: new Date(),
        _openid: openid // 明确存储openid，方便查询
      }
    });

    console.log('用户资料保存成功');
    return {
      code: 0,
      msg: '保存成功'
    };

  } catch (e) {
    console.error('updateUserInfo 云函数执行失败:', e);
    return {
      code: -1,
      msg: '服务器错误，保存失败',
      error: e
    };
  }
};
