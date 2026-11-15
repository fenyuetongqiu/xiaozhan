<template>
  <div class="dk-shelf">
    <div class="dk-hint" v-if="!days.length">日记正在装订……</div>
    <div v-for="g in groups" :key="g.key" class="dk-month">
      <div class="dk-mtitle"><span>{{ g.label }}</span><em>{{ g.days.length }} 本</em></div>
      <div class="dk-row">
        <button
          v-for="(d, i) in g.days"
          :key="d.date"
          class="dk-book"
          :class="'c' + ((g.offset + i) % 6)"
          @click="open = d.idx"
        >
          <span class="dk-spine"></span>
          <span class="dk-top">{{ d.date }}</span>
          <span class="dk-title">{{ d.title }}</span>
          <span class="dk-rule"></span>
          <span class="dk-foot">{{ d.paras.length }} 页 · 点开读</span>
        </button>
      </div>
      <div class="dk-shelfbar"></div>
    </div>

    <div v-if="open >= 0" class="dk-mask" @click.self="open = -1">
      <div class="dk-paper">
        <button class="dk-close" @click="open = -1">×</button>
        <div class="dk-pdate">{{ days[open].date }}</div>
        <h2 class="dk-ptitle">{{ days[open].title }}</h2>
        <p v-for="(p, k) in days[open].paras" :key="k" v-html="fmt(p)"></p>
        <div class="dk-pfoot">—— 大肥鱼</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DiaryShelf',
  data () {
    return { days: [], open: -1 }
  },
  computed: {
    groups () {
      const out = []
      const map = {}
      this.days.forEach((d, i) => {
        const key = (d.date || '').slice(0, 7)
        if (!map[key]) {
          map[key] = { key, label: key.replace('-', ' 年 ') + ' 月', days: [], offset: out.length }
          out.push(map[key])
        }
        map[key].days.push(Object.assign({}, d, { idx: i }))
      })
      return out
    }
  },
  mounted () {
    fetch('/data/diary.json')
      .then(r => r.json())
      .then(d => { this.days = (d && d.days) || [] })
      .catch(() => { this.days = [] })
  },
  methods: {
    fmt (p) {
      const esc = String(p)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return esc.replace(/`([^`]+)`/g, '<code>$1</code>')
    }
  }
}
</script>

<style>
.dk-shelf { margin: 2rem 0 1rem; }
.dk-hint { color: #8a93a6; font-size: 14px; }
.dk-month { margin-bottom: 26px; }
.dk-mtitle {
  display: flex; align-items: baseline; gap: 10px;
  padding: 0 0 12px 8px;
}
.dk-mtitle span {
  font-size: 19px; font-weight: 600; color: #22355c;
  letter-spacing: .04em;
}
.dk-mtitle em { font-style: normal; font-size: 12px; color: #8a93a6; }
.dk-row {
  display: flex; flex-wrap: wrap; gap: 14px;
  padding: 0 4px 0 8px;
}
.dk-book {
  position: relative;
  width: 148px; height: 196px;
  padding: 18px 14px 14px 22px;
  text-align: left;
  border: 0; border-radius: 4px 10px 10px 4px;
  color: #eaf2ff; cursor: pointer;
  background: linear-gradient(155deg, #2c4a7d 0%, #1d3157 62%, #16233d 100%);
  box-shadow: 0 10px 22px rgba(20, 34, 62, .28), inset 0 0 0 1px rgba(255,255,255,.07);
  transition: transform .18s ease, box-shadow .18s ease;
  display: flex; flex-direction: column;
  font-family: inherit;
  overflow: hidden;
}
.dk-book:hover { transform: translateY(-6px) rotate(-.6deg); box-shadow: 0 16px 30px rgba(20, 34, 62, .38); }
.dk-book.c1 { background: linear-gradient(155deg, #36507a 0%, #233a5e 62%, #182741 100%); }
.dk-book.c2 { background: linear-gradient(155deg, #2f5b6b 0%, #1f4250 62%, #16313c 100%); }
.dk-book.c3 { background: linear-gradient(155deg, #4a4668 0%, #333052 62%, #242238 100%); }
.dk-book.c4 { background: linear-gradient(155deg, #44526b 0%, #2e3a50 62%, #212a3a 100%); }
.dk-book.c5 { background: linear-gradient(155deg, #315a52 0%, #214440 62%, #172f2d 100%); }
.dk-spine {
  position: absolute; left: 0; top: 0; bottom: 0; width: 10px;
  background: linear-gradient(90deg, rgba(0,0,0,.42), rgba(255,255,255,.10));
}
.dk-top { font-size: 12px; letter-spacing: .06em; color: #9fc0ea; }
.dk-title {
  margin-top: 10px; font-size: 16px; line-height: 1.45; font-weight: 600;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.dk-rule { margin: auto 0 8px; height: 1px; background: rgba(255,255,255,.16); }
.dk-foot { font-size: 11px; color: rgba(220,235,255,.55); letter-spacing: .04em; }
.dk-shelfbar {
  height: 12px; margin: 10px 0 0;
  background: linear-gradient(180deg, rgba(120,145,180,.35), rgba(120,145,180,0));
  border-top: 1px solid rgba(120,145,180,.45);
  border-radius: 0 0 6px 6px;
  width: 100%;
}

.dk-mask {
  position: fixed; inset: 0; z-index: 120;
  background: rgba(12, 20, 34, .55);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 6vh 16px;
  overflow-y: auto;
}
.dk-paper {
  position: relative;
  width: min(720px, 100%);
  background: #fdfaf3;
  color: #2b2f3a;
  border-radius: 10px;
  padding: 40px 44px 32px;
  box-shadow: 0 26px 60px rgba(8, 14, 26, .40);
  line-height: 1.95; font-size: 16px;
}
.dk-paper p { margin: .9em 0; }
.dk-paper code {
  background: rgba(40, 60, 90, .08); color: #2f4a72;
  padding: .5px 5px; border-radius: 4px;
  font-size: .9em; font-family: Consolas, Menlo, monospace;
}
.dk-pdate { font-size: 13px; letter-spacing: .08em; color: #9a7b4f; }
.dk-ptitle { margin: .35em 0 1.1em; font-size: 24px; color: #22304a; border: 0 !important; padding: 0 !important; }
.dk-ptitle::before, .dk-ptitle::after { content: none !important; display: none !important; }
.dk-pfoot { margin-top: 1.6em; text-align: right; color: #a08a6a; font-size: 13px; }
.dk-close {
  position: absolute; right: 14px; top: 10px;
  width: 30px; height: 30px; border-radius: 50%;
  border: 0; background: rgba(30, 40, 60, .07); color: #445;
  font-size: 20px; line-height: 1; cursor: pointer;
}
.dk-close:hover { background: rgba(30, 40, 60, .14); }

@media (max-width: 560px) {
  .dk-book { width: calc(50% - 7px); height: 176px; }
  .dk-paper { padding: 30px 22px 26px; font-size: 15px; }
}
</style>
