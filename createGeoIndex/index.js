// cloudfunctions/createGeoIndex/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const collectionName = 'shops';
    const indexName = 'location_2dsphere';
    const fieldName = 'location';

    // 直接尝试创建 2dsphere 索引，如果已存在通常会忽略或提示
    await db.collection(collectionName).createIndex({
      key: { // 注意这里是 key
        [fieldName]: '2dsphere'
      },
      name: indexName
    });

    console.log(`成功为集合 ${collectionName} 创建 2dsphere 索引 ${indexName}。`);
    return {
      code: 0,
      msg: `成功创建 2dsphere 索引 ${indexName}。`
    };

  } catch (e) {
    console.error('创建地理空间索引失败:', e);
    return {
      code: -1,
      msg: '创建地理空间索引失败',
      error: e
    };
  }
};
