<script setup>
  import { ref, defineProps } from 'vue'

  const props = defineProps(['tip'])
  
  // 控制菜单开关的响应式状态
  const isMenuOpen = ref(false)
  
  // 切换菜单函数
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }
  
  // 关闭菜单函数（点击链接后）
  const closeMenu = () => {
    isMenuOpen.value = false
  }
</script>

<template>
  <header class="header">
    <div class="container">
      <nav class="nav" aria-label="主导航">
        <!-- 品牌 -->
        <div class="brand">
          <div class="brand-text">
            <h1><RouterLink to="/">An's web page</RouterLink></h1>
            <p class="tagline">{{props.tip}}</p>
          </div>
        </div>

        <button
          class="nav-toggle"
          @click="toggleMenu"
          :aria-expanded="isMenuOpen"
        >
          <span class="material-icons">
            {{ isMenuOpen ? 'close' : 'menu' }}
          </span>
        </button>
      
        <!-- 菜单列表 -->
        <ul 
          id="primary-menu" 
          class="nav-menu" 
          :class="{ active: isMenuOpen }"
        >
          <li role="none">
            <RouterLink
              role="menuitem"
              to="/"
              active-class="active"
              @click="closeMenu"
            > 首页 </RouterLink>
          </li>
          <li role="none">
            <RouterLink
              role="menuitem"
              to="/note"
              active-class="active"
              @click="closeMenu"
            > 笔记 </RouterLink>
          </li>
          <li role="none">
            <RouterLink
              role="menuitem"
              to="/alambda"
              active-class="active"
              @click="closeMenu"
            > ALambda </RouterLink>
          </li>
          <li role="none">
            <RouterLink
              role="menuitem"
              to="/contact"
              active-class="active"
              @click="closeMenu"
            > 联系 </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>