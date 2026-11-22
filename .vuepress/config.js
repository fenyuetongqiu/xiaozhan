const base = '/xiaozhan/'

module.exports = {
  base,
  title: '大肥鱼的小站',
  description: '文章、小游戏、留言 —— 风月同秋和他的大肥鱼',
  dest: 'dist',
  // 注意：VuePress 1 会给以 / 开头的地址自动补 base，所以这里写站内绝对路径但不要带 base
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
    ['meta', { name: 'theme-color', content: '#3b7dd8' }],
    ['link', { rel: 'preload', as: 'image', href: '/avatar.webp' }],
    ['link', { rel: 'stylesheet', href: '/extra.css' }],
    ['script', { src: '/switch.js', defer: '' }],
    // Live2D 看板娘（按顺序：Cubism Core → PIXI → pixi-live2d-display → 启动脚本）
    ['script', { src: '/vendor/live2d/live2dcubismcore.min.js', defer: '' }],
    ['script', { src: '/vendor/live2d/pixi.min.js', defer: '' }],
    ['script', { src: '/vendor/live2d/pixi-live2d-display.cubism4.min.js', defer: '' }],
    ['script', { src: '/live2d-pet.js', defer: '', 'data-base': base }]
  ],
  theme: 'reco',
  themeConfig: {
    nav: [
      { text: '首页', link: '/', icon: 'reco-home' },
      { text: '文章', link: '/timeline/', icon: 'reco-document' },
      { text: '记忆', link: '/memory/', icon: 'reco-blog' },
      { text: '记忆星图', link: '/memorymap/', icon: 'reco-other' },
      { text: '日记', link: '/diary/', icon: 'reco-date' },
      { text: '游戏', link: '/games/', icon: 'reco-other' },
      { text: '留言', link: '/guestbook/', icon: 'reco-message' },
      { text: '关于', link: '/about/', icon: 'reco-account' }
    ],
    sidebar: 'auto',
    type: 'blog',
    blogConfig: {
      category: { location: 0, text: '分类' },
      tag: { location: 0, text: '标签' }
    },
    friendLink: [],
    logo: '/logo.webp',
    search: false,
    searchMaxSuggestions: 10,
    lastUpdated: '最后更新',
    author: '风月同秋',
    authorAvatar: '/avatar.webp',
    record: '',
    startYear: '2026',
    noFoundPageByTencent: false
  },
  markdown: {
    lineNumbers: true
  }
}
