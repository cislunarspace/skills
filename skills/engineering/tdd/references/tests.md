# 好测试与坏测试

## 好测试

**集成测试风格**：通过真实接口测，不 mock 内部部件。

```typescript
// 好：测可观察的行为
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

特征：

- 测用户 / 调用方关心的行为
- 只用公开 API
- 能扛内部重构
- 描述 WHAT，不是 HOW
- 一条测试一个逻辑断言

## 坏测试

**实现细节测试**：跟内部结构绑死。

```typescript
// 差：测实现细节
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

危险信号：

- mock 内部协作者
- 测私有方法
- 断言调用次数 / 顺序
- 行为没变，一重构测试就挂
- 测试名描述 HOW 不是 WHAT
- 不走接口，绕到外部手段去验证

```typescript
// 差：绕过接口验证
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// 好：通过接口验证
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

**同义反复测试**：期望值把实现重述了一遍，测试构造上就过。

```typescript
// 差：期望值用代码自身的方式重新算了一遍
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0);
  expect(calculateTotal(items)).toBe(expected);
});

// 好：期望值是独立的、已知正确的字面量
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```
