# 什么时候 mock

只在**系统边界**打桩：

- 外部 API（支付、邮件等）
- 数据库（有时——优先用测试数据库）
- 时间/随机数
- 文件系统（有时）

不要 mock：

- 你自己的类 / 模块
- 内部协作者
- 任何你掌控的东西

## 为可测性设计

在系统边界上，设计容易 mock 的接口。

**1. 用依赖注入**

外部依赖传进来，而不是在内部 new 出来：

```typescript
// 容易 mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// 难以 mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 偏好 SDK 风格的接口，胜过通用 fetcher**

为每个外部操作各做一个具体函数，而不是一个带条件分支的通用函数：

```typescript
// 好：每个函数可以独立 mock
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// 差：mock 时要在 mock 内部写条件逻辑
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 风格意味着：

- 每个 mock 返回一种具体形状
- 测试 setup 里没有条件逻辑
- 一眼看出一条测试走的是哪些端点
- 每个端点都有独立的类型安全
