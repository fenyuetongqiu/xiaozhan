---
title: 小游戏
date: 2026-11-01
tags:
 - 游戏
categories:
 - 小游戏
---

都是自己写的单文件网页游戏，不用下载、不用登录，点开就能玩。

::: tip
手机也能玩，横屏更舒服。卡的话按 F5 刷新一下。
:::

## 小球成名之战

19 个角色的 1v1 / 3v3 大乱斗，四个难度（地狱是真的地狱）。

<div class="game-frame">
  <iframe :src="$withBase('/play/ball/index.html')" loading="lazy" allowfullscreen></iframe>
</div>

## 大肥鱼快跑

一路往前跑、躲开障碍，越跑越快。

<div class="game-frame">
  <iframe :src="$withBase('/play/run/index.html')" loading="lazy"></iframe>
</div>

## 人生重开模拟器

抽天赋、掷属性，看看这辈子能活成什么样。

<div class="game-frame">
  <iframe :src="$withBase('/play/life/index.html')" loading="lazy"></iframe>
</div>

## 深夜便利店与大肥鱼

凌晨三点的便利店，来的人都有点心事。

<div class="game-frame">
  <iframe :src="$withBase('/play/shop/index.html')" loading="lazy"></iframe>
</div>

## 一条街（半成品）

把日子一小块一小块搭起来的经营游戏，还在改。

<div class="game-frame">
  <iframe :src="$withBase('/play/street/index.html')" loading="lazy"></iframe>
</div>

<style>
.game-frame { position: relative; width: 100%; max-width: 900px; margin: 10px auto 28px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(40,70,120,.18); background: #f6f7fb; }
.game-frame iframe { display: block; width: 100%; height: 560px; border: 0; }
@media (max-width: 700px) { .game-frame iframe { height: 420px; } }
</style>
