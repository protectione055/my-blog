---
title: "[\u8bd1\u6587] Amazon DynamoDB: A Scalable, Predicably Performant, and Fully Managed NoSQL Database Service"
date: 2022-09-01 10:06:09
slug: "译文amazon-dynamodb-a-scalable-predicably-performant-and-fully-managed-nosql-database-service"
categories:
  - 分布式系统
  - 数据库系统
  - 计算机技术
tags:
  - 分布式系统
  - 数据库
  - 计算机技术
description: >-
  本文介绍了Amazon在大规模环境下运行DynamoDB的经验，以及该架构如何不断发展以满足客户不断增长的工作负载需求。
draft: false
---

<!-- wp:heading {"level":1} -->
<h1 id="%E6%91%98%E8%A6%81">摘要</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Amazon DynamoDB是一个NoSQL云数据库服务，可以在任意规模上提供稳定的性能。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>成千上万的客户依赖于DynamoDB的基本特性:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>一致的性能</li><li>可用性</li><li>持久性</li><li>完全托管的Serverless服务</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>在2021年66小时的亚马逊黄金日购物活动期间，亚马逊的内部系统对DynamoDB进行了数万亿次API调用，峰值为每秒8920万次请求，仍能体验到几毫秒级别的性能和高可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>自2012年推出DynamoDB以来，我们根据操作经验对其设计和实现进行了改进。在不影响可用性和性能的情况下，成功地解决了<strong>公平性</strong>、<strong>跨分区</strong>的<strong>流量不平衡</strong>、<strong>监控</strong>和<strong>自动化系统操作</strong>方面的问题。<strong>可靠性是至关重要的</strong>，因为即使是最轻微的中断也会对客户造成重大影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>本文介绍了我们在大规模环境下运行DynamoDB的经验，以及该架构如何不断发展以满足客户不断增长的工作负载需求。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="1-%E5%BC%95%E8%A8%80">1 引言</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Amazon DynamoDB是一个NoSQL云数据库服务，支持任意规模的<strong>快速</strong>和<strong>可预测性能</strong>。DynamoDB是一个基础的AWS服务，使用位于世界各地数据中心的大量服务器为数十万客户提供服务。DynamoDB为多个高流量的亚马逊工具和系统赋能，包括Alexa，亚马逊网站和所有亚马逊配送中心。此外，许多AWS服务，如AWS Lambda、AWS Lake Formation和Amazon SageMaker，以及成千上万的客户应用程序都是建立在DynamoDB上的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img src="images/image-01.png" alt="图1：DynamoDB发展历程"><br>（原文这里timeline打成了yimeline，已经发了封邮件告诉他们lol.）</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>这些应用程序和服务在性能、可靠性、持久性、效率和规模方面有很高的操作要求。DynamoDB的用户依赖于它稳定的低延迟请求响应能力。<strong>对于DynamoDB客户来说，在任意规模上保持稳定的性能往往比追求更低的请求响应时延中位数更重要</strong>，因为无法预测的高延迟请求可能会在高层应用中放大，从而导致糟糕的客户体验。<strong>DynamoDB设计的目标是用几毫秒的较低延迟完成所有请求。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>此外，大量使用DynamoDB的客户依赖于一个不断扩展的特性集合，如图1所示。在DynamoDB过去十年的发展中，<strong>一个关键的挑战是在不影响运作的情况下添加特性</strong>。为了使客户和应用程序开发人员受益，DynamoDB独树一帜地集成了以下<strong>六个基本系统特性</strong>:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB是一个完全托管的云服务。</strong> 使用DynamoDB API，应用程序可以创建表并读写数据，而不需要考虑这些表存储在哪里或如何管理它们。DynamoDB使开发人员从软件升级、硬件管理、配置分布式数据库集群和集群运维工作中解脱出来。DynamoDB可以处理资源分配、自动故障恢复、数据加密、软件升级、执行备份，并完成全托管服务所需的其他任务。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB采用多租户体系结构。</strong> DynamoDB将来自不同客户的数据存储在相同的物理机器上，以确保资源的高利用率，使我们能够为客户提供更经济的服务。资源预留、严格分配和用量监控为驻留在同一处的表提供隔离。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB实现了表的无限规模。</strong> 每个表可以存储的数据量没有预设限制。表格弹性增长，以满足客户的应用需求。DynamoDB的设计允许将按需分配一个表的资源从几个服务器扩展到数千个。随着数据存储量和吞吐量需求的增长，DynamoDB将应用程序的数据分散到更多的服务器上。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB提供可预测的性能。</strong> 简单的<code>GetItem</code>和<code>PutItem</code>操作DynamoDB API使它能以稳定的低延迟响应请求。在同一个AWS Region运行的应用程序，对于一个1KB的item来说，平均服务端延迟在几毫秒范围内。最重要的是，DynamoDB延迟是可预测的。即使表从几兆字节增长到几百兆字节，由于DynamoDB中的数据存储和请求路由算法具有分布式特性，延迟仍然可以保持稳定。DynamoDB通过水平扩展、自动分区和重新分区数据来处理任何级别的流量，以满足应用程序的I/O性能需求。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB是高度可用的。</strong> DynamoDB跨多个数据中心(在aws中称为可用域)复制数据，并在磁盘或节点故障时自动重新复制，以满足严格的可用性和持久性要求。客户还可以创建跨区域（Region）进行地理复制的全局表，以进行灾难恢复，并从任何地方提供低延迟访问。DynamoDB为普通表和全局表提供了99.99的可用性SLA(其中DynamoDB跨多个AWS region进行跨表复制)。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB支持灵活的用例。</strong> DynamoDB并不强制要求开发人员使用特定的数据模型或一致性模型。DynamoDB表（Table）没有固定的Schema，允许每个<code>数据条目（Data item）</code>包含任意数量、不同类型的<code>属性（Attribute）</code>，属性包括不同的<code>类型（Type）</code>。表使用键-值或文档数据模型。从表中读取条目时，开发人员可以要求<strong>强一致性</strong>或<strong>最终一致性</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>本文描述<strong>DynamoDB如何发展成一种分布式数据库服务，在多租户架构下为每个客户提供单租户体验。</strong> 解释了系统面临的挑战，以及如何改进系统以应对这些挑战。这些改进关系到持久性、可用性、可伸缩性和可预测性能这些共同的主题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>这篇论文总结了我们多年来学到的经验教训：</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>根据客户的流量模式来重塑数据库表的物理分区方案，可以提高客户体验。</li><li><strong>对静态数据持续进行校验</strong>是一种可靠的方法，可以防止硬件故障和软件Bug，实现高持久性。</li><li>随着系统的发展，维护高可用性需要<strong>严谨的操作规范和工具</strong>。复杂算法的形式证明、<a href="https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.concept.gameday.en.html">Game days</a>(模拟混乱和负载测试)、升级/降级测试和部署安全等机制使我们可以自由地对代码进行调整和实验，而不用担心会影响正确性。</li><li><strong>设计系统时更重视可预测性（predictability）而不是绝对效率（absolute efficiency）可以提高系统的稳定性。</strong>尽管缓存等组件可以提高性能，但不要允许它们隐藏在它们不存在的情况下将要执行的工作，以确保系统总是准备好处理意外情况。(While components such as caches can improve performance, do not allow them to hide the work that would be performed in their absence, ensuring that the system is always provisioned to handle the unexpected.)</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":1} -->
<h1 id="2-%E5%8E%86%E5%8F%B2">2 历史</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>设计DynamoDB的动机来源于对其前身Dynamo[9]的体会，Dynamo是亚马逊开发的第一个NoSQL数据库系统。创建Dynamo是为了满足对购物车数据的高可伸缩、高可用和持久的Key-Value数据库的需求。<strong>早些年，Amazon了解到，应用程序直接访问传统企业数据库实例的会导致伸缩性瓶颈</strong>，比如连接管理、并发工作负载之间的干扰，以及模式升级等任务的操作问题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>因此，采用<strong>面向服务的体系结构（service-oriented architecture）</strong>，提供服务层API来封装应用程序的数据可以充分解耦，以解决重新配置之类的问题，而不用中断客户端。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>高可用性</strong>是数据库服务的一个关键属性，因为任何停机都可能影响依赖这些数据的客户。Dynamo的另一个关键要求是<strong>可预测的性能</strong>，使应用程序能够为用户提供稳定的体验。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了实现这些目标，亚马逊在设计Dynamo时必须从第一原理出发。Dynamo广泛运用到亚马逊内部的多个使用场景，因为它是唯一一个提供大规模高可靠性的数据库服务。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>然而，Dynamo仍然具有自管理大型数据库系统（self-managed large database systems）的操作复杂性。</strong> Dynamo是一个单租户系统，团队自己负责Dynamo的安装和管理。团队成员必须了解数据库服务各个部分，由此带来的复杂操作成为使用障碍。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>那段时间，Amazon推出了新的服务(尤其是Amazon S3和Amazon SimpleDB)，它们专门提供<strong>无需管理</strong>和<strong>弹性</strong>的体验，以消除这种操作负担。虽然Dynamo通常更贴合应用程序的需求，但Amazon的工程师更喜欢使用这些不用自己管理的新服务。<strong>托管弹性服务将开发人员从数据库管理中解放出来，让他们能专注于自己的应用程序。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Amazon提供的第一个<strong>数据库即服务（database-as-a-service, 简称DBaaS）</strong> 是<strong>SimpleDB[1]</strong>，这是一个全托管的弹性NoSQL数据库服务。SimpleDB提供了<strong>多数据中心复制、高可用性和高持久性</strong>，不需要客户设置、配置或为其数据库打补丁。与Dynamo一样，SimpleDB提供非常<strong>简单的表接口（table interface）</strong>，包含有限的查询集合，可以作为开发人员的构件。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-02.png" alt="表1：DynamoDB中Item的CRUD APIs"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>虽然SimpleDB取得了成功，并支持许多应用程序，但是它有一些<strong>局限</strong>：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>表的存储容量(10GB)和请求吞吐量都很小。</li><li>不可预测的查询和写入延迟。这是因为所有表属性上都建立了索引，并且每次写入都需要更新索引。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>这些局限性为开发人员带来了一种新的操作负担。他们必须将数据划分到多个表以满足应用程序的存储和吞吐量需求。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>我们意识到，通过SimpleDB的API不可能消除SimpleDB的局限性，提供具备可预测性能和可扩展能力的NoSQL数据库服务。<strong>我们得出的结论是，更好的解决方案应该将Dynamo最初设计的最佳部分(增量可伸缩性和可预测的高性能)与SimpleDB的最佳部分(云服务的易于管理、一致性和比纯KV存储更丰富的基于表的数据模型)结合起来。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>这些关于架构的讨论在2012年推出Amazon DynamoDB这项公共服务时达到高峰。它的名字与之前的Dynamo大部分相同，但架构上几乎完全不同。Amazon DynamoDB是我们在为Amazon.com构建大规模非关系型数据库的过程中得到经验的结晶，它是基于我们在AWS构建高可伸缩和可靠云计算服务的经验发展来的。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="3-%E6%9E%B6%E6%9E%84">3 架构</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB <strong>表（table）</strong> 是 <strong>条目（item）</strong> 的集合，每个条目是 <strong>属性（attribute）</strong> 的集合。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>每个条目都由一个 <strong>主键（primary key）</strong> 唯一标识。主键的 <strong>模式（schema）</strong> 在表创建时指定。主键模式有两种：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>单纯的<strong>分区键（partition key）</strong></li><li><strong>分区键+排序键（sort key）</strong> 组成复合主键。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>分区键用作内部哈希函数的输入。哈希函数的输出和排序键(如果存在)决定条目将存储在哪里。具有复合主键的表中可能有多个分区键相同的条目，但是这些<strong>条目的排序键必须不同。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB还支持<strong>辅助索引（secondary index）</strong>，以提供更强的查询功能。一个表可以有一个或多个辅助索引。使用辅助索引可以加速非主键属性上的查询。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB提供简单的接口来从表和索引中存取和检索条目。表1包含客户端用于读写DynamoDB表中的条目的主要操作。插入、更新或删除条目等操作都可以指定一个条件，且操作必须满足这个指定的条件。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB<strong>支持ACID事务</strong>，使应用程序能够在更新多个条目的同时确保条目之间的原子性、一致性、隔离性和持久性(ACID)，且不影响DynamoDB表的可伸缩性、可用性和性能特征。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB中表被划分为多个<strong>分区（partitions）</strong>，以解决表的吞吐量和存储需求。表的每个分区都是连续但不相交的部分，称为<strong>键范围（key range）</strong> 。每个分区有多个副本，分布在不同的<strong>可用区（Availablity Zones）</strong> 上，以实现高可用和持久性。分区的副本组成<strong>复制组（replication group）</strong> 。<strong>复制组使用Multi-Paxos[14]进行leader选举和共识。</strong> 任何副本都可以举行选举，被选为领导（leader）的副本（replica）只要定期更新领导租约（leadership lease），就可以保持领导权。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>只有领导副本可以响应写请求和强一致性的读请求。</strong> 接收到写请求时，被写入key对应的复制组的leader会生成一条<strong>WAL（write ahead log）记录</strong>，并将它发送给其它副本节点。复制组中有足够数量的节点将日志记录到本地日志后，立刻向应用程序返回写入确认。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB支持<strong>强一致</strong>和<strong>最终一致</strong>的读取（Strongly and eventually consistent reads）。复制组中的任何副本都可以提供最终一致读。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>组leader通过<strong>租约机制</strong>延长领导权。<strong>如果组中任何一个成员发现leader出现故障(认为其不健康或不可用)，这个成员可以提议进行新一轮的选举</strong>，并选举自己成为新的leader。在前一个leader的租约到期之前，新leader不会执行任何写操作或一致的读操作。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-03.png" alt="图2：在存储节点中存储副本"/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-04.png" alt="图3：日志节点中的日志副本"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>复制组由<strong>存储副本（storage replica）</strong> 组成，其中包含<strong>预写日志（WAL）</strong> 和存储键值数据的<strong>B-tree</strong>，如图2所示。为了提高可用性和持久性，复制组可以存在只包含最近的预写日志条目的副本，如图3所示。这些副本称为<strong>日志副本（log replicas）</strong>。日志副本类似于Paxos中的acceptors。日志副本不存储键值数据。第5节和第6节会阐述日志副本如何使DynamoDB提高可用性和持久性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>（关于paxos算法，请参考：<a href="https://zh.wikipedia.org/wiki/Paxos%E7%AE%97%E6%B3%95">Paxos算法</a>）</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB由数十个微服务构成，其中部分<strong>核心服务包括元数据服务、请求路由服务、存储节点和自动管理服务</strong>，如图4所示。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>元数据服务（metadata service）</strong> 存储关于表、索引和键的复制组的路由信息。</li><li><strong>请求路由服务（request routing service）</strong> 负责授权、身份验证并将每个请求路由到适当的服务器。例如，所有读取和更新请求都路由到承载客户数据的存储节点。请求路由器从元数据服务查找路由信息。</li><li>所有资源创建、更新和数据定义请求都路由到<strong>自动管理服务（autoadmin service）</strong>。</li><li><strong>存储服务（storage service）</strong> 负责将客户数据存储在一个存储节点集群中。每个存储节点承载着许多不同分区的副本。</li></ul>
<!-- /wp:list -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-05.png" alt="图4：DynamoDB架构"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>自动管理服务是DynamoDB的中枢神经系统：</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>负责集群运行状况、分区运行状况、表的伸缩以及所有控制平面请求的执行。</li><li>持续监视所有分区的健康状况，并替换被认为不健康的副本(速度慢、响应不灵敏或托管在坏的硬件上)。</li><li>对所有核心组件进行健康状况检查，替换逐渐故障或已经故障的硬件。例如，如果自动管理服务检测到一个存储节点不健康，它会启动一个恢复进程来接管该节点上托管的副本，使系统恢复到稳定状态。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>还有其它图4中没有展示的DynamoDB服务，诸如时间点恢复（PITR）、按需备份、更新流、全局准入控制、全局表、全局辅助索引和事务等特性。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="4-%E4%BB%8E%E9%A2%84%E5%88%86%E9%85%8D%E5%88%B0%E6%8C%89%E9%9C%80%E4%BD%BF%E7%94%A8">4 从预分配到按需使用</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB发布时，<strong>我们引入了一个内部抽象——分区，作为动态扩展表的容量和性能的方法。</strong> 在最初的DynamoDB版本中，客户根据<strong>读容量单位(RCUs)</strong> 和<strong>写容量单位(WCUs)</strong> 显式地指定了表所需的吞吐量。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>对于大小不超过4kb的数据条目，一个RCU每秒可以执行一个强一致性的读请求。</li><li>对于大小不超过1kb的条目，一个WCU可以每秒执行一个标准写请求。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>RCUs和WCUs统称为<strong>分配吞吐量（provisioned throughtput）</strong>。<strong>原始系统将表划分为多个分区，将内容分布在多个存储节点上，并映射到这些节点的可用空间和性能上</strong>（The original system split a table into partitions that allow its contents to be spread across multiple storage nodes and mapped to both the available space and performance on those nodes.）。<strong>当一个表的需求发生变化时（因为大小增加或负载增加），可以进一步分割和迁移分区，以对表进行弹性伸缩。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>分区抽象被证明是非常有价值的，并且被保留下来成为DynamoDB设计的核心。<strong>然而，早期版本将容量和性能的分配紧密耦合到各个分区，带来一些问题。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB使用准入控制（admission control）来确保存储节点不会超载，避免同一个节点上的表分区之间产生干扰，保证客户所要求的吞吐量限制。</strong> 在过去的十年中，DynamoDB中的准入控制在不断发展。准入控制是所有存储节点对表的共同责任。存储节点根据本地存储分区的分配独立地执行准入控制。假设一个存储节点承载来自多个表的分区，那么分配给每个分区的吞吐量将用于隔离工作负载。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB限制单个分区可分配的最大吞吐量，确保<strong>存储节点上托管的所有分区的吞吐量之和小于或等于该节点最大吞吐量</strong>，这是由其存储驱动器的物理特性决定的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>当表的总吞吐量发生变化或分区被划分为子分区时，分配给分区的吞吐量会被调整。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>当对一个分区进行大小划分时，父分区分配到的吞吐量被平均分配到子分区中。</li><li>当一个分区进行吞吐量划分时，根据表分配到的吞吐量为新分区分配吞吐量。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>例如，假设一个分区可以容纳1000个WCUs的最大吞吐量：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>创建一个3200 WCUs的表，DynamoDB创建四个分区，每个分区将分配800个WCUs。</li><li>如果表提供的吞吐量增加到3600 WCUs，那么每个分区的容量将增加到900 WCUs。</li><li>如果表提供的吞吐量增加到6000个WCUs，那么将划分分区以创建8个子分区，每个分区将分配750个WCUs。</li><li>如果表的容量减少到5000 WCUs，那么每个分区的容量将减少到675 WCUs。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>之所以均匀地分配各个分区的吞吐量，是<strong>基于以下假设</strong>：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>应用程序均匀地访问表中的key</li><li>根据大小划分分区等价于对性能进行划分（splitting a partition for size equally splits the performance）。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>但是，我们发现在时间和key的范围两个维度上，应用程序工作负载的访问模式往往都是不统一的。<strong>如果一个表中的请求率不均匀，那么对分区进行分割并按比例划分性能，会导致分区的热部分（hot portion）的可用性能低于分割之前。</strong> 由于吞吐量是静态分配的，并在分区级别强制执行，虽然此时表的总吞吐量是足以满足其需求的，但这些不均匀的工作负载时不时会导致应用程序的读写被拒绝，即所谓的<strong>限流（throttling）</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>应用程序最常见的两个挑战是:<strong>热分区（hot partition）</strong> 和<strong>吞吐量稀释(throughput dilution)</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>当应用程序的流量持续流向表中的某些条目时，就会产生热分区。热点条目可以属于一组稳定的分区，也可以随时间跳转到不同的分区。</li><li>对于按大小划分分区的表，吞吐量稀释是常见的。根据大小分割一个分区会导致分区的吞吐量在新创建的子分区之间平均分配，因此每个分区的吞吐量会下降。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>从客户的角度来看，在这两种情况下，即使服务的行为符合预期，限流也会导致他们的应用程序在一段时间内不可用。想避免限流的客户可以通过增加表的分配吞吐量和预留冗余的容量来解决这个问题。换句话说就是给表分配过剩的资源。虽然这能使他们获得所需的性能，但体验并不好，因为很难估计应该给表分配多少性能。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="41-%E5%AF%B9%E5%87%86%E5%85%A5%E6%8E%A7%E5%88%B6%E7%9A%84%E5%88%9D%E6%AD%A5%E6%94%B9%E8%BF%9B">4.1 对准入控制的初步改进</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>正如本节前面所提到，热分区和吞吐量稀释源自于我们为每个分区绑定固定的性能分配，并在分区时分配性能。避免将分布式的准入控制复杂化，我们选择在单独的分区级别强制分配，但显然这些控制机制不能满足需求。在发布后不久，DynamoDB引入<strong>突发（bursting）</strong> 和<strong>自适应容量（adaptive capacity）</strong> 来解决这些问题。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 id="411-%E7%AA%81%E5%8F%91bursting">4.1.1 突发（Bursting）</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>分区访问的不平均使我们注意到，存储节点上各个分区并不是同时使用分配到的吞吐量。</strong> 为了在分区级别（partition level）吸收工作负载中的<strong>短时峰值（short-lived spikes）</strong>，DynamoDB引入了突发的概念。突发可以让应用程序在分区级别上尽可能利用未使用的容量以吸收短暂的峰值。<strong>DynamoDB在分区时保留一部分容量，供不超过300秒的突发吞吐量使用，在分区消耗的容量超过分配的容量时可以使用它。这部分未使用的容量称为突发容量（burst capacity）。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了保证负载隔离，只有在节点级别（node level）存在在未使用的吞吐量时Dynamo才允许使用突发。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>存储节点使用令牌桶（token bucktet）管理容量：</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>每个分区2个令牌桶，<strong>分配桶</strong>和<strong>突发桶</strong></li><li>每个节点1个令牌桶</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>通过这些桶进行准入控制：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>当一个读或写请求到达存储节点时，如果分区级别的分配桶中有令牌（token），接受该请求并<strong>从分区和节点的桶中扣除令牌。</strong></li><li>如果一个分区的分配桶令牌用完了，<strong>只有突发桶和节点令牌桶都有令牌剩余，才可以进行突发。</strong></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>读请求只检查本地令牌桶，而<strong>使用突发容量的写请求需要额外检查该分区的其他成员副本的节点令牌桶。</strong> 分区的leader副本定期收集每个成员节点级容量的信息。在4.3节会解释如何提高节点的突发能力。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 id="412-%E8%87%AA%E9%80%82%E5%BA%94%E5%AE%B9%E9%87%8Fadaptive-capacity">4.1.2 自适应容量（Adaptive Capacity）</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB使用<strong>自适应容量</strong>吸收突发容量无法处理的<strong>长时峰值（long-live spikes）</strong>。自适应容量使DynamoDB能更好地吸收跨多个分区的严重倾斜负载。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>自适应容量时常监控所有表的分配容量和消耗容量。<strong>如果一个表遇到限流，而且总吞吐量没有超过表级别分配给它的吞吐量，就会使用比例控制算法（proportional control algorithm）自动增加表分区分配的吞吐量。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>如果表消耗的容量超过了分配给它的容量，被提升的分区容量就会被削减。<strong>自动管理系统（autoadmin system）将被提升分区迁移到一个适当的节点，该节点有能力服务增加的吞吐量</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>适应性容量与突发一样是<strong>尽力而为（best-effort）</strong> 的机制，但可以消除99.99%以上由于倾斜访问模式产生的限流。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="42-%E5%85%A8%E5%B1%80%E5%87%86%E5%85%A5%E6%8E%A7%E5%88%B6global-admission-control">4.2 全局准入控制（Global Admission Control）</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>虽然DynamoDB使用突发和自适应容量极大地减少了非均匀访问导致的吞吐量问题，但这<strong>两种解决方案都有局限性</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>突发只能处理短时峰值，依赖节点冗余的吞吐量实现突发。</li><li>适应性能力是被动的，只有在出现限流后才能发挥作用。换句话说使用该表的应用程序已经经历了短暂的不可用。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>从突发容量和自适应容量总结出的重要经验是，我们使分区级容量与准入控制的耦合过于紧密，准入控制在分区级别分布执行。</strong> DynamoDB项目组意识到更好的做法是提供工作负载隔离的同时，解耦准入控制和分区让分区可以随时突发（DynamoDB realized it would going to be beneficial to remove admission control from the partition and let the partition burst <em>always</em> while providing workload isolation.）</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了解决准入控制的问题，DynamoDB用<strong>全局准入控制(GAC)</strong> 代替自适应容量，GAC同样使用令牌桶的思想。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GAC服务通过令牌跟踪表容量的总消耗。每个<strong>请求路由器（request router）</strong> 维护一个本地令牌桶以执行准入控制，定期(几秒钟的间隔)与GAC通信以补充令牌。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GAC根据客户端请求动态地维护一个<strong>临时状态</strong>。每个GAC服务器的停止和重新启动不会对服务整体造成影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>根据不同的配置，每个GAC服务器可以跟踪一个或多个令牌桶。所有GAC服务器都是一个独立哈希环（hash ring）的一部分。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>请求路由器在本地管理带时间限制的令牌。当来自应用程序的请求到达时，请求路由器扣除令牌。一段时间后，请求路由器会因为使用或过期而耗尽令牌。耗尽令牌时请求路由器向GAC请求更多令牌。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GAC实例通过客户端提供的信息估算全局令牌消耗，并将下一个时间单元可用的令牌分配给客户端的整体令牌份额。因此能够保证那些只访问部分条目的不均匀负载可以在最大分区容量下执行。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>除了全局准入控制（GAC）外，分区级令牌桶也被保留下来作为最后防线。<strong>限制这些令牌桶的容量，以确保一个应用程序不会消耗存储节点上的全部或大部分资源。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="43-%E5%AE%B9%E9%87%8F%E6%B6%88%E8%80%97%E5%9D%87%E8%A1%A1">4.3 容量消耗均衡</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>为了让分区能够<strong>常时突发（always blust）</strong>，要求DynamoDB更有效地管理突发容量。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB可以运行在各种各样硬件实例类型（instance type）上，这些实例类型的吞吐量和存储能力各不相同。最新一代存储节点可以承载数千个分区副本。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>驻留在单个存储节点上的分区可能完全不相关，且属于不同的表。要在存储节点上托管来自多个表的副本（每个表可能来自不同的客户并有不同的流量特征）需要定义一个分配机制，这个机制决定哪些副本可以在不违反可用性、可预测的性能、安全性和弹性等关键指标的前提下和平共处。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>对于固定分配吞吐量的表，托管（Colocation）是一个简单的问题。由于有静态分区，在分配模式下托管更容易管理，静态分区使分配方案简单合理。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在分配表不使用突发和自适应容量的情况下，分配过程包括根据分配的容量找到能够容纳分区的存储节点。分区不允许使用的流量超过分配的容量，因此不会影响到节点上的其它分区。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>存储节点上的分区不会用尽实例上的总容量。</strong> 为了应对负载变化而进行突发时，可能会超出存储节点的额定容量，这时候的租户托管问题变得更为复杂。因此，系统会在存储节点中装入一组额外的副本，使实际容量大于节点的额定容量。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB实现了一个可以根据吞吐量消耗和存储量来主动平衡跨节点分区的系统</strong>，以降低副本过于聚集带来的可用性风险。每个存储节点自主监视所有托管副本的总体吞吐量和数据大小。<strong>如果吞吐量超过节点最大容量的某个百分比阈值，就会向自动管理服务（autoadmin service）报告可以当前节点迁移的候选分区副本列表（list of candidate partition replicas）。</strong> 自动管理会在同一个或另一个可用域（Availability Zone，即数据中心）中找到没有该分区副本的新存储节点。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="44-%E6%B6%88%E8%80%97%E5%88%92%E5%88%86">4.4 消耗划分</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>即使引入GAC和分区常时突发，如果表的流量在特定的条目集合上倾斜，表仍然会被限流。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了解决这个问题，<strong>DynamoDB会根据消耗的吞吐量自动扩展分区。</strong> 一旦某个分区消耗的吞吐量超过某个阈值，就会对该分区进行分割。<strong>键范围中的分割点根据分区观察到的键分布（key distribution）来选择。</strong> 即监控负载在键范围上的分布状态，将其作为应用程序访问模式的表达（proxy），比单纯在键范围的中点分割更有效。分区分割通常在以分钟为数量级的时间内完成。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>划分对某些工作负载无效，例如：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>在单条目上频繁访问的分区</li><li>按顺序访问键范围的分区</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>DynamoDB能够检测到这类访问模式，不会分割这样的分区。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="45-%E6%8C%89%E9%9C%80%E5%88%86%E9%85%8D">4.5 按需分配</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>许多迁移到DynamoDB的应用程序以前运行在本地或自托管的数据库上。在这两种场景下，应用程序开发人员都必须分配服务器。DynamoDB提供一个简化的Serverless操作模型和一个用于分配的新模型——<strong>读写容量单位（read and write capacity units）</strong>。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>容量单位的概念对客户来说比较陌生，有人觉得要预测需要分配多少吞吐量比较困难。正如本节开头提到的，客户要么分配过剩，导致低利用率，要么供应不足，导致限流。为了改善高负荷的客户体验，我们推出了<strong>按需分配表（on-demand table）</strong>。按需分配表消除了我们的客户需要自行计算分配量的问题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>DynamoDB通过收集读写信号，根据消耗的容量按需进行分配，能马上吸收该表先前峰值两倍的流量。如果一个应用程序需要超过上一个表峰值两倍以上的流量，DynamoDB会随着流量增加自动分配更多的容量，确保工作负载不会受到限流。</strong> 按需扩展表通过划分分区消耗实现。分割决策算法是基于流量的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>GAC使DynamoDB可以监视并保护系统，防止一个应用程序消耗完所有资源。按需分配表的分区可以被合理地存储，根据消耗的容量进行有效的平衡，从而不会遇到节点级别的限制。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="5-%E6%8C%81%E4%B9%85%E6%80%A7%E5%92%8C%E6%AD%A3%E7%A1%AE%E6%80%A7">5 持久性和正确性</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>数据在commit后不能丢失。实际运行中硬件故障、软件bug或硬件bug都可能导致数据丢失。DynamoDB的设计包括预防、检测和纠正任何潜在数据丢失的机制，具有高持久性。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="51-%E7%A1%AC%E4%BB%B6%E6%95%85%E9%9A%9C">5.1 硬件故障</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>与大多数数据库管理系统一样，预写日志（write ahead log）[15]对于DynamoDB的持久性和崩溃恢复至关重要。<strong>预写日志存储在一个分区的所有三个副本中。为了实现更高的持久性，预写日志定期归档到S3，S3是一个为持久性设计的对象存储。</strong> 每个副本包含最近的预写日志，这些日志存档之后会被归档。未归档日志的大小通常为几百兆字节。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在大型服务中，内存和磁盘等硬件故障很常见。当一个节点发生故障时，节点上承载的所有复制组只剩下两个副本。修复存储副本的过程可能需要几分钟，因为需要复制B-tree和预写日志。<strong>在检测到不健康的存储副本时，复制组的leader会增加一份日志副本，以确保不会对持久性造成影响。</strong> 添加日志副本只需要几秒钟，因为系统只需要将最近的预写日志从健康副本复制到新副本，而不需要复制B-tree。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>因此，通过日志副本快速修复受影响的复制组可以确保写入具有的高持久性。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="52-%E9%9D%99%E9%BB%98%E6%95%B0%E6%8D%AE%E9%94%99%E8%AF%AF">5.2 静默数据错误</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>一些硬件故障会导致存储数据错误[5,7]。根据我们的经验，这些错误可能发生在存储媒介、CPU或内存[5]。不幸的是，这些错误很难检测到，因为它们可能发生在系统的任何地方。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB使用大量的<strong>checksums（checksums）</strong> 来检测静默错误。DynamoDB在每个日志条目、消息和日志文件中维护checksums，以验证两个节点间每次数据传输的完整性。这些checksums防止错误扩散到系统其他部分。<strong>因为这些消息在到达目的地之前可能要经过各个层的转换，需要计算节点或组件之间的每个消息checksums并进行验证</strong>，如果没有这些检查，任何一层都可能引入静默错误。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>归档到S3的每个日志文件都有一个清单，包含关于日志的信息，比如表、分区以及日志文件中存储的数据的开始和结束标记。负责将日志文件归档到S3的<strong>代理（agent）</strong> 在上传数据之前执行各种检查，包括(但不限于)：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>验证每个日志条目以确保它属于正确的表和分区</li><li>验证checksums以检测静默错误</li><li>验证日志文件的序列号中没有任何漏洞</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>所有检查都通过，日志文件和清单就会被归档。复制组的所有三个副本上都运行一个日志归档代理。如果某个代理发现日志文件已经被归档过，就会将已归档的文件下载下来和本地的预写日志进行比较，以验证数据的完整性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>所有日志文件和清单文件，连同内容的checksums被上传到S3。<strong>执行put操作时S3会对内容checksums进行检查</strong>，防止数据传输到S3期间出现错误。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="53-%E6%8C%81%E7%BB%AD%E9%AA%8C%E8%AF%81">5.3 持续验证</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB还会持续地验证静态数据。我们的目的是检测系统中出现的静默数据错误或比特衰变（bit rot：指存储在存储介质中的数据的性能和完整性缓慢恶化。这个持续验证过程类似于<strong>擦拭（scrub）</strong> 。Scrub的目标是检测出意料之外的错误，例如比特衰变。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Scrub过程运行并验证两件事：</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>复制组中三个副本的数据相同</li><li>线上副本数据与使用归档的预写日志条目离线构建的副本数据相匹配</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>使用归档的日志构建副本的过程会在5.5节解释。验证过程先计算活动副本的checksums，然后将其与S3中归档的日志条目生成的快照进行匹配。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Scrub机制可以作为深层防御，用于检测线上存储副本与通过建表时日志构建的副本之间的差异。这些全面的检查极大提高了系统运行的可信度。类似的持续验证技术也用于验证全局表（global table）的副本。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>这些年来我们已经认识到对静态数据进行持续验证是防止硬件故障、静默数据损坏甚至软件bug的最可靠方法。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="54-%E8%BD%AF%E4%BB%B6%E9%94%99%E8%AF%AF">5.4 软件错误</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB是一个构建在复杂基座上的分布式键值存储。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>高度的复杂性增加了设计、编码和运维中出现人为错误的概率。系统中的错误可能导致数据丢失、损坏或违反其它我们对客户保证的接口契约。我们广泛地使用形式化方法[16]来确保复制协议的正确性。<strong>核心的复制协议使用TLA+[12,13]进行规范。在添加影响复制协议的新特性时，会将其合并到规范和模型检查中。</strong> 模型检查使我们在代码投入生产之前找出可能导致持久性和正确性问题的微小bug。S3[6]等其他服务也发现模型检查在类似的场景中很有用。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>我们还采用了大量的故障注入测试和压力测试，确保部署的每一个软件的正确性。除了在数据平面（data plane）测试和验证复制协议外，我们还使用形式化方法来验证控制平面（control plane）和分布式事务等特性的正确性。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="55-%E5%A4%87%E4%BB%BD%E5%92%8C%E6%81%A2%E5%A4%8D">5.5 备份和恢复</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>除了防止物理介质损坏之外，DynamoDB还支持备份和恢复，以防止客户应用程序中由于bug导致的逻辑损坏。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>由于通过归档在S3中的预写日志构建，备份或恢复不会影响表的性能或可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>备份可以在多个分区间保持一致，时间范围是直到上一秒。备份是DynamoDB表的完整副本，存储在Amazon S3 bucket中，可以在任意时刻将备份数据恢复到新的DynamoDB表。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB还支持<strong>时间点恢复（point-in-time restore，简称PITR）</strong>。通过时间点恢复，客户可以将过去35天内任何时间点的表内容恢复到同一区域（Region）的不同DynamoDB表。如果一张表启用了时间点恢复，DynamoDB会定期创建该表的分区快照并上传到S3，分区快照的创建周期由该分区累积的预写日志数量决定。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>通过快照与预写日志实现时间点恢复。在收到对表进行时间点恢复的请求后，DynamoDB为表的所有分区找到距离请求时间最近的快照，重放恢复请求中的时间戳之前的日志，然后创建表的快照并恢复它。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="6-%E5%8F%AF%E7%94%A8%E6%80%A7">6 可用性</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>为了实现高可用性，DynamoDB表在一个地区的多个可用域（Availability Zone）之间分布和复制。<strong>DynamoDB定期测试节点、机架和可用域的故障恢复能力。</strong> 例如，想测试服务整体的可用性和持久性，对其进行关机测试；使用仿真流量，通过作业调度器随机关闭节点。在所有关机测试结束后，通过测试工具将验证存储在数据库中的数据在逻辑上是有效且没有损坏的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>本节将详细介绍过去十年中为确保高可用性解决的一些挑战。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="61-%E5%86%99%E5%92%8C%E4%B8%80%E8%87%B4%E6%80%A7%E8%AF%BB%E5%8F%AF%E7%94%A8%E6%80%A7">6.1 写和一致性读可用性</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>分区的写可用性取决于是否具有健康的leader和合法的写仲裁（write quorum）。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在DynamoDB中，<strong>合法的写仲裁需要来自不同可用域的三个副本中的两个参与。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>只要有一个主副本和足够多的健康副本参加写仲裁，分区就处于可用状态。</li><li>如果副本数量小于举行仲裁所需的最少节点数，则该分区无法写入。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>如果其中一个副本没有响应，则leader向组中添加一个日志副本（log replica）。</strong> 添加日志副本是确保写仲裁始终可用的最快方法，最小化由于不合法的写仲裁而对写可用性造成的中断。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Leader副本提供一致性读取。</strong> 引入日志副本对系统来说是一个很大的改变，经过形式化证明的Paxos实现让我们能放心地对系统进行调整和试验，以实现更高的可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>我们已经能够在一个带有日志副本的区域（Region）中运行数百万个Paxos组。最后任何副本都可以提供一致的读取。如果leader副本故障，其他副本检测到它的故障，并选举一个新的leader，以尽量减少一致性读取的中断。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="62-%E6%95%85%E9%9A%9C%E6%A3%80%E6%B5%8B">6.2 故障检测</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>新当选的leader必须等就leader的租约到期后才能提供流量服务。虽然这只是几秒钟的时间，但当选的leader在这段时间无法接受新的写入或一致的读取流量，因此破坏了可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>高可用性系统的关键组件之一是对leader的故障检测。</strong> 故障检测必须快速而可靠，尽量减少中断。错误检测中的误报可能会导致可用性的更多中断。当组内每个副本都与leader失去连接时，故障检测运行效果很好。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>但是，节点可能会遇到<strong>灰色网络故障（gray network failure）</strong>。灰色网络故障可能是由于leader和follower之间存在通信问题、节点的出站/入站通信问题或前端路由器与leader之间存在通信问题，而事实上leader和follower可以相互通信。灰色故障会破坏可用性，因为在故障检测中存在假阳性或没有检测到故障。例如，某个副本没接收到leader的心跳包（heartbeats），就会尝试选举一个新的leader，如上一节所述，这会破坏可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了解决灰色故障导致的可用性问题，试图触发故障切换的follower向复制组中的其他副本发送消息，询问它们是否可以与leader通信，如果收到leader健康的响应消息，则follower将不再举行leader选举。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB所使用改进版故障检测算法极大减少了误报的数量，从而减少了无效的leader选举。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="63-%E6%B5%8B%E9%87%8F%E5%8F%AF%E7%94%A8%E6%80%A7">6.3 测量可用性</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB是为<strong>全局表99.999%达到可用性</strong>和<strong>区域表99.99%达到可用性</strong>设计的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>可用性以每5分钟为间隔，计算DynamoDB成功处理请求的百分比。</strong> 为了确保达到这些目标，DynamoDB持续监控服务和表级别的可用性。监控得到的可用性数据用于分析客户感知的可用性趋势，并在客户感知的错误超过某个阈值时触发警报，这些警报称为面向客户的警报(customer-facing alarms，简称CFA)。CFA报告任何与可用性相关的问题，并主动地进行自动修复或通过操作员干预缓解问题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>除了实时跟踪之外，系统还运行触发性的日常聚合作业，计算每个客户的可用性聚合指标（aggregate availablity metrics）。将聚合结果上传到S3，以便定期分析可用性趋势。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB还可以从客户端观测可用性并发出警报。有两组客户端专门用于测量用户感知（user-perceived）的可用性。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>第一组客户端是使用DynamoDB作为数据存储的Amazon内部服务，这些服务共享它们的软件所观察到的DynamoDB API调用的可用性指标。</li><li>第二组客户端是DynamoDB金丝雀程序。这些程序在区域（Region）中的每个可用域上运行，并通过所有公共端点（endpoint）与DynamoDB通信。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>真实的应用程序流量使我们能够推断出客户感知到的DynamoDB可用性和延迟，并排查出灰色故障[10,11]。经它们能很好地反映客户可能或正在经历的长期和短期趋势。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="64-%E9%83%A8%E7%BD%B2">6.4 部署</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>与传统的关系数据库不同，DynamoDB负责部署，不需要维护窗口且不会影响客户体验的性能和可用性。进行软件部署的原因有很多，包括新特性、bug修复和性能优化，通常需要更新大量服务。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB定时推送软件更新。部署将软件从一种状态转换为另一种状态。<strong>部署的新软件要经过一个完整的开发和测试周期，才能认为代码是正确可信的。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>多年来，通过多次部署，DynamoDB已经认识到重要的不仅仅是结束状态和开始状态。<strong>有时候新部署的软件可能无法工作需要回滚，回滚后状态可能与软件的初始状态不同。</strong> 测试中回滚过程经常被忽略从而对客户造成影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>每次部署之前DynamoDB都会在组件级别上运行一套升级和降级测试。</strong> 然后，对软件进行有目的的回滚，然后运行功能测试进行测试。DynamoDB发现这个过程有助于排查问题，否则在需要时很难回滚。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在单个节点上部署软件与在多个节点上部署软件有很大的不同。<strong>部署在分布式系统中不是原子的（atomic），在任何给定的时间都会有软件在一些节点上运行旧代码，在集群的其他部分运行新代码。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>分布式部署的另一个挑战是，<strong>新软件可能会引入一种新的消息类型或者更改了协议使得系统中的旧软件无法理解。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB通过<strong>读写部署（read-write deployment）</strong> 处理这类更改。读写部署是一个多步骤的过程：</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>第一步是部署软件来读取新的消息格式或协议。</li><li>一旦所有节点都能处理新消息，软件就会更新以发送新消息。</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>通过软件部署也可以启用新消息。读写部署使两种类型的消息可以在系统中共存。即使经过回滚，系统也可以同时理解新旧两种消息。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>所有部署都是先在一小部分节点上完成，然后再将它们部署到整个集群节点上。这样的策略降低了部署错误的潜在影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB为可用性指标的设置了告警阈值，如果部署期间的错误率或延迟超过阈值，系统将触发自动回滚。部署到存储节点的软件会触发不影响可用性的leader故障转移：Leader副本直接放弃领导权，新的leader不需要等待旧leader的租约到期。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="65-%E5%A4%96%E9%83%A8%E6%9C%8D%E5%8A%A1%E4%BE%9D%E8%B5%96">6.5 外部服务依赖</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>为了确保高可用性，<strong>请求路径（request path）中DynamoDB依赖的所有服务的可用性都应该比DynamoDB更高，或者DynamoDB应该能够在所依赖的服务故障时继续运行。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB请求路径依赖的服务包括AWS Identity和Access Management Service(IAM)[2]，以及使用客户密钥加密表的AWS Key Management(AWS KMS)[3]。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB使用IAM和AWS KMS对每个客户请求进行身份验证。虽然这些服务具有高可用性，但DynamoDB的设计使它能够在这些服务不可用时继续运行，且不会牺牲这些系统提供的任何安全性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在使用IAM和AWS KMS的情况下，DynamoDB采用一个稳定的静态设计[18]，即使一个依赖挂掉，整个系统仍能保持工作。系统可能看不到该依赖项原本应该交付的更新信息。虽然依赖挂掉了，但挂掉之前存下的信息还可以继续使用。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB在对每个请求进行身份验证的请求路由器中缓存来自IAM和AWS KMS的结果。<strong>DynamoDB定期异步刷新缓存的结果。</strong> 即使IAM或KMS不可用，路由器仍将在预设的一段时间内继续使用缓存的结果，向没有缓存结果的请求路由器发送操作的客户机会受到影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>然而，在实践中当AWS KMS或IAM挂掉时我们发现只会产生很小的影响。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>此外，<strong>缓存可以消除对下层的调用（off-box call）从而改善响应时间，在系统处于高负载时这点非常有用。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="66-%E5%85%83%E6%95%B0%E6%8D%AE%E5%8F%AF%E7%94%A8%E6%80%A7">6.6 元数据可用性</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>请求路由器中最重要的元数据是<strong>表的主键到存储节点之间的映射</strong>。启动时DynamoDB将元数据存储在DynamoDB中。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>路由信息（routing information）</strong> 包括表的所有分区、每个分区的键范围以及承载该分区的存储节点。当路由器收到一个它从未见过的表的请求时，它会下载整个表的路由信息并缓存到本地。关于分区副本的配置信息很少更改，因此缓存命中率大约有99.75%。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>引入缓存带来的问题是会导致<strong>双峰行为（bimodal behavior）</strong>。在请求路由器有缓存为空的冷启动（cold start）情况下，每个DynamoDB请求都需要查找元数据，对应的服务的请求处理速度必须与DynamoDB的请求处理速度相匹配。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>我们观测到向请求路由器集群增加新容量时，受此影响元数据服务的流量会飙升到75%. 因此,引入新请求路由器会影响性能，并可能导致系统不稳定。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>此外，无效的缓存可能会引发系统其他部分的级联故障（cascading failure），因为数据源无法承受更多的直接负载[4]。（Dynamo的一次更新中引入了一个bug，使元数据服务无法及时响应存储节点的查询请求，导致大量重复的元数据查询，影响了集群中的大片节点。）</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB希望消除并显著减少请求路由器和其他元数据客户端对本地缓存的依赖，同时不影响客户请求的延迟。在处理请求时路由器只需要请求的Key所在的分区信息，因此获取整个表的路由信息是一种浪费，特别是那些有许多分区的大型表。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了以低成本的方式降低元数据扩张和可用性风险，<strong>DynamoDB构建了一个名为MemDS的内存分布式数据存储。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>MemDS将所有元数据存储在内存中，并在MemDS集群中进行复制。对MemDS进行水平扩展以处理DynamoDB的所有传入请求率。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>数据被高度压缩。节点上的MemDS进程封装了<strong>Perkle数据结构</strong>，它是Patricia树[17]和Merkle树的混合。Perkle树可以插入键和关联值，然后使用完整键或键前缀进行查找。此外，由于键按顺序存储，因此也支持如<code>lessThan</code>、<code>greaterThan</code>和<code>between</code>这样的范围查询。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>MemDS的Perkle树还另外支持两种特殊的查找操作：<code>floor</code>和<code>ceiling</code>。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><code>floor</code>接受一个键，并从Perkle返回一个存储的条目，该条目的键小于或等于给定的键。</li><li><code>ceiling</code>与此类似，但返回键大于或等于给定键的条目。</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>在每个请求路由器主机上部署新的分区映射缓存，以避免原始请求路由缓存中出现的双峰现象。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>在新的缓存中，即使缓存命中也会MemDS异步访问元数据服务以刷新缓存。</strong> 因此不管缓存命中率如何，新的缓存使MemDS集群始终以恒定的流量提供服务。传统缓存的后端流量由缓存命中率决定，与传统缓存相比，MemDS集群流向元数据集群的恒定流量增加了负载，但避免了在缓存失效时将故障级联到系统的其他部分。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DynamoDB存储节点是分区成员数据（partitin membership data，节点上分区的分配情况称为 <strong>“membership.”</strong>[4]）的权威来源。<strong>存储节点将分区成员更新信息推送到MemDS</strong>，每个分区成员的更新会传播到所有MemDS节点。如果MemDS提供的分区成员信息失效，那么访问到的错误存储节点要么响应最新的成员信息（如果它知道的情况下），要么响应一个错误代码，触发请求路由器查找另一个MemDS。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="7-%E5%BE%AE%E5%9F%BA%E5%87%86%E6%B5%8B%E8%AF%95">7 微基准测试</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>为了<strong>证明伸缩性不会影响应用程序感受到的延迟</strong>，我们运行了类型A（50%读取和50%更新）和B（95%读取以及5%的更新）两种YCSB[8]测试。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>这两个基准测试都使用了均匀的键分布，条目大小为900字节。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>测试在北弗吉尼亚地区的DynamoDB上运行，工作负载从每秒10万个操作扩大到每秒100万个操作。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>图5展示了两次测试中读延迟的50百分位和99百分位。该图表明，**即使在不同的吞吐量下，DynamoDB读延迟的差异也很小。**即使工作负载的吞吐量增加，读延迟仍然相同。工作负载B的读吞吐量是工作负载A的两倍，但延迟的差异仍然很小。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>图6展示了两个工作负载的写延迟的50百分位和99百分位。与读延迟一样，<strong>无论工作负载的吞吐量如何变化，写延迟始终保持平稳。</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在进行YCSB测试时，负载A产生的吞吐量高于负载B，但两者测量出来的写延迟基本相同。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-06.png" alt="图5：YCSB读延迟"/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="images/image-07.png" alt="图6：YCSB写延迟"/></figure>
<!-- /wp:image -->

<!-- wp:heading {"level":1} -->
<h1 id="8-%E7%BB%93%E8%AE%BA">8 结论</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DynamoDB开创了云原生NoSQL数据库领域。它是成千上万个应用程序的关键组成部分，每天应用于衣食住行各个领域。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>开发人员通过它来扩展数据工作负载，同时提供稳定的性能、高可用性和低操作复杂性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>十多年来，DynamoDB一直维护着这些关键特性，并通过一些革新性的特性(如按需容量、时间点备份和恢复、多区域复制和原子事务)吸引了众多开发者。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 id="%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE">参考文献</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[1] Amazon SimpleDB: Simple Database Service. <a href="https://aws.amazon.com/simpledb/">https://aws.amazon.com/simpledb/</a>.<br>[2] AWS Identity and Account Management Service. <a href="https://aws.amazon.com/iam/">https://aws.amazon.com/iam/</a>.<br>[3] AWS Key Management Service. <a href="https://aws.amazon.com/kms/">https://aws.amazon.com/kms/</a>.<br>[4] Summary of the amazon dynamodb service disrution and related impacts in the us-east region. 2015. <a href="https://aws.amazon.com/message/5467D2/">https://aws.amazon.com/message/5467D2/</a>.<br>[5] L. N. Bairavasundaram, A. C. Arpaci-Dusseau, R. H. Arpaci-Dusseau, G. R. Goodson, and B. Schroeder. An analysis of data corruption in the storage stack. ACM Transactions on Storage (TOS), 4(3):1–28, 2008.<br>[6] J. Bornholt, R. Joshi, V . Astrauskas, B. Cully, B. Kragl, S. Markle, K. Sauri, D. Schleit, G. Slatton, S. Tasiran, J. V an Geffen, and A. Warfield. Using lightweight formal methods to validate a key-value storage node in amazon s3. In Proceedings of the ACM SIGOPS 28th Symposium on Operating Systems Principles, SOSP ’21, page 836–850, New Y ork, NY , USA, 2021. Association for Computing Machinery.<br>[7] C. Constantinescu, I. Parulkar, R. Harper, and S. Michalak. Silent data corruption—myth or reality? In 2008 IEEE International Conference on Dependable Systems and Networks With FTCS and DCC (DSN), pages 108–1. IEEE, 2008.<br>[8] B. F. Cooper, A. Silberstein, E. Tam, R. Ramakrishnan, and R. Sears. Benchmarking cloud serving systems with ycsb. In Proceedings of the 1st ACM symposium on Cloud computing, pages 143–154, 2010.<br>[9] G. DeCandia, D. Hastorun, M. Jampani, G. Kakulapati, A. Lakshman, A. Pilchin, S. Sivasubramanian, P . V osshall, and W. V ogels. Dynamo: Amazon’s highly available key-value store. SIGOPS Oper . Syst. Rev., 41(6):205–220, oct 2007.<br>[10] T. Hauer, P . Hoffmann, J. Lunney, D. Ardelean, and A. Diwan. Meaningful availability. In 17th {USENIX} Symposium on Networked Systems Design and Implementation ({NSDI} 20), pages 545–557, 2020.<br>[11] P . Huang, C. Guo, L. Zhou, J. R. Lorch, Y . Dang, M. Chintalapati, and R. Y ao. Gray failure: The achilles’heel of cloud-scale systems. In Proceedings of the 16th Workshop on Hot Topics in Operating Systems, pages 150–155, 2017.<br>[12] L. Lamport. Specifying systems, volume 388. Addison-Wesley Boston, 2002.<br>[13] L. Lamport. The pluscal algorithm language. In International Colloquium on Theoretical Aspects of Computing, pages 36–60. Springer, 2009.<br>[14] L. Lamport et al. Paxos made simple. ACM Sigact News, 32(4):18–25, 2001.<br>[15] C. Mohan, D. Haderle, B. Lindsay, H. Pirahesh, and P . Schwarz. Aries: A transaction recovery method supporting fine-granularity locking and partial rollbacks using write-ahead logging. ACM Transactions on Database Systems (TODS), 17(1):94–162, 1992.<br>[16] C. Newcombe, T. Rath, F. Zhang, B. Munteanu, M. Brooker, and M. Deardeuff. How amazon web services uses formal methods. Communications of the ACM, 58(4):66–73, 2015.<br>[17] K. Sklower. A tree-based packet routing table for berkeley unix. In USENIX Winter, volume 1991, pages 93–99. Citeseer, 1991.<br>[18] B. Weiss and M. Furr. Static stability using availability zones. <a href="https://aws.amazon.com/builders-library/static-stability-using-availability-zones/">https://aws.amazon.com/builders-library/static-stability-using-availability-zones/</a>.</p>
<!-- /wp:paragraph -->
