<!-- src/App.vue -->
<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()

  const headerTip = computed(() => 
    route.meta.headerTip || '桉的网页!你要陪桉一起玩嘛～'
  )
  
  const footerTip = computed(() => 
    route.meta.footerTip || '桉的个人网页, 放些桉的东西'
  )

  const showHeader = computed(() => route.meta.headerTip !== undefined)
  const showFooter = computed(() => route.meta.footerTip !== undefined)
</script>

<template>
  <!-- 页眉 -->
  <HeaderNav v-if="showHeader" :tip="headerTip" />
  <!-- 主内容 -->
  <RouterView />
  <!-- 页脚 -->
  <Footer v-if="showFooter" :tip="footerTip" />
</template>

<style scoped></style>