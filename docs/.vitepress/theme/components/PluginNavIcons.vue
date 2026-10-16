<template>
  <span ref="host" class="plugin-nav-icons">
    <img :src="src" alt="" />
  </span>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// BASE_URL 已含前后斜杠（dev 为 '/'，构建为 '/canvas-editor-docs/'）
const src = `${import.meta.env.BASE_URL}plugin-icons/puzzle.svg`

const host = ref<HTMLElement>()

function mountIntoNavLink() {
  const target = document.querySelector<HTMLAnchorElement>(
    '.VPNavBarMenu .VPNavBarMenuLink[href*="hufe.club/canvas-editor-plugin"]'
  )
  if (target && host.value) {
    target.appendChild(host.value)
    return true
  }
  return false
}

onMounted(() => {
  if (!mountIntoNavLink()) {
    // 导航栏尚未渲染完成时重试一次（如移动端抽屉切换后重新挂载）
    requestAnimationFrame(() => {
      if (!mountIntoNavLink() && host.value) {
        host.value.style.display = 'none'
      }
    })
  }
})
</script>

<style scoped>
.plugin-nav-icons {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
}
.plugin-nav-icons img {
  width: 16px;
  height: 16px;
}
</style>
