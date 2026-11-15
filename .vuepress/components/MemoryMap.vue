<template>
  <div class="mmap-wrap">
    <div class="mmap-bar">
      <span class="mmap-tip">滚轮缩放 · 按住拖动 · 双击复位</span>
      <input class="mmap-search" v-model="q" placeholder="搜一条记忆…" />
      <span class="mmap-count">{{ items.length }} 颗 · {{ pinned }} 颗钉住</span>
      <span class="mmap-zoom">{{ Math.round(zoom * 100) }}%</span>
    </div>
    <div class="mmap-canvas-wrap" ref="wrap">
      <canvas ref="cv"></canvas>
      <div class="mmap-card" v-if="sel" :style="cardStyle">
        <div class="mmap-card-h">
          <b>{{ sel.text.length > 30 ? sel.text.slice(0, 30) + '…' : sel.text }}</b>
          <i @click="sel = null">×</i>
        </div>
        <div class="mmap-card-t">{{ fmtHour(sel.at) }}</div>
        <div class="mmap-card-b">{{ sel.text }}</div>
        <div class="mmap-card-f">
          <span v-for="t in sel.tags" :key="t" class="mmap-tag">{{ t }}</span>
        </div>
      </div>
      <div class="mmap-tipname" v-if="hoverText" :style="{ left: hoverX + 'px', top: hoverY + 'px' }">
        <b>{{ hoverText }}</b><span>{{ hoverWhen }}</span>
      </div>
    </div>
  </div>
</template>

<script>
const GOLD = 2.399963
export default {
  name: 'MemoryMap',
  data() {
    return { items: [], q: '', sel: null, hoverText: '', hoverWhen: '', hoverX: 0, hoverY: 0, cardStyle: {}, pinned: 0, zoom: 1 }
  },
  mounted() {
    this.zoomTarget = 1
    this.panX = 0
    this.panY = 0
    this.nodes = []
    this.edges = []
    this.labels = []
    this.bg = []
    this.hovered = null
    this.cv = this.$refs.cv
    this.ctx = this.cv.getContext('2d')
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.resize()
    window.addEventListener('resize', this.resize)
    this.bindEvents()
    this.load()
  },
  beforeDestroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    if (this.io) this.io.disconnect()
  },
  watch: {
    q() { this.applySearch() }
  },
  methods: {
    async load() {
      try {
        const r = await fetch('/data/memory.json', { cache: 'no-store' })
        const d = await r.json()
        this.items = (d.items || []).filter(i => i.text)
        this.pinned = this.items.filter(i => i.pinned).length
      } catch (e) { this.items = [] }
      this.build()
      this.tick(performance.now())
    },
    fmtHour(ms) {
      if (!ms) return ''
      const t = new Date(ms)
      const p = n => String(n).padStart(2, '0')
      return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`
    },
    tagRoot(it) {
      const t = (it.tags && it.tags[0]) || '其他'
      return t
    },
    tagMid(it) {
      return (it.tags && it.tags[1]) || '未分'
    },
    hash(s) {
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
      return h
    },
    resize() {
      const wrap = this.$refs.wrap
      if (!wrap) return
      const r = wrap.getBoundingClientRect()
      this.W = Math.max(320, r.width)
      this.H = Math.max(320, r.height)
      this.cv.width = this.W * this.dpr
      this.cv.height = this.H * this.dpr
      this.cv.style.width = this.W + 'px'
      this.cv.style.height = this.H + 'px'
      if (this.items && this.items.length) this.build()
    },
    build() {
      const W = this.W, H = this.H
      if (!W || !H) return
      this.nodes = []
      const roots = {}, order = []
      for (const it of this.items) {
        const root = this.tagRoot(it)
        const n = {
          it, root, mid: this.tagMid(it), archived: !!it.archived,
          x: 0, y: 0,
          r: it.archived ? 1.6 : 2.2 + Math.pow(Math.max(0, Math.min(1, it.s || 0)), 1.05) * 10.5,
          hue: 202 + (Math.abs(this.hash(it.id)) % 16),
          ph: Math.random() * Math.PI * 2,
          sp: 380 + Math.random() * 460
        }
        this.nodes.push(n)
        if (!roots[root]) { roots[root] = []; order.push(root) }
        roots[root].push(n)
      }
      const cx = W / 2, cy = H / 2
      const RR = Math.min(W, H) * 0.42
      for (let ri = 0; ri < order.length; ri++) {
        const members = roots[order[ri]]
        const ra = ri * GOLD
        const rr = RR * Math.sqrt((ri + 0.5) / Math.max(1, order.length))
        const rcx = cx + Math.cos(ra) * rr, rcy = cy + Math.sin(ra) * rr
        const mids = {}, mo = []
        for (const m of members) {
          if (!mids[m.mid]) { mids[m.mid] = []; mo.push(m.mid) }
          mids[m.mid].push(m)
        }
        for (let mi = 0; mi < mo.length; mi++) {
          const clip = mids[mo[mi]]
          const ma = mi * GOLD
          const mr = 20 + 17 * Math.sqrt(mi + 1)
          const mcx = rcx + Math.cos(ma) * mr, mcy = rcy + Math.sin(ma) * mr
          for (let k = 0; k < clip.length; k++) {
            const n = clip[k]
            const ka = k * GOLD
            const kr = 7 + 5.6 * Math.sqrt(k + 1)
            n.x = mcx + Math.cos(ka) * kr
            n.y = mcy + Math.sin(ka) * kr
            n.x0 = n.x; n.y0 = n.y
          }
        }
      }
      // 轻排斥
      if (this.nodes.length <= 600) {
        for (let it2 = 0; it2 < 14; it2++) {
          for (let a = 0; a < this.nodes.length; a++) {
            for (let b = a + 1; b < this.nodes.length; b++) {
              const A = this.nodes[a], B = this.nodes[b]
              const dx = B.x - A.x, dy = B.y - A.y
              const d = Math.sqrt(dx * dx + dy * dy) || 0.01
              if (d < 11) {
                const push = (11 - d) * 0.35
                const ux = dx / d, uy = dy / d
                A.x -= ux * push; A.y -= uy * push
                B.x += ux * push; B.y += uy * push
              }
            }
          }
        }
        for (const n of this.nodes) { n.x0 = n.x; n.y0 = n.y }
      }
      this.labels = order.map((name) => {
        const ms = roots[name]
        let lx = 0, ly = 0
        for (const m of ms) { lx += m.x; ly += m.y }
        return { name, x: lx / ms.length, y: ly / ms.length - 24 }
      })
      this.makeEdges()
      this.bg = []
      for (let b = 0; b < 150; b++) {
        this.bg.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.3, a: Math.random() * 0.4 + 0.15, ph: Math.random() * 6 })
      }
      this.applySearch()
    },
    makeEdges() {
      const edges = []
      const byLeaf = {}, leafOrder = [], byRoot = {}
      for (const n of this.nodes) {
        if (n.archived) continue
        const lk = n.root + '|' + n.mid
        if (!byLeaf[lk]) { byLeaf[lk] = []; leafOrder.push(lk) }
        byLeaf[lk].push(n)
        if (!byRoot[n.root]) byRoot[n.root] = []
        byRoot[n.root].push(lk)
      }
      for (const lk of leafOrder) {
        const arr = byLeaf[lk]
        if (arr.length < 2) continue
        let cx = 0, cy = 0
        for (const a of arr) { cx += a.x; cy += a.y }
        cx /= arr.length; cy /= arr.length
        for (const a of arr) a._ang = Math.atan2(a.y - cy, a.x - cx)
        arr.sort((p, q) => p._ang - q._ang)
        for (let i = 1; i < arr.length; i++) edges.push([arr[i - 1], arr[i]])
        if (arr.length > 2) edges.push([arr[arr.length - 1], arr[0]])
      }
      // 同日边
      const byDay = {}
      for (const n of this.nodes) {
        if (n.archived) continue
        const d = new Date(n.it.at || Date.now())
        const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        if (!byDay[k]) byDay[k] = []
        byDay[k].push(n)
      }
      for (const k in byDay) {
        const g = byDay[k]
        if (g.length < 2 || g.length > 14) continue
        for (let i = 1; i < g.length; i++) edges.push([g[i - 1], g[i]])
      }
      // 点名边
      for (const n of this.nodes) {
        if (n.archived) continue
        const hit = String(n.it.text || '').match(/(\d{1,2})月(\d{1,2})日/)
        if (!hit) continue
        const want = Number(hit[1]) + '-' + Number(hit[2])
        for (const k in byDay) {
          const parts = k.split('-')
          if (Number(parts[1]) + '-' + Number(parts[2]) !== want) continue
          const tgt = byDay[k][0]
          if (tgt && tgt !== n) edges.push([n, tgt, 'ref'])
        }
      }
      this.edges = edges.filter(([a, b, kind]) => {
        if (kind === 'ref') return true
        return Math.hypot(a.x - b.x, a.y - b.y) <= 320
      })
    },
    applySearch() {
      const q = (this.q || '').trim().toLowerCase()
      for (const n of this.nodes) {
        n.hit = !q || String(n.it.text).toLowerCase().includes(q) || (n.it.tags || []).join(' ').toLowerCase().includes(q)
      }
    },
    bindEvents() {
      const cv = this.cv
      let dragging = false, moved = false, lx = 0, ly = 0
      cv.addEventListener('pointerdown', (e) => {
        dragging = true; moved = false; lx = e.clientX; ly = e.clientY
        cv.setPointerCapture(e.pointerId)
      })
      cv.addEventListener('pointermove', (e) => {
        if (dragging) {
          const dx = e.clientX - lx, dy = e.clientY - ly
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
          this.panX += dx; this.panY += dy
          lx = e.clientX; ly = e.clientY
        }
        this.pickAt(e)
      })
      cv.addEventListener('pointerup', (e) => {
        dragging = false
        if (moved) return
        const n = this.hovered
        if (n) {
          this.sel = n.it
          const r = cv.getBoundingClientRect()
          this.cardStyle = { left: Math.min(r.width - 260, Math.max(8, e.clientX - r.left + 12)) + 'px', top: Math.min(r.height - 150, Math.max(8, e.clientY - r.top + 12)) + 'px' }
        } else this.sel = null
      })
      cv.addEventListener('pointerleave', () => { this.hovered = null; this.hoverText = '' })
      cv.addEventListener('wheel', (e) => {
        e.preventDefault()
        const r = cv.getBoundingClientRect()
        const mx = e.clientX - r.left, my = e.clientY - r.top
        const next = Math.max(0.4, Math.min(3.2, this.zoomTarget * Math.exp(-e.deltaY * 0.0013)))
        const wx = this.W / 2 + (mx - this.W / 2 - this.panX) / this.zoomTarget
        const wy = this.H / 2 + (my - this.H / 2 - this.panY) / this.zoomTarget
        this.panX = mx - this.W / 2 - (wx - this.W / 2) * next
        this.panY = my - this.H / 2 - (wy - this.H / 2) * next
        this.zoomTarget = next
      }, { passive: false })
      cv.addEventListener('dblclick', () => { this.zoomTarget = 1; this.panX = 0; this.panY = 0 })
    },
    pickAt(e) {
      const r = this.cv.getBoundingClientRect()
      const mx = e.clientX - r.left, my = e.clientY - r.top
      let best = null, bd = 1e9
      for (const n of this.nodes) {
        const X = this.W / 2 + this.panX + (n.x - this.W / 2) * this.zoom
        const Y = this.H / 2 + this.panY + (n.y - this.H / 2) * this.zoom
        const d = Math.hypot(X - mx, Y - my)
        if (d < Math.max(12, n.r * this.zoom * 2.2) && d < bd) { bd = d; best = n }
      }
      this.hovered = best
      if (best) {
        this.hoverText = best.it.text.length > 26 ? best.it.text.slice(0, 26) + '…' : best.it.text
        this.hoverWhen = this.fmtHour(best.it.at)
        this.hoverX = mx + 14
        this.hoverY = my + 12
      } else { this.hoverText = '' }
    },
    tick(t) {
      this.raf = requestAnimationFrame(this.tick)
      if (document.hidden) return
      this.zoom += (this.zoomTarget - this.zoom) * 0.16
      this.draw(t)
    },
    draw(t) {
      const ctx = this.ctx, W = this.W, H = this.H
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const zx = (x) => W / 2 + this.panX + (x - W / 2) * this.zoom
      const zy = (y) => H / 2 + this.panY + (y - H / 2) * this.zoom
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.48, 30, W * 0.5, H * 0.5, Math.max(W, H) * 0.8)
      bg.addColorStop(0, 'rgba(30,66,132,.34)')
      bg.addColorStop(0.55, 'rgba(14,30,62,.22)')
      bg.addColorStop(1, 'rgba(6,12,26,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      for (const st of this.bg) {
        const tw = 0.55 + 0.45 * Math.sin(t / 700 + st.ph)
        ctx.fillStyle = 'rgba(190,215,255,' + (st.a * tw).toFixed(3) + ')'
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill()
      }
      // 直线边
      for (const [a, b, kind] of this.edges) {
        if (!a || !b || a.archived || b.archived) continue
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (kind !== 'ref' && d > 340) continue
        const al = kind === 'ref' ? Math.max(0.1, 0.26 * (1 - d / 900)) : Math.max(0.06, 0.24 * (1 - d / 420))
        ctx.strokeStyle = 'rgba(126,176,255,' + al.toFixed(3) + ')'
        ctx.lineWidth = kind === 'ref' ? 0.9 : 1
        if (kind === 'ref') ctx.setLineDash([3, 4])
        ctx.beginPath(); ctx.moveTo(zx(a.x), zy(a.y)); ctx.lineTo(zx(b.x), zy(b.y)); ctx.stroke()
        if (kind === 'ref') ctx.setLineDash([])
      }
      // 星
      for (const n of this.nodes) {
        const X = zx(n.x), Y = zy(n.y)
        const rad = Math.max(1.1, n.r * this.zoom * 0.62)
        const blink = 0.62 + 0.38 * Math.sin(t / n.sp + n.ph)
        const faded = (n.it.s || 0) < 0.16
        let alpha = (0.26 + (n.it.s || 0) * 0.74) * blink * (faded ? 0.5 : 1)
        if (!n.hit) alpha *= 0.16
        const spark = Math.pow(0.5 + 0.5 * Math.sin(t / (n.sp * 0.55) + n.ph * 1.7), 5)
        const a2 = Math.min(1, alpha * (0.72 + 0.7 * spark))
        const dot = Math.max(1.2, rad * (0.95 + 0.25 * spark))
        const point = ctx.createRadialGradient(X, Y, 0, X, Y, dot * 1.6)
        point.addColorStop(0, 'hsla(' + n.hue + ',100%,' + (86 + 10 * spark).toFixed(0) + '%,' + Math.min(1, a2 + 0.25).toFixed(3) + ')')
        point.addColorStop(0.42, 'hsla(' + (n.hue + 8) + ',100%,' + (66 + 8 * spark).toFixed(0) + '%,' + a2.toFixed(3) + ')')
        point.addColorStop(1, 'hsla(' + n.hue + ',100%,60%,0)')
        ctx.fillStyle = point
        ctx.beginPath(); ctx.arc(X, Y, dot * 1.6, 0, Math.PI * 2); ctx.fill()
        if (spark > 0.45) {
          ctx.fillStyle = 'rgba(238,248,255,' + Math.min(0.95, (spark - 0.45) * 1.7 * alpha).toFixed(3) + ')'
          ctx.beginPath(); ctx.arc(X, Y, Math.max(0.8, dot * 0.42), 0, Math.PI * 2); ctx.fill()
        }
        if (this.q && n.hit) {
          ctx.beginPath(); ctx.arc(X, Y, rad * 2.6 + 6, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(180,220,255,' + (0.28 + 0.22 * Math.sin(t / 260)).toFixed(3) + ')'
          ctx.lineWidth = 1.4; ctx.stroke()
        }
        if (n === this.hovered) {
          const ring = rad * 1.9 + 3
          ctx.beginPath(); ctx.arc(X, Y, ring, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(210,232,255,.55)'; ctx.lineWidth = 1.1; ctx.stroke()
        }
      }
      if (this.labels.length && this.zoom < 2.6) {
        ctx.textAlign = 'center'
        ctx.font = '600 11px "Microsoft YaHei", system-ui'
        for (const lb of this.labels) {
          ctx.fillStyle = 'rgba(146,188,244,' + (0.42 / Math.max(1, this.zoom * 0.9)).toFixed(3) + ')'
          ctx.fillText(lb.name, zx(lb.x), zy(lb.y))
        }
        ctx.textAlign = 'left'
      }
    }
  }
}
</script>

<style scoped>
.mmap-wrap { border: 1px solid rgba(120,170,255,.22); border-radius: 16px; overflow: hidden; background: linear-gradient(160deg, #0a1226, #0d1a33 55%, #101f3d); }
.mmap-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(120,170,255,.14); color: #cfe0fb; font-size: 12px; }
.mmap-tip { color: #8fa8cc; flex: 1; }
.mmap-search { width: 150px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(120,170,255,.26); background: rgba(10,22,45,.55); color: #dbe8ff; font-size: 12px; outline: none; }
.mmap-search:focus { border-color: rgba(150,200,255,.6); }
.mmap-count, .mmap-zoom { color: #8fa8cc; white-space: nowrap; }
.mmap-canvas-wrap { position: relative; height: min(72vh, 640px); }
.mmap-canvas-wrap canvas { display: block; }
.mmap-tipname { position: absolute; pointer-events: none; display: flex; flex-direction: column; padding: 4px 8px; border-radius: 8px; background: rgba(8,16,32,.85); border: 1px solid rgba(120,170,255,.3); color: #e6f0ff; font-size: 12px; }
.mmap-tipname span { color: #8fa8cc; font-size: 11px; }
.mmap-card { position: absolute; width: 250px; padding: 10px 12px; border-radius: 12px; background: rgba(9,18,36,.95); border: 1px solid rgba(120,170,255,.3); color: #dbe8ff; font-size: 12px; box-shadow: 0 16px 36px rgba(0,0,0,.5); }
.mmap-card-h { display: flex; justify-content: space-between; gap: 6px; }
.mmap-card-h i { cursor: pointer; font-style: normal; color: #8fa8cc; }
.mmap-card-t { color: #8fa8cc; margin: 4px 0 6px; }
.mmap-card-b { line-height: 1.6; color: #e6f0ff; }
.mmap-card-f { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
.mmap-tag { padding: 1px 7px; border-radius: 999px; background: rgba(60,110,200,.25); color: #a9c8ff; font-size: 11px; }
</style>
