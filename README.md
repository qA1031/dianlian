# 店连 - 微信 WiFi 社区共享工具

## 项目简介

店连是一个基于微信云开发的 WiFi 社区共享工具（小程序），纯公益、开源、非盈利。

## 核心原则

1.  **严禁使用 wx.connectWifi API**：小程序只做密码展示和复制，用户手动去系统设置连接。这是为了规避《网络安全法》的法律责任。
2.  **位置强校验**：提交新店或反馈密码失效时，必须校验用户位置。若用户距离目标店铺超过 500 米，直接拒绝操作。
3.  **仅限商铺**：数据仅限奶茶店、餐厅、商场等公共场所，严禁涉及家庭或个人 WiFi。
4.  **非盈利开源**：无广告、无会员、无商业化逻辑，UI 上不得出现任何收益相关字样。

## 技术栈

-   **后端**：微信云开发（CloudBase）
-   **前端**：微信小程序原生开发（不使用第三方 UI 框架）
-   **数据库**：云开发数据库（JSON 文档型）

## 数据库设计

### 集合1：`shops`

-   `_id`: 自动生成
-   `shopName`: 店名
-   `address`: 地址描述
-   `location`: { `lat`: 纬度, `lng`: 经度 }
-   `source`: "init" 或 "user"
-   `createdAt`: 时间戳

### 集合2：`wifiRecords`

-   `_id`: 自动生成
-   `shopId`: 关联 shops._id
-   `ssid`: WiFi 名称
-   `password`: 密码明文
-   `status`: 1=有效，0=已失效
-   `reportedBy`: 用户 openid
-   `reportedAt`: 时间戳

**查询规则**：查询 WiFi 密码时，按 reportedAt 倒序，取 status=1 的第一条作为当前有效密码。

## 页面清单

1.  **pages/home/index**：附近店铺列表（500米内），卡片展示店名、距离、SSID，密码默认星号，点击复制才明文。
2.  **pages/detail/index**：详情页，含【我能连上】和【密码已失效】两个按钮。
3.  **pages/submit/index**：提交新店表单，含店名、地址（地图选点）、SSID、密码。

## 云函数清单

1.  **getNearbyShops**：入参 { lat, lng }，聚合查询附近店铺及最新密码。
2.  **getShopDetail**：入参 { shopId }，返回店铺详情及当前有效 WiFi。
3.  **submitShop**：入参 { shopName, address, lat, lng, ssid, password }，需校验定位。
4.  **submitWifi**：入参 { shopId, ssid, password }，新增密码记录。
5.  **reportInvalid**：入参 { recordId, shopId }，将记录 status 置为 0，需校验定位。

## 部署与使用

1.  **微信开发者工具**：导入项目。
2.  **云开发环境**：在微信开发者工具中开通云开发，并设置环境 ID。
3.  **数据库**：根据上述数据库设计创建 `shops` 和 `wifiRecords` 集合。
4.  **云函数部署**：右键点击 `cloudfunctions` 目录下的每个云函数文件夹，选择“上传并部署所有文件”。
5.  **更新 app.js**：确保 `miniprogram/app.js` 中的 `wx.cloud.init` 的 `env` 参数配置正确（通过 `project.config.json` 或云开发控制台）。

---

**欢迎为本项目贡献代码和建议！**