import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/canvas-editor-docs/',
  title: 'canvas-editor',
  description: 'rich text editor by canvas/svg',
  themeConfig: {
    i18nRouting: false,
    algolia: {
      appId: 'RWSVW6F3S5',
      apiKey: 'e462fffb4d2e9ab4a78c29e0b457ab33',
      indexName: 'hufe'
    },
    logo: '/favicon.png',
    nav: [
      {
        text: '指南',
        link: '/guide/start',
        activeMatch: '/guide/'
      },
      {
        text: 'Demo',
        link: 'https://hufe.club/canvas-editor'
      },
      {
        text: '官方插件',
        link: '/guide/plugin-internal.html'
      },
      {
        text: '赞助',
        link: 'https://hufe.club/donate.jpg'
      }
    ],
    sidebar: [
      {
        text: '开始',
        items: [
          { text: '入门', link: '/guide/start' },
          { text: '配置', link: '/guide/option' },
          { text: '国际化', link: '/guide/i18n' },
          { text: '数据结构', link: '/guide/schema' }
        ]
      },
      {
        text: '命令',
        items: [
          { text: '执行动作命令', link: '/guide/command-execute' },
          { text: '获取数据命令', link: '/guide/command-get' }
        ]
      },
      {
        text: '监听',
        items: [
          { text: '事件监听(listener)', link: '/guide/listener' },
          { text: '事件监听(eventBus)', link: '/guide/eventbus' }
        ]
      },
      {
        text: '快捷键',
        items: [
          { text: '内部快捷键', link: '/guide/shortcut-internal' },
          { text: '自定义快捷键', link: '/guide/shortcut-custom' }
        ]
      },
      {
        text: '右键菜单',
        items: [
          { text: '内部右键菜单', link: '/guide/contextmenu-internal' },
          { text: '自定义右键菜单', link: '/guide/contextmenu-custom' }
        ]
      },
      {
        text: '重写方法',
        items: [{ text: '重写方法', link: '/guide/override' }]
      },
      {
        text: 'API',
        items: [
          { text: '实例API', link: '/guide/api-instance' },
          { text: '通用API', link: '/guide/api-common' }
        ]
      },
      {
        text: '插件',
        items: [
          { text: '自定义插件', link: '/guide/plugin-custom' },
          { text: '官方插件', link: '/guide/plugin-internal' }
        ]
      }
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Hufe921/canvas-editor'
      }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2021-present Hufe'
    }
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN'
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          {
            text: 'Guide',
            link: '/en/guide/start',
            activeMatch: '/en/guide/'
          },
          {
            text: 'Demo',
            link: 'https://hufe.club/canvas-editor'
          },
          {
            text: 'Official plugin',
            link: '/en/guide/plugin-internal.html'
          },
          {
            text: 'Donate',
            link: 'https://hufe.club/donate.jpg'
          }
        ],
        sidebar: [
          {
            text: 'Start',
            items: [
              { text: 'start', link: '/en/guide/start' },
              { text: 'option', link: '/en/guide/option' },
              { text: 'i18n', link: '/en/guide/i18n' },
              { text: 'schema', link: '/en/guide/schema' }
            ]
          },
          {
            text: 'Command',
            items: [
              { text: 'execute', link: '/en/guide/command-execute' },
              { text: 'get', link: '/en/guide/command-get' }
            ]
          },
          {
            text: 'Listener',
            items: [
              { text: 'listener', link: '/en/guide/listener' },
              { text: 'eventbus', link: '/en/guide/eventbus' }
            ]
          },
          {
            text: 'Shortcut',
            items: [
              { text: 'internal', link: '/en/guide/shortcut-internal' },
              { text: 'custom', link: '/en/guide/shortcut-custom' }
            ]
          },
          {
            text: 'Contextmenu',
            items: [
              { text: 'internal', link: '/en/guide/contextmenu-internal' },
              { text: 'custom', link: '/en/guide/contextmenu-custom' }
            ]
          },
          {
            text: 'Override',
            items: [{ text: 'override', link: '/en/guide/override' }]
          },
          {
            text: 'Api',
            items: [
              { text: 'instance', link: '/en/guide/api-instance' },
              { text: 'common', link: '/en/guide/api-common' }
            ]
          },
          {
            text: 'Plugin',
            items: [
              { text: 'custom', link: '/en/guide/plugin-custom' },
              { text: 'official', link: '/en/guide/plugin-internal' }
            ]
          }
        ]
      }
    }
  }
})
