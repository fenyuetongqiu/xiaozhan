<template>
  <div class="memstar-wrap" :style="{ height: H + 'px' }">
    <canvas
      ref="cv"
      class="memstar-canvas"
      @mousemove="onMove"
      @mouseleave="hover = -1"
      @click="onClick"
    ></canvas>
    <div class="memstar-tip">
      <template v-if="hover >= 0">
        <b>{{ nodes[hover].kind }} · {{ nodes[hover].title }}</b>
        <span>{{ nodes[hover].date }} · 点一下去看看 →</span>
      </template>
      <template v-else>
        <b>记忆点</b>
        <span>点圆点进去；它们会自己飘，靠近时会连一根线</span>
      </template>
    </div>
  </div>
</template>

<script>
const KIND_COLOR = {
  文章: '#7fb2f0',
  游戏: '#e8b878',
  留言: '#c9a6d8',
  关于: '#a9c79a',
  未完待续: '#8fa2c4'
}

export default {
  name: 'MemoryLine',
  data() {
    return {
      H: 540,
      hover: -1,
      nodes: [],
      items: [
        { date: '2026-10-29', kind: '文章', title: '让 AI 学会兵法', link: '/blogs/game-dev/2026-10-29-兵法与学习.html' },
        { date: '2026-10-30', kind: '文章', title: '十九个角色的平衡', link: '/blogs/game-dev/2026-10-30-小球成名之战-平衡.html' },
        { date: '2026-11-01', kind: '文章', title: '开站第一天', link: '/blogs/notes/2026-11-01-开站.html' },
        { date: '常驻', kind: '游戏', title: '小游戏', link: '/games/' },
        { date: '常驻', kind: '留言', title: '留言板', link: '/guestbook/' },
        { date: '常驻', kind: '关于', title: '关于', link: '/about/' },
        { date: '未完', kind: '未完待续', title: '这儿还空着', link: '/guestbook/' }
      ]
    }
  },
  mounted() {
    this.init()
    window.addEventListener('resize', this.layout)
    this.drawAt = 0
    this.loop = (t) => {
      this.raf = requestAnimationFrame(this.loop)
      if (document.hidden) return
      if (t - this.drawAt < 32) return
      this.drawAt = t
      this.tick(t)
    }
    this.raf = requestAnimationFrame(this.loop)
  },
  beforeDestroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.layout)
    if (this.ro) this.ro.disconnect()
  },
  methods: {
    init() {
      const cv = this.$refs.cv
      this.ctx = cv.getContext('2d')
      this.nodes = this.items.map((it, i) => {
        const a = (i / this.items.length) * Math.PI * 2
        return {
          ...it,
          x: 0.5 + Math.cos(a) * 0.28,
          y: 0.5 + Math.sin(a) * 0.3,
          vx: (Math.random() - 0.5) * 0.02,
          vy: (Math.random() - 0.5) * 0.02,
          r: it.kind === '未完待续' ? 17 : 22,
          ph: Math.random() * Math.PI * 2,
          scale: 1
        }
      })
      this.layout()
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.layout())
        this.ro.observe(cv.parentElement)
      }
    },
    layout() {
      const cv = this.$refs.cv
      if (!cv || !cv.parentElement) return
      const box = cv.parentElement.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      this.W = Math.max(320, box.width)
      this.H = Math.max(460, Math.min(620, Math.round(window.innerHeight * 0.62)))
      cv.width = Math.round(this.W * dpr)
      cv.height = Math.round(this.H * dpr)
      cv.style.width = this.W + 'px'
      cv.style.height = this.H + 'px'
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
    tick(t) {
      const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0.016
      this.last = t
      const W = this.W
      const H = this.H
      const ctx = this.ctx

      // 背景交给全屏星空，这里只清空自己的画布
      ctx.clearRect(0, 0, W, H)

      const pad = 58
      this.nodes.forEach((n, idx) => {
        n.x += n.vx * dt
        n.y += n.vy * dt
        const minX = pad / W
        const maxX = 1 - pad / W
        const minY = pad / H
        const maxY = 1 - pad / H
        if (n.x < minX) { n.x = minX; n.vx = Math.abs(n.vx) }
        if (n.x > maxX) { n.x = maxX; n.vx = -Math.abs(n.vx) }
        if (n.y < minY) { n.y = minY; n.vy = Math.abs(n.vy) }
        if (n.y > maxY) { n.y = maxY; n.vy = -Math.abs(n.vy) }
        const target = this.hover === idx ? 1.35 : 1
        n.scale += (target - n.scale) * Math.min(1, dt * 8)
      })

      const LIMIT = Math.min(300, Math.max(200, W * 0.33))
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i]
          const b = this.nodes[j]
          const ax = a.x * W
          const ay = a.y * H
          const bx = b.x * W
          const by = b.y * H
          const d = Math.hypot(ax - bx, ay - by)
          if (d > LIMIT) continue
          const k = 1 - d / LIMIT
          const boost = (this.hover === i || this.hover === j) ? 1.8 : 1
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.strokeStyle = 'rgba(150,190,240,' + (0.10 + 0.42 * k * k * boost).toFixed(3) + ')'
          ctx.lineWidth = 1 + k * 0.8
          ctx.stroke()
        }
      }

      this.nodes.forEach((n) => {
        const x = n.x * W
        const y = n.y * H
        const r = n.r * n.scale
        const col = KIND_COLOR[n.kind] || '#9db8e0'

        const sprite = this.glowSprite(col)
        const gs = r * 5.2
        ctx.drawImage(sprite, x - gs / 2, y - gs / 2, gs, gs)

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t / 4200 + n.ph)
        ctx.beginPath()
        ctx.setLineDash([5, 7])
        ctx.arc(0, 0, r + 9, 0, Math.PI * 2)
        ctx.strokeStyle = this.hexA(col, 0.45)
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(10,18,36,.72)'
        ctx.fill()
        ctx.strokeStyle = this.hexA(col, 0.9)
        ctx.lineWidth = 1.6
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, r * 0.34, 0, Math.PI * 2)
        ctx.fillStyle = col
        ctx.fill()

        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(226,238,255,.94)'
        ctx.font = '600 13px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif'
        ctx.fillText(n.title, x, y + r + 22)
        ctx.fillStyle = 'rgba(168,190,220,.72)'
        ctx.font = '11px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif'
        ctx.fillText(n.kind + ' · ' + n.date, x, y + r + 39)
      })
    },
    glowSprite(col) {
      if (!this.glowCache) this.glowCache = {}
      if (this.glowCache[col]) return this.glowCache[col]
      const S = 96
      const c = document.createElement('canvas')
      c.width = c.height = S
      const g = c.getContext('2d')
      const grad = g.createRadialGradient(S / 2, S / 2, S * 0.06, S / 2, S / 2, S / 2)
      grad.addColorStop(0, this.hexA(col, 0.30))
      grad.addColorStop(0.55, this.hexA(col, 0.10))
      grad.addColorStop(1, this.hexA(col, 0))
      g.fillStyle = grad
      g.fillRect(0, 0, S, S)
      this.glowCache[col] = c
      return c
    },
    hexA(hex, a) {
      const h = hex.replace('#', '')
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
    },
    pick(ev) {
      const rect = this.$refs.cv.getBoundingClientRect()
      const mx = ev.clientX - rect.left
      const my = ev.clientY - rect.top
      let hit = -1
      this.nodes.forEach((n, i) => {
        const d = Math.hypot(n.x * this.W - mx, n.y * this.H - my)
        if (d < n.r * n.scale + 14) hit = i
      })
      return hit
    },
    onMove(ev) {
      const hit = this.pick(ev)
      this.hover = hit
      this.$refs.cv.style.cursor = hit >= 0 ? 'pointer' : 'default'
    },
    onClick(ev) {
      const hit = this.pick(ev)
      if (hit >= 0 && this.nodes[hit]) this.$router.push(this.nodes[hit].link)
    }
  }
}
</script>

<style scoped>
.memstar-wrap {
  position: relative;
  margin: 18px 0 10px;
  border-radius: 18px;
  overflow: hidden;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.memstar-canvas { display: block; width: 100%; }

.memstar-tip {
  position: absolute;
  left: 16px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 13px;
  border-radius: 11px;
  background: rgba(9, 16, 32, .62);
  border: 1px solid rgba(120, 160, 220, .22);
  color: #d8e4f7;
  pointer-events: none;
  max-width: 70%;
}
.memstar-tip b { font-size: 12.5px; font-weight: 600; }
.memstar-tip span { font-size: 11.5px; color: #9db2cf; }
</style>
