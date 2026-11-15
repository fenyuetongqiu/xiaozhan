<template>
  <div class="giscus-wrap">
    <h3 class="giscus-title">💬 留个言吧</h3>
    <p class="giscus-tip">用 GitHub 账号登录就能评论，登录一次以后自动记住～</p>
    <div ref="box"></div>
  </div>
</template>

<script>
const REPO = 'fenyuetongqiu/xiaozhan'
const REPO_ID = 'R_kgDOVu80Ug'
const CATEGORY = 'Announcements'
const CATEGORY_ID = 'DIC_kwDOVu80Us4DLL6M'

export default {
  name: 'GiscusBox',
  mounted () {
    const el = this.$refs.box
    if (!el) return
    if (document.querySelector('script[data-giscus="1"]')) return
    const s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.setAttribute('data-giscus', '1')
    s.setAttribute('data-repo', REPO)
    s.setAttribute('data-repo-id', REPO_ID)
    s.setAttribute('data-category', CATEGORY)
    s.setAttribute('data-category-id', CATEGORY_ID)
    s.setAttribute('data-mapping', 'pathname')
    s.setAttribute('data-strict', '0')
    s.setAttribute('data-reactions-enabled', '1')
    s.setAttribute('data-emit-metadata', '0')
    s.setAttribute('data-input-position', 'top')
    s.setAttribute('data-theme', 'light')
    s.setAttribute('data-lang', 'zh-CN')
    s.setAttribute('data-loading', 'lazy')
    s.crossOrigin = 'anonymous'
    s.async = true
    el.appendChild(s)
  }
}
</script>

<style>
.giscus-wrap {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #e5e5e5;
}
.giscus-title {
  font-size: 1.05rem;
  margin: 0 0 4px;
}
.giscus-tip {
  font-size: 0.78rem;
  color: #999;
  margin: 0 0 14px;
}
</style>
