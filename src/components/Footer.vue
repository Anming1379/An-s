<script setup>
  import { defineProps } from 'vue'
  
  const props = defineProps(['tip'])
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>An's web page</h3>
          <p>{{props.tip}}</p>
        </div>

        <div class="footer-section">
          <h4>快速链接</h4>
          <ul class="footer-links">
            <li><RouterLink to="/">首页</RouterLink></li>
            <li><RouterLink to="/note">笔记</RouterLink></li>
            <li><RouterLink to="/alambda">ALambda</RouterLink></li>
            <li><RouterLink to="/contact">联系</RouterLink></li>
          </ul>
        </div>
      </div>

      <div class="copyright">
        <p>© 2025 AnmingCat</p>
      </div>
    </div>
  </footer>
</template>