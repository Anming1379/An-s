<!-- src/views/Alambda.vue -->
<script setup>
// 不需要额外逻辑，保持简洁
</script>

<template>
  <main class="main">
    <div class="container">
      <div class="page-header">
        <h1>ALambda</h1>
        <p class="page-description">一个网页小工具集，各种各样乱七八糟的好玩的小工具</p>
      </div>
      
      <div class="tools-grid">
        <div class="tool-card">
          <span class="material-icons">menu_book</span>
          <h3 class="tool-title">答案之书</h3>
          <p class="tool-description">
            遇到难以抉择的问题？让答案之书为你提供启示和指引。点击任意问题，获取随机答案。
          </p>
          <div class="tool-link">
            <RouterLink to="/tool/book" class="btn btn-primary">打开工具</RouterLink>
          </div>
        </div>

        <div class="tool-card">
          <span class="material-icons">qr_code_scanner</span>
          <h3 class="tool-title">二维码生成器</h3>
          <p class="tool-description">
            快速将文本、链接等信息转换为二维码，支持自定义颜色和尺寸，轻松分享与传播。
          </p>
          <div class="tool-link">
            <RouterLink to="/tool/qr" class="btn btn-primary">打开工具</RouterLink>
          </div>
        </div>

        <div class="tool-card">
          <span class="material-icons">collections</span>
          <h3 class="tool-title">图片转换/隐写</h3>
          <p class="tool-description">
            图片隐写, 图片格式转换, 图片压缩工具, 对 jpg , png , webp 等格式图片进行处理
          </p>
          <div class="tool-link">
            <RouterLink to="/tool/image" class="btn btn-primary">打开工具</RouterLink>
          </div>
        </div>

        <div class="tool-card">
          <span class="material-icons">more_horiz</span>
          <h3 class="tool-title">更多工具</h3>
          <p class="tool-description">
            我们正在开发更多实用工具，包括时间管理、文件转换、开发辅助等，敬请期待！
          </p>
          <div class="tool-link">
            <a href="#" class="btn btn-secondary" @click.prevent>即将推出</a>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main {
  padding: calc(var(--spacing-xl) + 50px) 0 var(--spacing-xl);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
  margin: var(--spacing-xl) 0;
}

.tool-card {
  background: var(--color-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--color-accent);
}

.material-icons {
  font-family: 'Material Icons', 'Material Icons Local', sans-serif !important;
  font-weight: normal;
  font-style: normal;
  font-size: 48px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  margin-bottom: var(--spacing-sm);
  color: var(--color-accent);
  text-align: center;
  width: 100%;
}

.tool-card .material-icons {
  font-size: 3rem;
  height: 60px;
  line-height: 60px;
}

.tool-title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
  color: var(--color-contrast);
}

.tool-description {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  flex-grow: 1;
}

.tool-link a {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.5rem 0;
  box-sizing: border-box;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: var(--font-size-xxl);
  margin-bottom: var(--spacing-sm);
}

.page-description {
  max-width: 600px;
  margin: 0 auto;
  font-size: var(--font-size-lg);
  color: var(--color-text-light);
}

@media (max-width: 767px) {
  .tools-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}

@media (min-width: 1200px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
