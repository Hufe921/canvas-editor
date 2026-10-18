import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/canvas-editor-docs/',
  title: '@herberthe/canvas-editor',
  description: 'A HarfBuzz-powered Canvas-only rich text editor',
  themeConfig: {
    i18nRouting: false,
    logo: '/favicon.png',
    nav: [
      {
        text: '指南',
        link: '/guide/start',
        activeMatch: '/guide/'
      },
      {
        text: 'Demo source',
        link: 'https://github.com/HerbertHe/canvas-editor#features-and-development'
      },
      {
        text: '上游插件（需验证兼容性）',
        link: 'https://hufe.club/canvas-editor-plugin'
      },
      {
        text: '调试工具',
        link: '/guide/devtools.html'
      },
      {
        text: '项目关系与差异',
        link: '/guide/fork-and-differences'
      }
    ],
    sidebar: [
      {
        text: '开始',
        items: [
          { text: '入门', link: '/guide/start' },
          { text: '项目关系与差异', link: '/guide/fork-and-differences' },
          { text: '配置', link: '/guide/option' },
          { text: '字体与 ESM 迁移', link: '/guide/font-and-esm-migration' },
          { text: '国际化', link: '/guide/i18n' },
          { text: '数据结构', link: '/guide/schema' },
          { text: '架构', link: '/guide/architecture' },
          { text: 'RTL 排版设计', link: '/guide/rtl-layout-design' },
          { text: 'RTL 延期 TODO', link: '/guide/rtl-deferred-todo' },
          { text: '功能总览', link: '/guide/features' },
          { text: '实验特性', link: '/guide/lab' }
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
        text: '控件',
        items: [
          { text: '配置', link: '/guide/control/option' },
          { text: '方法', link: '/guide/control/command' },
          { text: '级联表达式', link: '/guide/control/cascade' },
          { text: '验证', link: '/guide/control/validate' }
        ]
      },
      {
        text: '宏',
        items: [{ text: '宏(Macro)', link: '/guide/macro' }]
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
          {
            text: '上游插件（需验证兼容性）',
            link: 'https://hufe.club/canvas-editor-plugin'
          },
          { text: '自定义插件', link: '/guide/plugin-custom' },
          { text: '开发调试工具', link: '/guide/devtools' }
        ]
      }
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/HerbertHe/canvas-editor'
      }
    ],
    footer: {
      message: 'MIT · Independent fork of Hufe921/canvas-editor · Canvas-only',
      copyright:
        'Copyright © 2026-present Herbert He; original © 2021-present hufe'
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
            text: 'Demo source',
            link: 'https://github.com/HerbertHe/canvas-editor#features-and-development'
          },
          {
            text: 'Upstream plugins',
            link: 'https://hufe.club/canvas-editor-plugin'
          },
          {
            text: 'DevTools',
            link: '/en/guide/devtools.html'
          },
          {
            text: 'Fork and differences',
            link: '/en/guide/fork-and-differences'
          }
        ],
        sidebar: [
          {
            text: 'Start',
            items: [
              { text: 'start', link: '/en/guide/start' },
              {
                text: 'Fork and differences',
                link: '/en/guide/fork-and-differences'
              },
              { text: 'option', link: '/en/guide/option' },
              {
                text: 'Fonts and ESM migration',
                link: '/en/guide/font-and-esm-migration'
              },
              { text: 'i18n', link: '/en/guide/i18n' },
              { text: 'schema', link: '/en/guide/schema' },
              { text: 'architecture', link: '/en/guide/architecture' },
              {
                text: 'RTL layout design',
                link: '/en/guide/rtl-layout-design'
              },
              {
                text: 'RTL deferred TODO',
                link: '/en/guide/rtl-deferred-todo'
              },
              { text: 'features', link: '/en/guide/features' },
              { text: 'lab', link: '/en/guide/lab' }
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
            text: 'Control',
            items: [
              { text: 'option', link: '/en/guide/control/option' },
              { text: 'command', link: '/en/guide/control/command' },
              { text: 'cascade', link: '/en/guide/control/cascade' },
              { text: 'validate', link: '/en/guide/control/validate' }
            ]
          },
          {
            text: 'Macro',
            items: [{ text: 'macro', link: '/en/guide/macro' }]
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
              {
                text: 'upstream (verify compatibility)',
                link: 'https://hufe.club/canvas-editor-plugin'
              },
              { text: 'custom', link: '/en/guide/plugin-custom' },
              { text: 'devtools', link: '/en/guide/devtools' }
            ]
          }
        ]
      }
    }
  }
})
