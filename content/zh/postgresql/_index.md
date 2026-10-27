+++
title = "PostgreSQL 专题"
date = 2026-10-27T00:00:00+08:00
summary = "PostgreSQL 内核和 Babelfish 实现原理的专题文章。"
description = "PostgreSQL 内核与 Babelfish 专题文章目录。"
tags = []
categories = []
draft = false
+++

这个专题围绕 PostgreSQL 内核和 Babelfish 的实现展开，从源码与执行流程出发，记录数据库机制和兼容层设计。

## PostgreSQL 内核

- [PostgreSQL 属性图查询（SQL/PGQ）内部原理]({{< relref "/posts/pgq-internals" >}})：解析属性图的元数据、语义分析和查询重写。
- [PostgreSQL 表达式处理框架]({{< relref "/posts/babelfish-for-postgresql/pg-expression-parse-eval-architecture" >}})：梳理表达式从解析、规划到执行的处理过程。

## Babelfish

- [Babelfish 语法解析与 PL/TSQL 执行架构解析]({{< relref "/posts/babelfish-for-postgresql/babelfish-parser-architecture" >}})：介绍 T-SQL 解析、PL/TSQL 编译以及与 PostgreSQL 主链路的协作。
