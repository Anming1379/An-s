<script setup></script>

<template>
  <main class="main">
    <div class="container">
      <div class="error-container">
        <div class="error-code">404</div>
        <h2 class="error-title">Not found</h2>
        
        <p class="error-message">
          哎？好像...迷路了......
        </p>
        
        <!-- 返回按钮 - 与主站按钮保持一致 -->
        <div class="error-actions">
          <RouterLink to="/" class="btn btn-primary">返回首页</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
    /* 404页面简约样式 */
    .error-container {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .error-code {
      font-size: clamp(4rem, 10vw, 8rem);
      font-weight: 300;
      color: var(--color-contrast);
      line-height: 1;
      margin-bottom: var(--spacing-sm);
      font-family: var(--font-main);
    }
    
    .error-title {
      font-size: var(--font-size-xl);
      color: var(--color-contrast);
      margin-bottom: var(--spacing-md);
      font-weight: 400;
    }
    
    .error-message {
      max-width: 600px;
      margin: 0 auto var(--spacing-lg);
      color: var(--color-text-light);
      font-size: var(--font-size-md);
    }
    
    .error-actions {
      margin-top: var(--spacing-md);
      display: flex;
      justify-content: center;
    }
    
    /* 响应式调整 - 与主站保持一致 */
    @media (max-width: 767px) {
      .error-actions {
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      
      .error-actions .btn {
        width: 100%;
        max-width: 300px;
        min-height: 2.75rem; /* 触摸友好 */
        margin-bottom: var(--spacing-sm);
      }
    }
    
    /* PC端按钮优化 - 与主站保持一致 */
    @media (min-width: 768px) {
      .error-actions {
        gap: var(--spacing-md);
      }
      
      .error-actions .btn {
        min-height: 3rem; /* 确保按钮有足够的最小高度 */
      }
    }
    
    /* 中等屏幕进一步优化 */
    @media (min-width: 1024px) {
      .error-actions {
        gap: var(--spacing-lg); /* 在更大的屏幕上进一步增加按钮间距 */
      }
    }
</style>