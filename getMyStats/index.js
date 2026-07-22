const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 统计我提交的店铺数量
    const submittedShopsResult = await db.collection('shops')
      .where({
        source: 'user',
        _openid: openid
      })
      .count();
    const submittedCount = submittedShopsResult.total;

    // 2. 统计我反馈失效的记录数量
    const feedbackRecordsResult = await db.collection('wifiRecords')
      .where({
        reportedBy: openid,
        status: 0 // 标记为失效的记录
      })
      .count();
    const feedbackCount = feedbackRecordsResult.total;

    // 3. 帮助人次 (暂时返回固定值 0)
    const helpCount = 0;

    return {
      code: 0,
      data: {
        submittedCount,
        feedbackCount,
        helpCount
      },
      msg: 'success'
    };
  } catch (e) {
    console.error('getMyStats 云函数执行失败:', e);
    return {
      code: -1,
      data: {},
      msg: '服务器错误，获取统计数据失败',
      error: e
    };
  }
};
