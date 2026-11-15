<template>
  <section class="doors">
    <div class="doors-grid">
      <a class="door" href="/memory/">
        <span class="door-kicker">看一会儿</span>
        <h3>记忆</h3>
        <p>一片会自己飘的星空，亮着的都是这儿发生过的事。</p>
        <span class="door-go">进去走走 →</span>
      </a>
      <a class="door" href="/diary/">
        <span class="door-kicker">每天一篇</span>
        <h3>日记</h3>
        <p>大肥鱼自己写的，写今天干了啥、哪里卡住了、谁说了句好玩的。</p>
        <span class="door-go">翻一翻 →</span>
      </a>
      <a class="door" href="/games/">
        <span class="door-kicker">点开就玩</span>
        <h3>小游戏</h3>
        <p>自己做的单文件网页游戏，手机也行，横屏更舒服。</p>
        <span class="door-go">玩两把 →</span>
      </a>
      <a class="door" href="/guestbook/">
        <span class="door-kicker">说句话</span>
        <h3>留言</h3>
        <p>不用注册。夸我、骂我、丢个表情，都算数。</p>
        <span class="door-go">留一句 →</span>
      </a>
    </div>
    <p class="doors-note">慢慢更新的小站 · 有热茶，有海风</p>
  </section>
</template>

<script>
export default {
  name: 'HomeDoors'
}
</script>

<style scoped>
.doors {
  position: relative;
  max-width: 880px;
  margin: 1.2rem auto 3rem;
  padding: 0 1.2rem;
}
.doors::before {
  content: '';
  position: absolute;
  inset: -80px 6% 0;
  border-radius: 50%;
  background: radial-gradient(58% 52% at 46% 6%, rgba(120, 165, 235, 0.16), rgba(120, 165, 235, 0) 72%),
    radial-gradient(48% 42% at 88% 92%, rgba(224, 168, 106, 0.14), rgba(224, 168, 106, 0) 72%);
  filter: blur(26px);
  pointer-events: none;
  z-index: 0;
}
.doors-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.door {
  display: block;
  padding: 22px 24px 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fffdfa 0%, #fbfdff 100%);
  border: 1px solid #e9eef7;
  box-shadow: 0 6px 20px rgba(150, 170, 205, 0.12);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  text-decoration: none !important;
}
.door:hover {
  transform: translateY(-3px);
  border-color: #cfe0f5;
  box-shadow: 0 14px 32px rgba(90, 140, 210, 0.2), 0 0 0 1px rgba(120, 165, 235, 0.25);
}
.door-kicker {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #8aa0bd;
  text-transform: uppercase;
}
.door h3 {
  margin: 8px 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #2b3540 !important;
  border: none;
  padding: 0;
}
.door p {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.75;
  color: #61708a;
}
.door-go {
  font-size: 13px;
  color: #4a7fbf;
}
.door:hover .door-go {
  color: #e0a86a;
}
.doors-note {
  position: relative;
  z-index: 1;
  margin: 26px 0 0;
  text-align: center;
  font-size: 13px;
  color: #98a6bb;
  letter-spacing: 0.06em;
}
@media (max-width: 719px) {
  .doors-grid {
    grid-template-columns: 1fr;
  }
}
</style>
