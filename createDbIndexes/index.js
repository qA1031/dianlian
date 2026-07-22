const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 创建 shops.reportedBy 索引
    await db.collection('shops').createIndex({
      fieldName: 'reportedBy',
      unique: false // 不是唯一索引
    });
    console.log('Index for shops.reportedBy created successfully.');

    // 创建 wifiRecords.shopId 索引
    await db.collection('wifiRecords').createIndex({
      fieldName: 'shopId',
      unique: false
    });
    console.log('Index for wifiRecords.shopId created successfully.');

    // 创建 wifiRecords.status 索引
    await db.collection('wifiRecords').createIndex({
      fieldName: 'status',
      unique: false
    });
    console.log('Index for wifiRecords.status created successfully.');

    return { code: 0, msg: '数据库索引创建成功' };
  } catch (e) {
    // 如果索引已存在，会抛出错误，但通常可以忽略
    // 这里捕获错误并打印，确保即使索引已存在也不会中断流程
    if (e.errCode === -502000 || (e.errMsg && e.errMsg.includes('Index already exists'))) {
      console.log('Database index already exists, skipping creation.');
      return { code: 0, msg: '数据库索引已存在，跳过创建' };
    } else {
      console.error('数据库索引创建失败:', e);
      return { code: -1, msg: '数据库索引创建失败', error: e };
    }
  }
};