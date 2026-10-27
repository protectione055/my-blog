+++
title = "Greenplum 专题"
date = 2026-10-27T00:00:00+08:00
summary = "围绕 Greenplum 内核实现，逐篇梳理分布式事务、快照与查询执行机制。"
description = "Greenplum 内核原理系列文章。"
tags = ["Greenplum", "PostgreSQL", "分布式数据库"]
categories = ["数据库系统", "计算机技术"]
draft = false
+++

这个专题记录 Greenplum 内核机制的阅读与分析，结合数据结构、源码调用链和 SQL 示例解释分布式数据库的执行过程。每篇文章注明讨论的实现范围，便于对照源码阅读。

## 阅读目录

1. [分布式快照：从创建、分发到可见性判断]({{< relref "/posts/greenplum/distributed-snapshots" >}})：从 QD 创建快照开始，追踪快照如何下发到 QE，解释同一 segment 内的快照共享与元组可见性判断。
