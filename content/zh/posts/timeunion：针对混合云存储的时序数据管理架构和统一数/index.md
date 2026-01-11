---
title: "TimeUnion: An Efficient Architecture with Unified Data Model for Timeseries Management Systems on Hybrid Cloud Storage"
date: 2022-08-27 22:51:00
slug: "timeunion：针对混合云存储的时序数据管理架构和统一数"
categories:
  - 数据库系统
  - 计算机技术
tags:
  - 数据库
  - 时序数据
  - 计算机科学
description: >-
  TimeUnion是一个为混合云存储服务量身定制的高效时间序列管理系统。提出统一的数据模型来表示独立的时间序列和时间序列组，能够处理时间序列的不同用例。引入对时间序列的内存高效数据结构。提出了时间分区LSM树，它具有定制的架构、压缩机制、乱序数据处理和对时间序列数据的动态级别大小调整。
draft: false
---

<!-- wp:paragraph -->
<p>TimeUnion是香港中文大学的Zhiqi Wang和Zili Shao两位老师提出的时序数据管理框架，论文发表于数据库领域的顶会SIGMOD 2022<a rel="noreferrer noopener" href="https://media.ironmanzzm.top/pdf/TimeUnion-%20An%20Efficient%20Architecture%20with%20Unified%20Data%20Model%20for%20Timeseries%20Management%20Systems%20on%20Hybrid%20Cloud%20Storage.pdf" target="_blank">(PDF</a>)，代码开源在<a rel="noreferrer noopener" href="https://github.com/naivewong/timeunion" data-type="URL" data-id="https://github.com/naivewong/timeunion" target="_blank">Github</a>。前段时间针对该文章作了一次分享，顺便写写总结。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>比较有意思的是针对混合云存储设计的LSM-Tree采用了三层结构，在慢速存储只有一层以减少compact次数。其他内容先留个坑，写完Dynamo再回头补完。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">
<iframe src="https://media.ironmanzzm.top/TimeUnion%20%28Published%29/index.html" width="600" height="400" scrolling="no">
</iframe>
</div></figure>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
