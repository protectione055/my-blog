---
title: "PostgreSQL 属性图查询（SQL/PGQ）内部原理"
date: 2026-08-30T00:00:00+08:00
slug: "pgq-internals"
categories:
  - 计算机技术
tags:
  - PostgreSQL
  - 数据库
  - 图数据库
description: >-
  从系统目录、语义分析和查询重写三个层面，解析 PostgreSQL SQL/PGQ 属性图查询的内部实现。
draft: false
---

# 第12章 属性图查询

SQL/PGQ（Property Graph Queries）是 SQL 标准中用于定义和查询属性图的部分。PostgreSQL 的实现没有引入新的图存储引擎，而是在关系表之上建立一层属性图元数据，并将图模式匹配转换为普通的关系查询。因此，属性图查询最终仍然由 PostgreSQL 原有的计划器和执行器处理。

本章介绍 PostgreSQL 中 SQL/PGQ 的内部工作原理，包括以下几个主题：

- 属性图的逻辑结构
- 属性图在系统目录中的表示
- `CREATE PROPERTY GRAPH` 命令的处理过程
- `GRAPH_TABLE` 的解析与语义分析
- 图模式向关系查询的转换
- 属性表达式、标签和环路的处理
- 权限、行级安全性和缓存失效
- 当前实现的限制与性能特征

SQL/PGQ 标准的内容十分庞大。本章讨论的是当前 PostgreSQL 所实现的固定长度路径模式，不涉及尚未支持的可变长度路径和最短路径等功能。

## 12.1 概览

属性图由顶点（vertex）和边（edge）组成。顶点表示实体，边表示实体之间的关系。顶点和边统称为图元素（graph element）。每个图元素可以具有一个或多个标签（label），标签又可以定义一组属性（property）。

例如，一个简单的商店系统包含顾客、订单和顾客下单关系。使用关系模型时，可以定义以下三张表：

```sql
CREATE TABLE customers (
    customer_id integer PRIMARY KEY,
    name        text,
    address     text
);

CREATE TABLE orders (
    order_id     integer PRIMARY KEY,
    ordered_when date
);

CREATE TABLE customer_orders (
    id          integer PRIMARY KEY,
    customer_id integer REFERENCES customers(customer_id),
    order_id    integer REFERENCES orders(order_id)
);
```

在属性图中，`customers` 和 `orders` 可以作为顶点表，`customer_orders` 可以作为边表：

```sql
CREATE PROPERTY GRAPH shop_graph
    VERTEX TABLES (
        customers,
        orders
    )
    EDGE TABLES (
        customer_orders KEY (id)
            SOURCE KEY (customer_id)
                REFERENCES customers (customer_id)
            DESTINATION KEY (order_id)
                REFERENCES orders (order_id)
    );
```

该命令不会复制三张表中的任何数据。它只记录下列信息：

- 哪些关系充当顶点表和边表；
- 如何唯一标识一个顶点或一条边；
- 边的起点和终点分别引用哪个顶点表；
- 图元素具有哪些标签和属性。

定义完成后，可以使用 `GRAPH_TABLE` 查询属性图：

```sql
SELECT customer_name, ordered_when
FROM GRAPH_TABLE (
    shop_graph
    MATCH
        (c IS customers)-[IS customer_orders]->(o IS orders)
    COLUMNS (
        c.name AS customer_name,
        o.ordered_when AS ordered_when
    )
);
```

从概念上看，这个图模式等价于从顾客顶点出发，沿着 `customer_orders` 边，到达订单顶点。

PostgreSQL 对该语句的处理过程如图 12.1 所示。

```text
                 SQL 字符串
                     │
                     ▼
                  解析器
                     │ RangeGraphTable
                     ▼
                  分析器
                     │ RTE_GRAPH_TABLE
                     │ GraphPattern
                     │ GraphPropertyRef
                     ▼
                  重写器
                     │ 普通关系子查询
                     │ JOIN + WHERE + UNION ALL
                     ▼
                  计划器
                     │ 计划树
                     ▼
                  执行器
                     │
                     ▼
                   结果集
```

图 12.1　`GRAPH_TABLE` 查询的处理过程

实现中的关键点是重写器。重写器将特殊的 `RTE_GRAPH_TABLE` 范围表项转换为普通的子查询范围表项。转换完成后，计划器和执行器并不知道原始语句包含图查询。

## 12.2 属性图的逻辑结构

### 12.2.1 图、元素、标签和属性

一个属性图可以看成由五类对象组成：

1. 属性图对象；
2. 顶点元素；
3. 边元素；
4. 标签；
5. 属性。

图元素不是表中的某一行，而是一张基础表在图中的角色。例如，`customers` 表作为整体是一个顶点元素，而表中的每一行在查询时表示一个具体的顾客顶点。

同一张基础表也可以通过不同别名在一个图中承担不同角色。元素别名是图内部引用元素的名称，并不要求与基础表名相同。

标签用于把多个元素归入同一类。例如，订单表和愿望单表可以共享标签 `lists`：

```sql
VERTEX TABLES (
    orders
        LABEL lists PROPERTIES (
            order_id AS node_id,
            'order'::text AS list_type
        ),
    wishlists
        LABEL lists PROPERTIES (
            wishlist_id AS node_id,
            'wishlist'::text AS list_type
        )
)
```

查询 `(v IS lists)` 时，这两个顶点元素都可以匹配变量 `v`。属性 `v.node_id` 在不同元素上对应不同的基础列，而 `v.list_type` 甚至可以对应一个常量表达式。

因此，属性图中的“属性”与关系表中的“列”并不完全相同。属性是一个带有名字和类型的图级概念，它在每个元素标签上对应一个具体表达式。

### 12.2.2 元素键与边端点

每个元素都具有一个键。顶点键用于唯一标识顶点；边键用于唯一标识边。键可以由一个或多个基础表列组成。

边还需要定义两组引用：

- source key：边表中用于定位起点顶点的列；
- destination key：边表中用于定位终点顶点的列。

每组引用都包含边表列、目标顶点列及用于比较它们的等值操作符。这些信息最终会变成边表与顶点表之间的连接条件。

例如：

```sql
SOURCE KEY (customer_id) REFERENCES customers (customer_id)
```

在查询重写阶段会产生类似下面的条件：

```sql
customer_orders.customer_id = customers.customer_id
```

如果键由多列组成，则为每一对列生成一个条件，并使用 `AND` 连接。

## 12.3 属性图的系统目录

属性图对象以一种特殊关系的形式登记在 `pg_class` 中，其 `relkind` 为 `RELKIND_PROPGRAPH`，对应字符 `'g'`。属性图没有堆文件，也不能像普通表一样执行 `SELECT * FROM graph_name`、`INSERT` 或 `COPY`。

属性图的具体定义保存在五张系统目录中。图 12.2 展示了它们之间的关系。

```text
                         pg_class
                     relkind = 'g'
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
 pg_propgraph_element  pg_propgraph_label  pg_propgraph_property
             │              │              │
             └──────┐  ┌────┘              │
                    ▼  ▼                    │
          pg_propgraph_element_label       │
                    │                       │
                    └──────────┬────────────┘
                               ▼
               pg_propgraph_label_property
```

图 12.2　属性图系统目录之间的关系

### 12.3.1 pg_propgraph_element

`pg_propgraph_element` 为每个顶点元素或边元素保存一行。主要字段如下：

| 字段 | 含义 |
|---|---|
| `pgepgid` | 所属属性图在 `pg_class` 中的 OID |
| `pgerelid` | 基础关系的 OID |
| `pgealias` | 元素在图中的别名 |
| `pgekind` | 顶点或边 |
| `pgekey` | 元素键的属性编号数组 |
| `pgesrcvertexid` | 边的起点顶点元素 OID |
| `pgedestvertexid` | 边的终点顶点元素 OID |
| `pgesrckey`、`pgedestkey` | 边表中的端点键列 |
| `pgesrcref`、`pgedestref` | 顶点表中被引用的列 |
| `pgesrceqop`、`pgedesteqop` | 各列比较所用的等值操作符 |

键和引用都使用属性编号而不是列名保存。因此，执行图查询时可以直接构造 `Var` 节点，不需要再次解析列名。

### 12.3.2 标签目录

`pg_propgraph_label` 保存图中所有不同的标签名。标签名只在所属属性图内唯一。

`pg_propgraph_element_label` 是元素和标签之间的连接表。一个元素可以有多个标签，同一个标签也可以用于多个元素。

将标签独立保存有两个作用。首先，分析器可以把查询中的标签名转换成稳定的标签 OID；其次，重写器可以根据一个标签找到所有能够匹配该模式的元素表。

### 12.3.3 属性目录

`pg_propgraph_property` 保存图级属性定义，主要包括属性名、数据类型、类型修饰符和排序规则。

`pg_propgraph_label_property` 保存属性在某个元素标签上的具体表达式。表达式使用 `pg_node_tree` 格式保存。例如：

```sql
first_name || ' ' || last_name AS full_name
```

在系统目录中保存的是经过分析的表达式树，而不是原始 SQL 字符串。查询重写时，该表达式树会被取出并调整其中 `Var` 节点的范围表编号。

同名属性必须在整个属性图中具有相同的数据类型、类型修饰符和排序规则。该约束使来自不同元素表的结果能够安全地通过 `UNION ALL` 合并。

## 12.4 创建属性图

`CREATE PROPERTY GRAPH` 的主要入口是 `CreatePropGraph()`，定义在 `src/backend/commands/propgraphcmds.c` 中。其处理过程大致可以分成三个阶段。

### 12.4.1 收集元素信息

函数首先遍历所有顶点表，完成下列工作：

1. 打开基础关系并获取关系 OID；
2. 确定元素别名；
3. 检查别名在图内是否重复；
4. 解析或推断元素键；
5. 暂存标签和属性定义。

随后遍历边表。除上述步骤外，还要根据别名找到起点和终点顶点，并检查它们是否已经定义在当前图中。

如果用户没有显式指定键，实现会尝试使用基础表已有的主键。边的端点定义同样可以利用现有外键进行推断。显式定义则允许图结构与基础表的约束定义有所不同。

### 12.4.2 创建目录记录

收集并验证完元素信息后，`CreatePropGraph()` 调用 `DefineRelation()`，以 `RELKIND_PROPGRAPH` 创建属性图对象。虽然复用了关系对象的创建框架，但这种关系没有物理存储。

随后依次写入：

- 元素记录；
- 标签记录；
- 元素—标签记录；
- 图级属性记录；
- 元素标签上的属性表达式记录。

这种写入顺序与各目录之间的引用关系一致。元素和属性目录记录还会建立相应的对象依赖。

### 12.4.3 一致性检查

属性图允许多个元素共享标签和属性，这也带来了跨元素的一致性要求。创建过程中主要检查以下规则：

- 元素别名在图中必须唯一；
- 边引用的起点和终点元素必须存在；
- 引用两侧的列数必须相同；
- 每一对引用列必须存在合适的等值操作符；
- 同一标签在不同元素上必须定义兼容的属性集合；
- 图中的同名属性必须具有相同类型、类型修饰符和排序规则；
- 同一元素上不能通过多个定义产生冲突的同名属性。

当属性表达式引用基础表列、函数、操作符、类型或排序规则时，属性图会记录相应依赖。这样，在删除被依赖对象时，PostgreSQL 的通用依赖机制可以阻止操作或级联删除属性图定义。

## 12.5 GRAPH_TABLE 的解析

`GRAPH_TABLE` 出现在 `FROM` 子句中，其基本形式如下：

```sql
GRAPH_TABLE (
    graph_name
    MATCH graph_pattern
    COLUMNS (expression [AS name], ...)
)
```

### 12.5.1 语法解析树

语法规则位于 `src/backend/parser/gram.y`。解析器仅检查输入是否满足语法规则，并生成一个 `RangeGraphTable` 节点：

```c
typedef struct RangeGraphTable
{
    NodeTag       type;
    RangeVar     *graph_name;
    GraphPattern *graph_pattern;
    List         *columns;
    Alias        *alias;
    ParseLoc      location;
} RangeGraphTable;
```

`graph_pattern` 包含路径模式列表以及可选的全局 `WHERE` 条件。每个顶点或边模式由一个 `GraphElementPattern` 表示。

以下模式：

```text
(c IS customers)-[co IS customer_orders]->(o IS orders)
```

会被解析成三个连续的元素模式：

```text
GraphElementPattern(VERTEX_PATTERN,    variable="c")
GraphElementPattern(EDGE_PATTERN_RIGHT, variable="co")
GraphElementPattern(VERTEX_PATTERN,    variable="o")
```

在此阶段，`customers`、`customer_orders` 和 `orders` 仍然只是名字。解析器不会检查图和标签是否存在。

### 12.5.2 边方向

当前语法支持三种边方向：

```text
(a)-[e]->(b)    从 a 指向 b
(a)<-[e]-(b)    从 b 指向 a
(a)-[e]-(b)     任意方向
```

省略方括号时，也可以使用缩写形式：

```text
(a)->(b)
(a)<-(b)
(a)-(b)
```

无论采用完整形式还是缩写形式，解析器都会生成相应类型的边元素模式。

## 12.6 GRAPH_TABLE 的语义分析

`transformRangeGraphTable()` 是 `GRAPH_TABLE` 语义分析的入口，定义在 `src/backend/parser/parse_clause.c` 中。它首先调用 `parserOpenPropGraph()` 打开属性图，并获得图对象的 OID。

分析期间使用一个临时的 `GraphTableParseState` 保存当前图 OID、模式变量列表和当前正在处理的元素模式。

### 12.6.1 标签名解析

标签表达式可以是单个标签，也可以包含逻辑组合。例如：

```sql
(v IS orders | wishlists)
```

分析器调用 `transformLabelExpr()` 遍历标签表达式。每个标签名都通过系统缓存查找，并转换为 `GraphLabelRef`：

```c
typedef struct GraphLabelRef
{
    NodeTag  type;
    Oid      labelid;
    ParseLoc location;
} GraphLabelRef;
```

如果标签不属于当前属性图，则在分析阶段报告错误。

### 12.6.2 属性引用解析

图属性引用采用 `变量.属性` 的形式，例如 `c.name`。语法解析器最初把它表示为普通 `ColumnRef`。分析表达式时，`transformGraphTablePropertyRef()` 首先判断第一部分是否为当前图模式中的变量。如果是，则在 `pg_propgraph_property` 中查找第二部分，并生成 `GraphPropertyRef`：

```c
typedef struct GraphPropertyRef
{
    Expr        xpr;
    const char *elvarname;
    Oid         propid;
    Oid         typeId;
    int32       typmod;
    Oid         collation;
    ParseLoc    location;
} GraphPropertyRef;
```

该节点已经携带属性类型和排序规则，但尚未指向具体基础表列。原因是一个标签可能匹配多张元素表，只有到重写阶段选择了具体元素后，才能确定属性对应的表达式。

### 12.6.3 模式结构检查

当前实现要求路径由顶点和边交替组成。因此分析器会拒绝以下模式：

- 以边开始或结束的路径；
- 两个相邻的边模式；
- 两个相邻的顶点模式；
- 当前尚未支持的嵌套路径模式；
- 带路径量词的元素模式。

元素内部的 `WHERE` 条件只能引用当前元素变量。例如：

```sql
(c IS customers WHERE c.address = 'US')
```

如果在该局部条件中引用另一个元素变量，分析器会报告“不支持非局部元素变量引用”。跨元素条件应当写在整个图模式的 `WHERE` 子句中。

### 12.6.4 构造范围表项

完成语义分析后，`addRangeTableEntryForGraphTable()` 创建一个 `RTE_GRAPH_TABLE` 类型的 `RangeTblEntry`。其中主要保存：

- 属性图的 OID；
- 已完成语义分析的 `GraphPattern`；
- `COLUMNS` 对应的目标列表；
- 输出列名。

此时查询树仍然包含图查询专用节点，计划器还不能直接处理它们。

## 12.7 图查询的重写

重写发生在 `fireRIRrules()` 处理范围表时。当它遇到 `RTE_GRAPH_TABLE`，便调用 `rewriteGraphTable()`。该函数位于 `src/backend/rewrite/rewriteGraphTable.c`，是整个 PGQ 查询实现的核心。

重写过程包括四个主要步骤：

1. 将路径模式整理为 path factor；
2. 为每个 factor 找出候选图元素；
3. 枚举能够组成路径的元素组合，并为每个组合构造关系查询；
4. 使用 `UNION ALL` 合并这些关系查询。

### 12.7.1 path factor

一个普通的元素模式对应一个 `path_factor`。它记录元素类型、变量、标签表达式、局部条件以及在路径中的位置。

如果同一个变量在路径中多次出现，这些元素模式会合并为一个 factor。例如：

```sql
MATCH (a)-[e]->(a)
```

两处 `a` 表示同一个顶点，而不是两个恰好具有相同属性的顶点。实现通过共享 factor 和同一个范围表项表达这一身份约束。

如果同名变量的两处模式具有局部条件，条件会使用 `AND` 合并。当前实现不支持同名变量带有两个不同的非空标签表达式，因为这需要对标签表达式进行更复杂的合取处理。

### 12.7.2 从标签到候选元素

标签表达式最终解析为一组标签 OID。重写器根据这些标签查找所有关联的图元素，并检查元素种类是否与模式一致。

例如，标签 `lists` 同时用于 `orders` 和 `wishlists` 两个顶点元素，则：

```sql
(l IS lists)
```

具有两个候选元素。

没有标签表达式的元素模式被视为可以匹配相应类型的所有标签和元素。其候选集合通常比带标签模式更大。

每个候选元素被表示为一个 `path_element`。它包含基础关系 OID；对于边元素，还包含起点、终点元素 OID以及预先构造的端点连接条件。

### 12.7.3 枚举元素组合

假设一个路径含有三个 factor，其候选元素数量分别为 2、3 和 2。理论上存在：

```text
2 × 3 × 2 = 12
```

种元素组合。`generate_queries_for_path_pattern_recurse()` 使用深度优先搜索枚举这些组合。

并非每种组合都能形成合法路径。边元素在目录中已经记录了它所连接的起点和终点元素。如果某个边候选不能连接当前选择的两个顶点候选，该组合会被放弃。

该过程处理的是“元素表之间的路径”。基础表中的具体行是否能够连接，则由随后生成的连接条件和执行器决定。

### 12.7.4 为一条路径构造查询

`generate_query_for_graph_path()` 为一个合法的元素组合创建普通 `Query`。该查询包括：

1. 每个图元素对应的基础关系范围表项；
2. 所有基础关系组成的 `fromlist`；
3. 边与相邻顶点之间的连接条件；
4. 元素模式中的局部条件；
5. 图模式的全局条件；
6. `COLUMNS` 子句对应的目标列表。

考虑本章开头的例子：

```sql
MATCH
    (c IS customers)-[IS customer_orders]->(o IS orders)
COLUMNS (
    c.name AS customer_name,
    o.ordered_when AS ordered_when
)
```

它在概念上会被重写为：

```sql
SELECT c.name AS customer_name,
       o.ordered_when AS ordered_when
FROM customers AS c,
     customer_orders AS co,
     orders AS o
WHERE co.customer_id = c.customer_id
  AND co.order_id = o.order_id;
```

实际实现不会生成 SQL 字符串，而是直接构造 `Query`、`RangeTblEntry`、`FromExpr`、`OpExpr`、`Var` 和 `TargetEntry` 等节点。

### 12.7.5 边方向的处理

对于有向边，重写器根据模式方向选择端点条件。

对于任意方向边：

```sql
(a)-[e]-(b)
```

会生成等价于下式的条件：

```text
(e.source = a AND e.destination = b)
OR
(e.source = b AND e.destination = a)
```

如果边的起点和终点引用同一个顶点元素，两组条件都有可能成立。实现将它们放在一个 `OR` 表达式中，避免将同一边拆成两个查询分支。

### 12.7.6 属性表达式替换

分析阶段留下的 `GraphPropertyRef` 不能由执行器直接计算。`replace_property_refs()` 根据当前路径分支中变量对应的实际元素，查找 `pg_propgraph_label_property` 中保存的表达式。

例如，`l.node_id` 在一个分支中可能替换为：

```sql
orders.order_id
```

在另一个分支中则可能替换为：

```sql
wishlists.wishlist_id
```

替换后的表达式会调整 `Var.varno`，使其指向本分支查询中对应的基础关系范围表项。

如果模式允许匹配某个元素，但查询的属性没有与该元素的有效标签相关联，实现会根据语义规则报告错误或构造相应的空值表达式。空值也会带有图级属性所规定的数据类型、类型修饰符和排序规则。

### 12.7.7 合并分支

当一个模式可以由多种元素表组合满足时，每种组合都会产生一个关系查询。`generate_union_from_pathqueries()` 使用 `UNION ALL` 将它们合并。

这里不能使用普通的 `UNION`。图查询返回的是匹配结果；不同路径即使投影出相同值，也仍然是不同的匹配，不应被集合去重。

如果没有任何合法元素组合，重写器仍然构造一个具有正确目标列类型的查询：

```sql
SELECT NULL::type1, NULL::type2, ...
WHERE false;
```

这样，空结果不会丢失 `GRAPH_TABLE` 的输出结构。

最后，原范围表项被改写为：

```text
RTE_GRAPH_TABLE  →  RTE_SUBQUERY
```

并被标记为 lateral。原来的 `graph_pattern` 和 `graph_table_columns` 字段随即清空。

## 12.8 计划与执行

重写结束后，查询树中只剩下 PostgreSQL 已有的关系查询节点。因而 PGQ 不需要专用的图计划节点和图执行节点。

对于单一元素组合，计划器通常看到一个包含若干基础表和等值连接条件的多表查询。它可以选择：

- 顺序扫描或索引扫描；
- 嵌套循环连接；
- 归并连接；
- 散列连接；
- 合适的连接顺序；
- 在满足一般条件时使用并行计划。

基础表上的统计信息和索引会直接影响图查询的计划。例如，为边表的 source key 和 destination key 建立索引，通常有助于从已筛选的顶点出发查找相邻边。

存在多个元素组合时，计划树通常包含 `Append` 或集合运算相关结构，每个分支对应一种元素表组合。执行器逐个执行这些分支并合并结果。

这种设计的优点是最大限度复用了 PostgreSQL 的关系执行基础设施；代价是计划器看不到抽象的“图路径”，只能优化重写后形成的关系连接和集合分支。

## 12.9 权限与行级安全性

属性图具有自身的访问权限。引用 `GRAPH_TABLE` 时，用户需要对属性图拥有相应权限。

除此之外，重写得到的每个基础关系范围表项都按当前查询用户检查 `SELECT` 权限，而不是按属性图所有者的权限访问。这一行为类似默认的安全调用者视图，可以防止用户借助他人创建的属性图绕过基础表权限。

重写器还会检查最终条件和目标列表中的 `Var`，将实际读取的基础表列登记到 `RTEPermissionInfo.selectedCols` 中。因此列级权限也能正常工作。

由于图范围表项会被转换为普通子查询，`fireRIRrules()` 随后会递归处理该子查询。基础表上的行级安全策略会在这一过程中加入，所以 RLS 同样适用于图查询。

## 12.10 ALTER、预备语句与缓存失效

`ALTER PROPERTY GRAPH` 可以增加或删除元素、标签和属性，也可以修改已有定义。这些操作会改变同一个 `GRAPH_TABLE` 应当生成的关系查询。

例如，一个标签最初只对应一张顶点表，修改后可能对应两张顶点表。原查询的单分支计划必须变成两个 `UNION ALL` 分支。

完成修改后，`AlterPropGraph()` 调用 `CacheInvalidateRelcacheByRelid()` 使图对象的 relcache 失效。已经分析或计划的语句可以通过 PostgreSQL 原有的依赖和缓存失效机制感知图定义变化。下一次执行预备语句时，将根据新的图定义重新生成合适的查询或计划。

## 12.11 当前实现的限制

当前实现覆盖 SQL/PGQ 的固定长度基本路径模式，而不是完整标准。主要限制如下：

- 一个 `GRAPH_TABLE` 只能包含一个路径模式；
- 不支持路径量词和可变长度路径；
- 不支持嵌套路径模式；
- 不支持最短路径及路径值；
- 路径必须由顶点和边交替组成；
- 元素局部条件不能引用其他元素变量；
- `GRAPH_TABLE` 内部不支持子查询；
- `COLUMNS` 中不支持聚合函数、窗口函数和返回集合的函数；
- `COLUMNS (*)` 不受支持；
- 重复变量不能带有不同的非空标签表达式；
- 不能对特定的 `GRAPH_TABLE` 范围表项应用行锁定子句。

有些语法已经可以由解析器识别，例如路径量词，但会在语义分析阶段报告“不支持”。这种安排为后续逐步扩展实现保留了语法树表示。

## 12.12 性能特征

PGQ 实现没有额外的数据副本和图索引。它的运行时性能主要取决于重写后关系查询的连接计划，但在重写和计划阶段还有一个需要注意的问题：元素组合的数量。

假设一个路径具有 `K` 个 factor，第 `i` 个 factor 有 `E_i` 个候选元素，则枚举组合数的上界为：

```text
E₁ × E₂ × ... × Eₖ
```

当每个 factor 平均具有 `E` 个候选元素时，上界可以写成：

```text
Eᴷ
```

每个合法组合都可能生成一棵独立的查询树，属性表达式和过滤条件也会被复制到各分支中。因此，以下情况会增加分析、重写和计划时间：

- 一个标签被大量元素表共享；
- 模式不指定标签，从而匹配图中所有同类元素；
- 路径很长；
- 属性表达式复杂；
- 多个 factor 同时拥有较大的候选集合。

对于“一个业务标签通常对应一张基础表”的常见模型，每个 factor 往往只有一个候选元素。此时 `GRAPH_TABLE` 基本会重写为一条普通多表连接查询，额外开销相对有限。

为了改善实际执行性能，可以采用与关系查询相同的方法：

- 为边表的 source key 和 destination key 建立索引；
- 为图模式中经常过滤的属性对应列建立索引；
- 尽可能指定有选择性的标签；
- 避免让一个宽泛标签覆盖大量结构差异很大的元素表；
- 使用 `EXPLAIN` 检查重写后各连接分支的扫描和连接方式。

## 12.13 小结

PostgreSQL 的 SQL/PGQ 实现可以概括为两层转换。

第一层是从关系模式到属性图模式。`CREATE PROPERTY GRAPH` 不移动数据，只在系统目录中登记元素、键、端点、标签和属性表达式。属性图因此是现有关系数据的一种逻辑视图。

第二层是从图查询回到关系查询。分析器把标签名和属性名转换为带 OID 和类型信息的内部节点；重写器解析候选元素，枚举元素表路径，构造边—顶点连接条件，替换属性表达式，并使用 `UNION ALL` 合并多个分支。

```text
关系表
   │ CREATE PROPERTY GRAPH
   ▼
属性图元数据
   │ GRAPH_TABLE ... MATCH
   ▼
关系查询树
   │ planner / executor
   ▼
查询结果
```

这种实现保留了 PostgreSQL 的核心架构：数据仍由关系存储管理，图模式只负责描述关系之间的另一种组织方式。权限、RLS、依赖、缓存失效、统计信息、连接算法和执行器都可以继续复用。当前功能仍以固定长度路径为主，但它已经建立了从 SQL/PGQ 语法、属性图目录到关系查询重写的完整处理链路。

## 参考源码

- `src/backend/commands/propgraphcmds.c`：属性图的创建和修改
- `src/backend/parser/gram.y`：属性图及图模式语法
- `src/backend/parser/parse_graphtable.c`：标签和属性引用的语义分析
- `src/backend/parser/parse_clause.c`：`GRAPH_TABLE` 范围表项的转换
- `src/backend/rewrite/rewriteGraphTable.c`：图模式向关系查询的重写
- `src/backend/rewrite/rewriteHandler.c`：重写入口
- `src/include/catalog/pg_propgraph_*.h`：属性图系统目录
- `src/include/nodes/parsenodes.h`：`RangeGraphTable` 和图模式节点
- `src/include/nodes/primnodes.h`：`GraphLabelRef` 和 `GraphPropertyRef`
- `src/test/regress/sql/graph_table.sql`：主要回归测试
- `src/test/regress/sql/graph_table_rls.sql`：权限和行级安全测试
