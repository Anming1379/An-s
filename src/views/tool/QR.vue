<!-- QRBarcode.vue -->
<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import QRCode   from 'qrcode'          // 官方 qrcode 库
import JsBarcode from 'jsbarcode'

/* ===== 响应式数据 ===== */
const inputText = ref('https://example.com')

/* ===== DOM 挂载点 ===== */
const qrBoxRef   = ref(null)
const barBoxRef  = ref(null)

/* ===== 二维码 ===== */
async function makeQR(text) {
  const box = qrBoxRef.value
  if (!box) return
  box.innerHTML = ''                // 清空旧图
  if (!text) {
    box.innerHTML = '<p class="placeholder">输入内容后二维码将显示在这里</p>'
    return
  }
  // 生成 DataURL
  const dataUrl = await QRCode.toDataURL(text, { width: 256, margin: 1 })
  // 插入 <img>
  const img = new Image()
  img.src = dataUrl
  img.className = 'qr-img'
  box.appendChild(img)
}

function downloadQR() {
  const img = qrBoxRef.value?.querySelector('img')
  if (!img) return alert('请先输入内容生成二维码')
  const a = document.createElement('a')
  a.download = `qrcode_${inputText.value.slice(0, 20)}.png`
  a.href = img.src
  a.click()
}

/* ===== 条形码 ===== */
function makeBarcode(text) {
  const box = barBoxRef.value
  if (!box) return
  box.innerHTML = ''
  if (!text) {
    box.innerHTML = '<p class="placeholder">输入内容后条形码将显示在这里</p>'
    return
  }
  const canvas = document.createElement('canvas')
  box.appendChild(canvas)
  try {
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 16,
      margin: 10,
      background: '#fff',
      lineColor: '#111'
    })
  } catch (e) {
    box.innerHTML = '<p class="error">无法生成条形码，请确保输入内容为有效字符</p>'
  }
}

function downloadBarcode() {
  const canvas = barBoxRef.value?.querySelector('canvas')
  if (!canvas) return alert('请先输入内容生成条形码')
  const a = document.createElement('a')
  a.download = `barcode_${inputText.value.slice(0, 20)}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

/* ===== 联动 ===== */
watch(inputText, () => {
  nextTick(() => {
    const t = inputText.value.trim()
    makeQR(t)
    makeBarcode(t)
  })
})

onMounted(() => {
  const t = inputText.value.trim()
  makeQR(t)
  makeBarcode(t)
})
</script>

<template>
 <div class="top-controls">
      <RouterLink to="/alambda" class="back-home" ref="backHomeBtn">← 返回首页</RouterLink>
      <button class="close-answer-top" ref="closeAnswerTopBtn" aria-label="关闭答案">× 关闭</button>
    </div>
    <main class="main">
      <header class="tool-header">
      <h1>二维码与条形码生成器</h1>
      <p class="tagline">输入内容同时生成二维码和条形码，支持 PNG 下载</p>
    </header>

    <!-- 输入 -->
    <section class="input-section">
      <h2>输入内容</h2>
      <input
        v-model="inputText"
        type="text"
        placeholder="请输入文本、网址、数字等内容"
        aria-label="编码内容输入框"
      />
      <p class="input-hint">支持 URL、文本、联系方式、数字等</p>
    </section>

    <!-- 结果 -->
    <div class="codes-container">
      <div class="code-section">
        <h3>二维码 (QR Code)</h3>
        <div ref="qrBoxRef" class="canvas-box"></div>
        <button class="download-btn" @click="downloadQR">下载二维码</button>
      </div>

      <div class="code-section">
        <h3>条形码 (Barcode)</h3>
        <div ref="barBoxRef" class="canvas-box"></div>
        <button class="download-btn" @click="downloadBarcode">下载条形码</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.top-controls {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid var(--color-border);
}

.back-home, .close-answer-top {
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: none;
  color: var(--color-text-light);
  text-decoration: none;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.back-home:hover, .close-answer-top:hover {
  color: var(--color-accent);
}

.close-answer-top {
  display: none;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(var(--spacing-xl) + 50px) 0 var(--spacing-xl);
}

/* ---- 整体 ---- */
.tool-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ---- 顶部 ---- */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
}
.tool-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}
.tool-header h1 {
  font-size: 24px;
  margin: 0 0 4px;
}
.tagline {
  font-size: 14px;
  color: #999;
}

/* ---- 输入 ---- */
.input-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
.input-section h2 {
  font-size: 18px;
  margin: 0 0 12px;
  text-align: center;
  color: #3b82f6;
}
input {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.input-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 6px;
}

/* ---- 结果 ---- */
.codes-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.code-section {
  padding: 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  text-align: center;
}
.code-section h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #3b82f6;
}
.canvas-box {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.download-btn {
  margin-top: 12px;
  padding: 6px 16px;
  font-size: 14px;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.download-btn:hover {
  background: #2563eb;
}
.placeholder,
.error {
  color: #999;
  font-style: italic;
}

/* ---- 响应式 ---- */
@media (min-width: 768px) {
  .codes-container {
    flex-direction: row;
  }
  .code-section {
    flex: 1;
  }
}
</style>
