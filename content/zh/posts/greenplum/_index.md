+++
title = "Greenplum 专题"
date = 2026-10-27T00:00:00+08:00
summary = "关于 Greenplum 内核的一些笔记。"
description = "Greenplum 内核原理系列文章。"
tags = ["Greenplum", "PostgreSQL", "分布式数据库"]
categories = ["数据库系统", "计算机技术"]
draft = false
+++

Greenplum 是基于 PostgreSQL 的分布式数据库，面向大规模数据分析。它将数据和查询分布到多个节点上并行处理。

## 阅读目录

1. [分布式快照：从创建、分发到可见性判断]({{< relref "/posts/greenplum/distributed-snapshots" >}})：从 QD 创建快照开始，追踪快照如何下发到 QE，解释同一 segment 内的快照共享与元组可见性判断。
