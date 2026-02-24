import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import ZreadBadge from './components/ZreadBadge.vue'
import DeepWikiBadge from './components/DeepWikiBadge.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () =>
        h(
          'div',
          {
            class: 'nav-badges',
            style:
              'display:flex;align-items:center;gap:8px;margin-left:12px;position:relative;'
          },
          [h(ZreadBadge), h(DeepWikiBadge)]
        )
    })
  },
  enhanceApp({ app }) {
    app.component('ZreadBadge', ZreadBadge)
    app.component('DeepWikiBadge', DeepWikiBadge)
  }
} satisfies Theme
