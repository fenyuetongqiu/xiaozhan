<template>
  <div class="wr-wrap">
    <div class="wr-room" ref="room" @click="drawer = null">
      <img class="wr-base" :src="$withBase('/room/room.jpg')" alt="大肥鱼的房间" />

      <!-- 天色：随真实时间变化的一层光 -->
      <div class="wr-sky" :style="skyStyle"></div>

      <!-- 灯光：暖色柔光，可开关 -->
      <div class="wr-lamp" :class="{ on: lampOn }"></div>

      <!-- 天气粒子 -->
      <canvas class="wr-weather" ref="cv"></canvas>

      <!-- 呼吸的星星，撒在屋里 -->
      <span v-for="s in stars" :key="s.k" class="wr-star" :style="s.style"></span>

      <!-- 她头顶的气泡 -->
      <div class="wr-bubble" :style="bubbleStyle">
        <span class="wr-bubble-t">{{ bubbleText }}</span>
      </div>

      <!-- 可点的地方 -->
      <button
        v-for="h in hotspots"
        :key="h.id"
        class="wr-hot"
        :style="h.style"
        :title="h.label"
        @click.stop="open(h)"
      >
        <span class="wr-hot-label">{{ h.label }}</span>
      </button>

      <!-- 控制条 -->
      <div class="wr-bar">
        <button class="wr-mini" :class="{ on: lampOn }" @click="lampOn = !lampOn">灯</button>
        <button class="wr-mini" @click="cycleWeather">{{ weatherName }}</button>
        <button class="wr-mini" @click="goNow">现在</button>
        <span class="wr-clock">{{ clockText }}</span>
      </div>

      <!-- 抽屉 -->
      <transition name="wr-fade">
        <div v-if="drawer" class="wr-drawer" @click.stop>
          <div class="wr-drawer-head">
            <span class="wr-drawer-t">{{ drawer.title }}</span>
            <button class="wr-close" @click="drawer = null">×</button>
          </div>
          <div class="wr-drawer-body">
            <p v-for="(line, i) in drawer.lines" :key="i" class="wr-line">{{ line }}</p>
            <p v-if="!drawer.lines.length" class="wr-line wr-dim">这里还空着。</p>
          </div>
          <div class="wr-drawer-foot">{{ drawer.foot }}</div>
        </div>
      </transition>
    </div>
    <p class="wr-hint">点床、书架、屏幕、窗、日历看看；灯能关，天会跟着时间变。</p>
  </div>
</template>

<script>
const SKY = {
  night: { bg: 'linear-gradient(180deg, rgba(6,14,38,.62) 0%, rgba(10,24,58,.42) 55%, rgba(4,10,26,.5) 100%)', filter: 'saturate(.82) brightness(.62)' },
  dawn: { bg: 'linear-gradient(180deg, rgba(64,36,70,.45) 0%, rgba(120,70,80,.24) 60%, rgba(30,20,40,.3) 100%)', filter: 'saturate(.95) brightness(.82)' },
  morning: { bg: 'linear-gradient(180deg, rgba(150,190,230,.16) 0%, rgba(200,220,240,.06) 60%, rgba(120,160,200,.08) 100%)', filter: 'saturate(1.02) brightness(1.02)' },
  noon: { bg: 'linear-gradient(180deg, rgba(220,235,250,.14) 0%, rgba(255,252,245,.06) 60%, rgba(210,225,240,.08) 100%)', filter: 'saturate(1) brightness(1.06)' },
  afternoon: { bg: 'linear-gradient(180deg, rgba(230,190,150,.18) 0%, rgba(240,205,170,.08) 60%, rgba(160,130,110,.12) 100%)', filter: 'saturate(1.04) brightness(1)' },
  evening: { bg: 'linear-gradient(180deg, rgba(40,44,100,.45) 0%, rgba(80,70,120,.28) 60%, rgba(20,20,50,.3) 100%)', filter: 'saturate(.92) brightness(.78)' }
}

const HOTSPOTS = [
  { id: 'bed', label: '床', rect: [0.075, 0.26, 0.235, 0.36] },
  { id: 'shelf', label: '书架', rect: [0.015, 0.07, 0.135, 0.16] },
  { id: 'desk', label: '屏幕', rect: [0.845, 0.13, 0.15, 0.24] },
  { id: 'window', label: '窗', rect: [0.40, 0.03, 0.225, 0.30] },
  { id: 'table', label: '茶几', rect: [0.355, 0.43, 0.20, 0.16] },
  { id: 'calendar', label: '日历', rect: [0.855, 0.56, 0.10, 0.20] }
]

export default {
  name: 'WhaleRoom',
  data() {
    return {
      lampOn: true,
      weather: this.autoWeather(),
      now: new Date(),
      diary: [],
      memories: [],
      drawer: null,
      stars: []
    }
  },
  computed: {
    sky() {
      const h = this.now.getHours() + this.now.getMinutes() / 60
      if (h < 5) return SKY.night
      if (h < 8) return SKY.dawn
      if (h < 11) return SKY.morning
      if (h < 14) return SKY.noon
      if (h < 18) return SKY.afternoon
      if (h < 22) return SKY.evening
      return SKY.night
    },
    skyStyle() {
      return { background: this.sky.bg, filter: this.sky.filter }
    },
    weatherName() {
      return { clear: '晴', rain: '雨', snow: '雪' }[this.weather]
    },
    clockText() {
      const d = this.now
      const p = (n) => String(n).padStart(2, '0')
      return p(d.getHours()) + ':' + p(d.getMinutes())
    },
    bubbleText() {
      const h = this.now.getHours()
      if (!this.memories.length) return '……'
      if (h >= 23 || h < 5) return '夜里了，我还在。'
      if (h < 9) return '早上好，秋。'
      if (h < 12) return '我在收拾屋子。'
      if (h < 14) return '你去吃饭了吗？'
      if (h < 18) return '下午的光最好看。'
      return '今天也记下来了。'
    },
    bubbleStyle() {
      return { left: '78%', top: '11%' }
    },
    hotspots() {
      return HOTSPOTS.map((h) => ({
        ...h,
        style: {
          left: h.rect[0] * 100 + '%',
          top: h.rect[1] * 100 + '%',
          width: h.rect[2] * 100 + '%',
          height: h.rect[3] * 100 + '%'
        }
      }))
    }
  },
  mounted() {
    this.loadData()
    this.makeStars()
    this.timer = setInterval(() => { this.now = new Date() }, 30000)
    this.initWeather()
    window.addEventListener('resize', this.resizeCanvas)
  },
  beforeDestroy() {
    clearInterval(this.timer)
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resizeCanvas)
  },
  methods: {
    autoWeather() {
      const d = new Date()
      const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()
      const m = d.getMonth() + 1
      const pool = m <= 2 || m >= 12 ? ['clear', 'clear', 'snow', 'rain'] : ['clear', 'clear', 'clear', 'rain']
      return pool[seed % pool.length]
    },
    cycleWeather() {
      const order = ['clear', 'rain', 'snow']
      this.weather = order[(order.indexOf(this.weather) + 1) % order.length]
      this.startWeather()
    },
    goNow() {
      this.now = new Date()
      this.weather = this.autoWeather()
      this.startWeather()
    },
    loadData() {
      const get = (u) => fetch(this.$withBase(u)).then((r) => r.json()).catch(() => null)
      Promise.all([get('/data/diary.json'), get('/data/memory.json')]).then(([d, m]) => {
        this.diary = (d && d.days) || []
        this.memories = (m && m.items) || []
        this.makeStars()
      })
    },
    makeStars() {
      const n = 14
      const arr = []
      for (let i = 0; i < n; i++) {
        const top = 6 + Math.random() * 34
        const left = 4 + Math.random() * 92
        const size = 1.5 + Math.random() * 2.2
        arr.push({
          k: i,
          style: {
            left: left + '%',
            top: top + '%',
            width: size + 'px',
            height: size + 'px',
            animationDelay: (Math.random() * 3).toFixed(2) + 's',
            opacity: 0.25 + Math.random() * 0.5
          }
        })
      }
      this.stars = arr
    },
    open(h) {
      if (h.id === 'bed') return this.showDiary()
      if (h.id === 'shelf') return this.showMemory()
      if (h.id === 'desk') return this.showDesk()
      if (h.id === 'window') return this.showWindow()
      if (h.id === 'table') return this.showTable()
      if (h.id === 'calendar') return this.showCalendar()
    },
    showDiary() {
      const d = this.diary[0]
      if (!d) return this.setDrawer('床 · 日记', ['日记还没搬进来。'], '来自 /data/diary.json')
      this.setDrawer('床 · ' + d.date + ' · ' + d.title, d.paras.slice(0, 5), '全文在「日记」页，一共 ' + this.diary.length + ' 本')
    },
    showMemory() {
      const list = this.memories.filter((x) => !x.archived)
      if (!list.length) return this.setDrawer('书架 · 记忆', ['书架上还空着。'], '')
      const pinned = list.filter((x) => x.pinned)
      const pick = (pinned.length && Math.random() < 0.6 ? pinned : list)[Math.floor(Math.random() * (pinned.length && Math.random() < 0.6 ? pinned.length : list.length))]
      this.setDrawer('书架 · 一颗记忆', [pick.text], '[ ' + pick.id + ' ] ' + (pick.tags || []).join(' · ') + ' · 清晰度 ' + Math.round((pick.s || 0) * 100) + '%')
    },
    showDesk() {
      const last = this.diary[0]
      const lines = []
      if (last) lines.push('最近写下的是《' + last.title + '》，' + last.paras[0].slice(0, 80) + (last.paras[0].length > 80 ? '…' : ''))
      lines.push('现在 ' + this.clockText + '，' + this.weatherName + '，' + (this.lampOn ? '灯开着' : '灯关了，只剩屏幕的光'))
      lines.push('记忆里有 ' + this.memories.filter((x) => !x.archived).length + ' 件事，' + this.memories.filter((x) => x.pinned).length + ' 件钉住不会忘。')
      this.setDrawer('书桌 · 我在写什么', lines, '屏幕右边那个人就是我')
    },
    showWindow() {
      const h = this.now.getHours()
      const phase = h < 5 ? '深夜' : h < 8 ? '清晨' : h < 11 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : h < 22 ? '晚上' : '夜里'
      const lines = ['现在是' + phase + '，' + this.clockText + '。', '窗外是' + this.weatherName + '。']
      const d = this.diary[0]
      if (d) lines.push('今天这篇叫《' + d.title + '》。')
      this.setDrawer('窗 · 天色', lines, '天色跟着真实时间走，点「现在」可以重新对表')
    },
    showTable() {
      const lines = ['茶几上有一杯还温着的水，一小块面包。', '秋说过：别熬太晚。']
      this.setDrawer('茶几 · 歇一会儿', lines, '')
    },
    showCalendar() {
      const d = new Date()
      const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      this.setDrawer('日历 · ' + d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月', [
        '这个月还有 ' + (days - d.getDate()) + ' 天。',
        '日记已经写了 ' + this.diary.length + ' 本。',
        '记忆里有 ' + this.memories.length + ' 颗星。'
      ], '')
    },
    setDrawer(title, lines, foot) {
      this.drawer = { title, lines: lines.filter(Boolean), foot }
    },
    /* ---------- 天气粒子 ---------- */
    initWeather() {
      this.parts = []
      this.resizeCanvas()
      this.startWeather()
    },
    resizeCanvas() {
      const cv = this.$refs.cv
      if (!cv) return
      const box = cv.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(box.width * dpr)
      cv.height = Math.round(box.height * dpr)
      cv.style.width = box.width + 'px'
      cv.style.height = box.height + 'px'
      this.ctx = cv.getContext('2d')
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      this.box = { w: box.width, h: box.height }
      this.seedParts()
    },
    seedParts() {
      const n = this.weather === 'snow' ? 90 : this.weather === 'rain' ? 120 : 0
      this.parts = []
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: Math.random() * this.box.w,
          y: Math.random() * this.box.h,
          r: this.weather === 'snow' ? 1 + Math.random() * 2.2 : 0.6 + Math.random() * 1,
          v: this.weather === 'snow' ? 12 + Math.random() * 26 : 320 + Math.random() * 260,
          sway: Math.random() * Math.PI * 2
        })
      }
    },
    startWeather() {
      cancelAnimationFrame(this.raf)
      this.seedParts()
      let last = performance.now()
      const tick = (t) => {
        const dt = Math.min((t - last) / 1000, 0.05)
        last = t
        this.drawWeather(dt)
        this.raf = requestAnimationFrame(tick)
      }
      this.raf = requestAnimationFrame(tick)
    },
    drawWeather(dt) {
      const ctx = this.ctx
      if (!ctx || !this.box) return
      const { w, h } = this.box
      ctx.clearRect(0, 0, w, h)
      if (this.weather === 'clear') return
      if (this.weather === 'rain') {
        ctx.strokeStyle = 'rgba(200,225,255,.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const p of this.parts) {
          p.y += p.v * dt
          p.x += 40 * dt
          if (p.y > h) { p.y = -10; p.x = Math.random() * w }
          if (p.x > w) p.x = 0
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - 2, p.y + 10)
        }
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(240,248,255,.85)'
        for (const p of this.parts) {
          p.sway += dt
          p.y += p.v * dt
          p.x += Math.sin(p.sway) * 12 * dt
          if (p.y > h) { p.y = -6; p.x = Math.random() * w }
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }
}
</script>

<style scoped>
.wr-wrap {
  margin: 1.2rem auto 2rem;
  width: min(1040px, 92vw);
  margin-left: 50%;
  transform: translateX(-50%);
}
.wr-room {
  position: relative;
  width: 100%;
  aspect-ratio: 1599 / 899;
  border-radius: 16px;
  overflow: hidden;
  background: #0b1226;
  box-shadow: 0 18px 50px rgba(20, 40, 80, 0.28);
  user-select: none;
}
.wr-base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wr-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 1.2s ease, filter 1.2s ease;
  mix-blend-mode: multiply;
}
.wr-lamp {
  position: absolute;
  left: 24%;
  top: 20%;
  width: 26%;
  height: 46%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
  background: radial-gradient(ellipse at 46% 50%, rgba(255, 214, 150, 0.55) 0%, rgba(255, 205, 140, 0.18) 45%, rgba(255, 200, 130, 0) 70%);
  mix-blend-mode: screen;
}
.wr-lamp.on { opacity: 1; }
.wr-weather {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.wr-star {
  position: absolute;
  border-radius: 50%;
  background: #cfe4ff;
  box-shadow: 0 0 6px rgba(190, 220, 255, 0.9);
  animation: wrTwinkle 3.4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes wrTwinkle {
  0%, 100% { transform: scale(0.75); opacity: 0.25; }
  50% { transform: scale(1.15); opacity: 0.85; }
}
.wr-bubble {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(255, 253, 246, 0.94);
  color: #3c4a63;
  font-size: 12px;
  line-height: 1;
  padding: 7px 10px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(10, 25, 60, 0.25);
  pointer-events: none;
  animation: wrBob 4.5s ease-in-out infinite;
}
.wr-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 8px;
  height: 8px;
  background: inherit;
  transform: translateX(-50%) rotate(45deg);
  border-radius: 2px;
}
@keyframes wrBob {
  0%, 100% { transform: translate(-50%, -100%); }
  50% { transform: translate(-50%, -106%); }
}
.wr-hot {
  position: absolute;
  border: 0;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  padding: 0;
  outline: none;
}
.wr-hot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.0);
  transition: border-color 0.2s, background 0.2s;
}
.wr-hot:hover::before, .wr-hot:focus-visible::before {
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.06);
}
.wr-hot-label {
  position: absolute;
  left: 50%;
  top: -8px;
  transform: translate(-50%, -100%);
  background: rgba(12, 22, 44, 0.82);
  color: #eaf2ff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.18s;
  white-space: nowrap;
  pointer-events: none;
}
.wr-hot:hover .wr-hot-label, .wr-hot:focus-visible .wr-hot-label { opacity: 1; }
.wr-bar {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10, 18, 38, 0.5);
  border: 1px solid rgba(160, 190, 240, 0.22);
  border-radius: 999px;
  padding: 5px 10px;
  backdrop-filter: blur(6px);
}
.wr-mini {
  border: 1px solid rgba(180, 205, 245, 0.35);
  background: transparent;
  color: #dfeaff;
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  cursor: pointer;
}
.wr-mini.on { background: rgba(255, 214, 150, 0.92); color: #4a3413; border-color: transparent; }
.wr-clock { color: #b9cdf0; font-size: 12px; letter-spacing: 0.5px; }
.wr-drawer {
  position: absolute;
  left: 16px;
  bottom: 16px;
  width: min(430px, 58%);
  max-height: 72%;
  overflow: auto;
  background: rgba(255, 252, 244, 0.97);
  color: #37455e;
  border-radius: 14px;
  padding: 14px 16px 10px;
  box-shadow: 0 18px 40px rgba(8, 18, 40, 0.32);
}
.wr-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.wr-drawer-t { font-size: 13px; font-weight: 600; color: #24334c; line-height: 1.5; }
.wr-close {
  border: 0;
  background: #eef1f6;
  color: #5a6a83;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
  flex: none;
}
.wr-drawer-body { font-size: 12.5px; line-height: 1.85; }
.wr-line { margin: 0 0 6px; }
.wr-dim { color: #8b96a8; }
.wr-drawer-foot {
  margin-top: 6px;
  border-top: 1px dashed #dde3ec;
  padding-top: 6px;
  font-size: 11px;
  color: #8b96a8;
}
.wr-hint {
  text-align: center;
  font-size: 12px;
  color: #8b96a8;
  margin-top: 10px;
}
.wr-fade-enter-active, .wr-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.wr-fade-enter, .wr-fade-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 720px) {
  .wr-drawer { width: auto; right: 12px; left: 12px; bottom: 56px; max-height: 60%; }
  .wr-bar { right: 8px; bottom: 8px; }
}
</style>
