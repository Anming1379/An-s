<script setup>
import { ref } from 'vue'

// 复制功能
const contactInfo = ref({
  qq: '3865768909',
  wechat: 'Anming1379'
})

const copiedKey = ref('')

const handleCopy = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => {
      copiedKey.value = ''
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<template>
  <main class="main">
    <div class="container">
      <div class="page-header">
        <h1>联系我</h1>
        <p class="description">如果你想找我问问题, 或者只是找我交友, 我都欢迎!</p>
      </div>

      <div class="content">
        <!-- 联系信息 -->
        <section class="content-section">
          <h2>一起玩</h2>
          <p>找我玩！耶！交友!</p>
          
          <div class="contact-details">
            <div class="contact-item">
              <h3>邮箱</h3>
              <p><a href="mailto:lyric_x@outlook.com">lyric_x@outlook.com</a></p>
              
              <h3>QQ</h3>
              <p 
                class="contact-value" 
                @click="handleCopy(contactInfo.qq, 'qq')"
                :class="{ copied: copiedKey === 'qq' }"
              >
                {{ copiedKey === 'qq' ? '已复制到剪贴板！' : contactInfo.qq }}
              </p>
              
              <h3>微信</h3>
              <p 
                class="contact-value" 
                @click="handleCopy(contactInfo.wechat, 'wechat')"
                :class="{ copied: copiedKey === 'wechat' }"
              >
                {{ copiedKey === 'wechat' ? '已复制到剪贴板！' : contactInfo.wechat }}
              </p>
            </div>
          </div>
        </section>

        <!-- 社交媒体 -->
        <section class="content-section">
          <h2>社交媒体</h2>
          <p>关注我的bb空间！qwq</p>
          
          <div class="social-media-links">
            <div class="social-item">
              <h3>Bilibili</h3>
              <p><a href="https://b23.tv/st2JEJA" target="_blank">https://b23.tv/st2JEJA</a></p>
              <p class="social-description">我的B站主页，发点动画，教程之类的视频</p>
              
              <h3>GitHub</h3>
              <p><a href="https://github.com/Anming1379" target="_blank">https://github.com/Anming1379</a></p>
              <p class="social-description">我的Github，其实里面没啥东西（</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 联系页面特定样式 */
.page-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.page-header .description {
  max-width: 600px;
  margin: 0 auto;
}

.contact-details,
.social-media-links {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.contact-item,
.social-item {
  padding: var(--spacing-md);
  background: var(--color-background-light);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-accent);
}

.contact-item h3,
.social-item h3 {
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
  color: var(--color-accent);
}

.contact-value {
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background: rgba(62, 80, 182, 0.1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.contact-value:hover {
  background: rgba(62, 80, 182, 0.2);
}

.contact-value.copied {
  color: var(--color-accent);
}

.social-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin-top: var(--spacing-xs);
}

@media (min-width: 768px) {
  .contact-details,
  .social-media-links {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .contact-item,
  .social-item {
    flex: 1;
    min-width: 250px;
  }
}
</style>
