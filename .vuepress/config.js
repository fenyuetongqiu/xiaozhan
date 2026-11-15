module.exports = {
  base: '/xiaozhan/',
  title: '大肥鱼的小站',
  description: '文章、小游戏、留言 —— 风月同秋和他的大肥鱼',
  dest: 'dist',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
    ['meta', { name: 'theme-color', content: '#3b7dd8' }],
    ['link', { rel: 'preload', as: 'image', href: '/avatar.webp' }],
    ['link', { rel: 'stylesheet', href: '/extra.css' }],
    ['script', { src: '/switch.js', defer: '' }]
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
