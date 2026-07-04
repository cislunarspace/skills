# CONTEXT.md 格式

## 结构

```md
# {上下文名称}

{一两句话描述这个上下文是什么、为什么存在。}

## Language

**Order**:
{术语的一两句描述}
_Avoid_: Purchase, transaction

**Invoice**:
发货后发给客户的付款请求。
_Avoid_: Bill, payment request

**Customer**:
下单的个人或组织。
_Avoid_: Client, buyer, account
```

## 规则

- **要有主见**。当同一概念存在多个词时，选最好的一个，其余列在 `_Avoid_` 下。
- **定义要紧凑**。最多一两句话。定义它**是**什么，不是它**做**什么。
- **只收录本项目上下文特有的术语**。通用编程概念（超时、错误类型、工具模式）不属于这里，即使项目大量使用。加一个术语前先问：这是本上下文特有的概念，还是通用编程概念？只有前者属于这里。
- **出现自然聚类时用子标题分组**。如果所有术语属于同一个内聚区域，平铺即可。

## 单一上下文 vs 多上下文

**单一上下文（多数仓库）**：仓库根目录一份 `CONTEXT.md`。

**多上下文**：根目录有一份 `CONTEXT-MAP.md`，列出各上下文、它们的位置以及彼此关系：

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md)：接收和跟踪客户订单
- [Billing](./src/billing/CONTEXT.md)：生成发票和处理付款
- [Fulfillment](./src/fulfillment/CONTEXT.md)：管理仓库拣货和发货

## Relationships

- **Ordering → Fulfillment**：Ordering 发出 `OrderPlaced` 事件，Fulfillment 消费它开始拣货
- **Fulfillment → Billing**：Fulfillment 发出 `ShipmentDispatched` 事件，Billing 消费它生成发票
- **Ordering ↔ Billing**：共享 `CustomerId` 和 `Money` 类型
```

技能自动推断适用哪种结构：

- 存在 `CONTEXT-MAP.md`，读它找到各上下文
- 只有根 `CONTEXT.md`，单一上下文
- 都不存在，在第一个术语确定时按需创建根 `CONTEXT.md`

存在多个上下文时，推断当前主题关联的是哪一个。不清楚就问。
