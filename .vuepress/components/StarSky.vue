<template>
  <canvas ref="cv" class="starry-sky" aria-hidden="true"></canvas>
</template>

<script>
// 性能要点：
// 1) 底色/星云交给 CSS 背景，canvas 每帧只画会动的星星（clearRect + 小圆）
// 2) 稳定 30fps（肉眼一样闪，但 GPU/CPU 少一半）
// 3) 标签页切走时直接停
const FPS = 30
const FRAME = 1000 / FPS

export default {
  name: 'StarSky',
  mounted() {
    document.documentElement.classList.add('mem-full')
    const cv = this.$refs.cv
    // 页面里的祖先带 transform 会把 fixed 画布裁在正文栏宽度内 —— 直接挪到 body 上
    if (cv && cv.parentNode !== document.body) document.body.appendChild(cv)
    this.ctx = cv.getContext('2d', { alpha: true })
    this.stars = []
    this.shooting = []
    this.nextShoot = 4000
    this.resize()
    window.addEventListener('resize', this.resize)
    this.frameMs = FRAME
    this.slow = 0
    // 系统开了「减少动态效果」，就画一张静态星空，不再跑动画
    this.still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loop = (t) => {
      this.raf = requestAnimationFrame(loop)
      if (document.hidden) return
      const gap = t - this.drawAt
      const panning = Math.abs(this.panTarget - this.pan) > 0.5
      if (gap < (panning ? 6 : this.frameMs - 1)) return
      // 连续掉帧就自动降频（30 → 20 → 12），宁可慢一点也不卡
      if (gap > 44) this.slow++; else this.slow = Math.max(0, this.slow - 1)
      if (this.slow > 18 && this.frameMs < 50) { this.frameMs = 50; this.slow = 0 }
      else if (this.slow > 18 && this.frameMs < 84) { this.frameMs = 84; this.slow = 0 }
      this.drawAt = t
      this.tick(t)
      if (this.still && !this.stillDone) { this.stillDone = true; cancelAnimationFrame(this.raf) }
    }
    this.flare = this.buildFlare()
    this.drawAt = 0
    this.raf = requestAnimationFrame(loop)

    // 小方块就是文章的入口：鼠标移上去变手型，点一下进文章
    const hitAt = (e) => {
      const r = cv.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      return (this.hitRects || []).find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)
    }
    this.onMove = (e) => {
      cv.style.cursor = hitAt(e) ? 'pointer' : 'default'
    }
    this.onClick = (e) => {
      const hit = hitAt(e)
      if (!hit) return
      if (this.$router) {
        this.$router.push(hit.link).catch(() => { window.location.href = hit.link })
      } else {
        window.location.href = hit.link
      }
    }
    this.pan = 0
    this.panTarget = 0
    this.panMax = 0
    this.onWheel = (e) => {
      if (!document.documentElement.classList.contains('mem-full')) return
      e.preventDefault()
      const next = this.panTarget + (e.deltaY + e.deltaX) * 0.75
      this.panTarget = Math.max(0, Math.min(this.panMax, next))
    }
    window.addEventListener('wheel', this.onWheel, { passive: false })
    document.addEventListener('mousemove', this.onMove)
    document.addEventListener('click', this.onClick)
  },
  beforeDestroy() {
    document.documentElement.classList.remove('mem-full')
    if (this.onWheel) window.removeEventListener('wheel', this.onWheel)
    if (this.onMove) document.removeEventListener('mousemove', this.onMove)
    if (this.onClick) document.removeEventListener('click', this.onClick)
    const cv = this.$refs.cv
    if (cv && cv.parentNode === document.body) document.body.removeChild(cv)
    window.removeEventListener('resize', this.resize)
    cancelAnimationFrame(this.raf)
  },
  methods: {
    resize() {
      const cv = this.$refs.cv
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      this.W = window.innerWidth
      this.H = window.innerHeight
      cv.width = Math.round(this.W * dpr)
      cv.height = Math.round(this.H * dpr)
      cv.style.width = this.W + 'px'
      cv.style.height = this.H + 'px'
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(220, Math.round((this.W * this.H) / 9000))
      const colors = ['rgba(255,255,255,', 'rgba(207,224,255,', 'rgba(255,233,201,']
      this.stars = []
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.W,
          y: Math.random() * this.H,
          r: Math.random() * 1.4 + 0.4,
          ph: Math.random() * Math.PI * 2,
          sp: 0.6 + Math.random() * 1.6,
          c: colors[Math.random() < 0.16 ? 2 : (Math.random() < 0.5 ? 1 : 0)]
        })
      }
    },
    roundRect(x, y, w, h, r) {
      const ctx = this.ctx
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    },
    drawChipsSmooth() {
      // 滚轮的平移目标用缓动追，别一下跳过去
      this.pan += (this.panTarget - this.pan) * 0.14
      if (Math.abs(this.panTarget - this.pan) < 0.2) this.pan = this.panTarget
    },
    waveMid(H, t) {
      // 整条线只轻轻上下浮，幅度很小，别晃眼
      return H * 0.5 + Math.sin(t / 6100) * 4
    },
    waveAmp(t) {
      return 9 + Math.sin(t / 5200) * 3 + Math.sin(t / 2100) * 1.5
    },
    waveY(x, H, t) {
      const amp = this.waveAmp(t)
      return this.waveMid(H, t) + Math.sin(x / 240 + t / 1600) * amp + Math.sin(x / 90 - t / 900) * amp * 0.22
    },
    drawWave(t, W, H) {
      const ctx = this.ctx
      const midY = this.waveMid(H, t)
      const amp = this.waveAmp(t)
      // 色相在蓝(208)和紫(278)之间缓慢来回，不转出绿色
      const hueA = 208 + Math.sin(t / 1800) * 20
      const hueB = 278 + Math.sin(t / 2100 + 1.2) * 18
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      for (let i = 0; i <= 5; i++) {
        const k = i / 5
        const hue = hueA + (hueB - hueA) * k
        grad.addColorStop(k, 'hsl(' + hue.toFixed(1) + ', 100%, 66%)')
      }
      const path = () => {
        ctx.beginPath()
        for (let x = -20; x <= W + 20; x += 12) {
          const y = midY + Math.sin(x / 240 + t / 1600) * amp + Math.sin(x / 90 - t / 900) * amp * 0.22
          if (x === -20) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      }
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = grad
      ctx.lineCap = 'round'
      // 由外到内多层描边，堆出霓虹光晕（比 shadowBlur 便宜得多）
      const layers = [[44, 0.035], [24, 0.06], [12, 0.12], [6, 0.26], [2.6, 0.96]]
      for (const [w, a] of layers) {
        ctx.globalAlpha = a
        ctx.lineWidth = w
        path()
        ctx.stroke()
      }
      ctx.restore()
    },
    drawChips(t, W, H) {
      const ctx = this.ctx
      // 每一块就是一篇文章：上面是名字，下面是准确时间
      const items = [
        { title: '让 AI 学会兵法', time: '2026-10-29', link: '/blogs/game-dev/2026-10-29-兵法与学习.html' },
        { title: '十九个角色的平衡', time: '2026-10-30', link: '/blogs/game-dev/2026-10-30-小球成名之战-平衡.html' },
        { title: '开站第一天', time: '2026-11-01', link: '/blogs/notes/2026-11-01-开站.html' },
        { title: '小游戏', time: '2026-11-01', link: '/games/' },
        { title: '留言板', time: '2026-11-01', link: '/guestbook/' },
        { title: '关于我', time: '2026-11-01', link: '/about/' }
      ]
      const gap = 40
      const PAD = Math.round(W * 0.22)
      const step = Math.round(W * 0.3)
      this.panMax = Math.max(0, PAD * 2 + (items.length - 1) * step - W)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      this.hitRects = []
      items.forEach((it, i) => {
        const cx = PAD + step * i - this.pan
        const up = i % 2 === 0
        // 方块贴着线走：线浮多少，方块就浮多少
        const wy = this.waveY(cx, H, t)

        ctx.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
        const tw = ctx.measureText(it.title).width
        const boxW = Math.max(132, Math.min(240, tw + 34))
        const boxH = 48
        const x = cx - boxW / 2
        const y = up ? wy - gap - boxH : wy + gap
        this.hitRects.push({ x: x, y: y, w: boxW, h: boxH, link: it.link, title: it.title })

        const ph = i * 0.9
        const breathe = 0.55 + 0.45 * Math.sin(t / 900 + ph)
        const hue = 214 + (i / (items.length - 1)) * 64

        ctx.fillStyle = 'hsla(' + hue.toFixed(0) + ', 90%, 62%, ' + (0.07 + 0.06 * breathe).toFixed(3) + ')'
        this.roundRect(x, y, boxW, boxH, 11)
        ctx.fill()
        const neon = [
          [7.5, 0.1, 62],
          [3.6, 0.22, 68],
          [1.6, 0.85, 74]
        ]
        for (const [w, a, l] of neon) {
          ctx.lineWidth = w
          ctx.strokeStyle = 'hsla(' + hue.toFixed(0) + ', 100%, ' + l + '%, ' + (a * (0.55 + 0.45 * breathe)).toFixed(3) + ')'
          this.roundRect(x, y, boxW, boxH, 11)
          ctx.stroke()
        }

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(232, 241, 255, ' + (0.8 + 0.18 * breathe).toFixed(3) + ')'
        ctx.fillText(it.title, cx, y + 17)
        ctx.fillStyle = 'rgba(168, 196, 235, ' + (0.6 + 0.25 * breathe).toFixed(3) + ')'
        ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(it.time, cx, y + 34)

        // 一根短线把方块和主线连起来，停在离线 6px
        const nearY = up ? y + boxH : y
        const farY = up ? wy - 6 : wy + 6
        ctx.beginPath()
        ctx.strokeStyle = 'hsla(' + hue.toFixed(0) + ', 100%, 72%, ' + (0.18 + 0.2 * breathe).toFixed(3) + ')'
        ctx.lineWidth = 1
        ctx.moveTo(cx, nearY)
        ctx.lineTo(cx, farY)
        ctx.stroke()
      })
      ctx.restore()
    },
    buildFlare() {
      // 一次性预渲染成一张「镜头光斑」，之后只做位移/缩放/透明度
      const S = 480
      const c = document.createElement('canvas')
      c.width = S
      c.height = S
      const g = c.getContext('2d')
      const cx = S / 2
      const cy = S / 2
      g.globalCompositeOperation = 'lighter'

      // 1) 核心光晕：白 → 冷蓝，快速衰减（像真实点光源过曝）
      const core = g.createRadialGradient(cx, cy, 0, cx, cy, S * 0.34)
      core.addColorStop(0, 'rgba(255,255,255,1)')
      core.addColorStop(0.06, 'rgba(238,246,255,0.95)')
      core.addColorStop(0.16, 'rgba(176,205,255,0.42)')
      core.addColorStop(0.4, 'rgba(120,155,235,0.13)')
      core.addColorStop(0.7, 'rgba(90,120,210,0.04)')
      core.addColorStop(1, 'rgba(80,110,200,0)')
      g.fillStyle = core
      g.beginPath()
      g.arc(cx, cy, S * 0.34, 0, Math.PI * 2)
      g.fill()

      // 2) 衍射星芒：竖向长、横向短，锥形衰减（镜头光圈叶片的感觉）
      const spike = (len, halfW, from, to) => {
        const grd = g.createLinearGradient(cx, cy, cx, cy - len)
        grd.addColorStop(0, from)
        grd.addColorStop(0.35, to)
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = grd
        g.beginPath()
        g.moveTo(cx - halfW, cy)
        g.lineTo(cx, cy - len)
        g.lineTo(cx + halfW, cy)
        g.closePath()
        g.fill()
      }
      // 四条主芒都要有：上最长、下稍短、左右更短，长度不齐才像真的
      const arms = [
        [0, 0.40, 5.2, 0.94, 0.34],
        [Math.PI, 0.34, 4.6, 0.86, 0.30],
        [Math.PI / 2, 0.26, 4.0, 0.78, 0.26],
        [-Math.PI / 2, 0.24, 3.8, 0.74, 0.24]
      ]
      for (const [ang, len, halfW, a1, a2] of arms) {
        g.save()
        g.translate(cx, cy)
        g.rotate(ang)
        g.translate(-cx, -cy)
        spike(S * len, halfW, 'rgba(255,255,255,' + a1 + ')', 'rgba(196,220,255,' + a2 + ')')
        g.restore()
      }
      // 斜向短芒，弱一点
      for (let k = 0; k < 4; k++) {
        g.save()
        g.translate(cx, cy)
        g.rotate(Math.PI / 4 + k * Math.PI / 2)
        g.translate(-cx, -cy)
        spike(S * 0.15, 2.6, 'rgba(230,240,255,0.5)', 'rgba(170,200,255,0.18)')
        g.restore()
      }

      // 3) 横向的变形光条（anamorphic streak）：电影镜头最标志性的东西
      const streak = g.createLinearGradient(cx - S * 0.5, cy, cx + S * 0.5, cy)
      streak.addColorStop(0, 'rgba(90,150,255,0)')
      streak.addColorStop(0.3, 'rgba(130,175,255,0.16)')
      streak.addColorStop(0.5, 'rgba(215,232,255,0.46)')
      streak.addColorStop(0.7, 'rgba(130,175,255,0.16)')
      streak.addColorStop(1, 'rgba(90,150,255,0)')
      g.fillStyle = streak
      g.fillRect(cx - S * 0.5, cy - 1.6, S, 3.2)
      g.globalAlpha = 0.5
      g.fillRect(cx - S * 0.42, cy - 5, S * 0.84, 1.2)
      g.fillRect(cx - S * 0.42, cy + 4, S * 0.84, 1.2)
      g.globalAlpha = 1

      // 4) 轻微色散：青/洋红各一层，错开 1~2px
      g.globalAlpha = 0.16
      g.drawImage(c, cx - 1.4, cy - 1.4, S, S, 0, 0, S, S)
      g.globalAlpha = 1

      // 5) 两枚很淡的镜头鬼影
      const ghost = (dx, dy, r, col) => {
        const gg = g.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, r)
        gg.addColorStop(0, col)
        gg.addColorStop(1, 'rgba(120,170,255,0)')
        g.fillStyle = gg
        g.beginPath()
        g.arc(cx + dx, cy + dy, r, 0, Math.PI * 2)
        g.fill()
      }
      ghost(-S * 0.19, S * 0.14, 34, 'rgba(120,200,255,0.18)')
      ghost(S * 0.23, -S * 0.09, 22, 'rgba(190,150,255,0.14)')

      // 关键：用径向遮罩把画布边缘抹掉。否则缩放贴图时，方形边界会在星空上留下一块亮斑
      g.globalCompositeOperation = 'destination-in'
      const mask = g.createRadialGradient(cx, cy, 0, cx, cy, S * 0.5)
      mask.addColorStop(0, 'rgba(0,0,0,1)')
      mask.addColorStop(0.45, 'rgba(0,0,0,0.92)')
      mask.addColorStop(0.72, 'rgba(0,0,0,0.45)')
      mask.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = mask
      g.fillRect(0, 0, S, S)

      return c
    },
    drawSpark(t, W, H) {
      if (!this.flare) return
      const ctx = this.ctx
      // 不规则闪烁：三个不同频率叠在一起，别用单一正弦，那样很假
      const tw = 0.72 + 0.14 * Math.sin(t / 430) + 0.09 * Math.sin(t / 173 + 1.3) + 0.05 * Math.sin(t / 97 + 2.7)
      const scale = 0.42 + 0.1 * tw
      const size = 480 * scale * 1.7
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = Math.max(0, Math.min(1, tw))
      // 叠两遍把亮度顶上去：核心过曝成纯白，又不至于糊成一坨
      for (let k = 0; k < 2; k++) {
        ctx.drawImage(this.flare, W * 0.8 - size / 2, (H * 0.5 - 152) - size / 2, size, size)
      }
      ctx.restore()
    },
    tick(t) {
      const ctx = this.ctx
      const W = this.W
      const H = this.H
      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i]
        const k = 0.5 + 0.5 * Math.sin(t / 620 * s.sp + s.ph)
        const a = (0.18 + 0.72 * k).toFixed(2)
        ctx.fillStyle = s.c + a + ')'
        const r = s.r * (0.8 + 0.4 * k)
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, 6.2832)
        ctx.fill()
      }

      // 中间那条霓虹波动的线
      this.drawChipsSmooth()
      this.drawWave(t, W, H)
      this.drawChips(t, W, H)
      this.drawSpark(t, W, H)

      // 流星
      if (t > this.nextShoot) {
        this.nextShoot = t + 5000 + Math.random() * 9000
        this.shooting.push({
          x: Math.random() * W * 0.7 + W * 0.2,
          y: Math.random() * H * 0.35,
          vx: 620 + Math.random() * 380,
          vy: 200 + Math.random() * 180,
          life: 1
        })
      }
      for (let i = this.shooting.length - 1; i >= 0; i--) {
        const m = this.shooting[i]
        m.x += m.vx / FPS
        m.y += m.vy / FPS
        m.life -= 0.035
        if (m.life <= 0 || m.x > W + 240 || m.y > H + 240) {
          this.shooting.splice(i, 1)
          continue
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, m.life * 0.8).toFixed(2) + ')'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(m.x, m.y)
        ctx.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12)
        ctx.stroke()
      }
    }
  }
}
</script>

<style scoped>
.starry-sky {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  /* 静态的夜底色和星云都放在 CSS 里，canvas 只负责闪烁的星星 */
  background:
    radial-gradient(circle at 20% 15%, rgba(78, 120, 200, .22), rgba(78, 120, 200, 0) 42%),
    radial-gradient(circle at 82% 78%, rgba(120, 90, 170, .18), rgba(120, 90, 170, 0) 46%),
    linear-gradient(160deg, #070c18 0%, #0a1224 52%, #0c1730 100%);
}
</style>
