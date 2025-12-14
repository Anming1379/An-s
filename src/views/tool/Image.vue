<script setup>
/* --------------------  1.  导入  -------------------- */
import { ref, onUnmounted } from 'vue'
import { Jimp } from 'jimp'   // 浏览器可用纯 JS 图像库

/* --------------------  2.  响应式状态  -------------------- */
const activeMainTab = ref('steganography')
const activeSubTab  = ref('merge')

const mergeImageFile   = ref(null)
const mergeArchiveFile = ref(null)
const extractFile      = ref(null)
const convertFile      = ref(null)

const mergeStatus = ref({ msg: '', type: '', show: false })
const extractStatus = ref({ msg: '', type: '', show: false })
const convertStatus = ref({ msg: '', type: '', show: false })

const mergeDownUrl = ref('')
const extractDownUrl = ref('')
const mergeDownName = ref('')
const extractDownName = ref('')

const outFormat = ref('image/jpeg')
const quality   = ref(1)
const customName = ref('')

const canvasRef = ref(null)
let uploadedImg = null
const tempUrls = []          // 收集 blob url

/* --------------------  3.  工具函数  -------------------- */
const toast = (target, msg, type = 'success') => {
  target.value = { msg, type, show: true }
  setTimeout(() => (target.value.show = false), 5000)
}

const makeDownUrl = (blob, name) => {
  const url = URL.createObjectURL(blob)
  tempUrls.push(url)
  return { url, name }
}

onUnmounted(() => tempUrls.forEach(u => URL.revokeObjectURL(u)))

/* --------------------  4.  隐写：LSB 实现  -------------------- */
/**
 * 把任意 Uint8Array 隐写到图片像素（LSB）
 * 前 4 字节存长度，后面存数据
 */
async function embedLSB(imgFile, dataU8) {
  const img = await Jimp.read(URL.createObjectURL(imgFile))
  const bmp = img.bitmap
  const need = (4 + dataU8.length) * 8
  if (bmp.data.length < need) throw new Error('图片太小，放不下数据')

  let idx = 0 // 字节指针
  /* 写长度 */
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (dataU8.length >>> (i * 8 + j)) & 1
      bmp.data[idx] = (bmp.data[idx] & 0xFE) | bit
      idx++
    }
  }
  /* 写数据 */
  for (let i = 0; i < dataU8.length; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (dataU8[i] >>> j) & 1
      bmp.data[idx] = (bmp.data[idx] & 0xFE) | bit
      idx++
    }
  }
  const mime = img.getMIME()
  const buf = await img.getBufferAsync(mime)
  return new Blob([buf], { type: mime })
}

/** 从 LSB 隐写图里提取数据 */
async function extractLSB(imgFile) {
  const img = await Jimp.read(URL.createObjectURL(imgFile))
  const bmp = img.bitmap
  let idx = 0
  /* 读长度 */
  let len = 0
  for (let i = 0; i < 4; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte |= (bmp.data[idx] & 1) << j
      idx++
    }
    len |= byte << (i * 8)
  }
  if (len <= 0 || len > bmp.data.length) throw new Error('未检测到有效数据')
  /* 读数据 */
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte |= (bmp.data[idx] & 1) << j
      idx++
    }
    out[i] = byte
  }
  return out
}

/* --------------------  5.  文件选择 & Canvas  -------------------- */
const pickFile = (e, ref) => {
  const f = e.target.files[0]
  if (!f) return
  ref.value = f
  if (ref === convertFile) loadToCanvas(f)
}

const loadToCanvas = file => {
  const reader = new FileReader()
  reader.onload = re => {
    const img = new Image()
    img.onload = () => {
      uploadedImg = img
      const cv = canvasRef.value
      const ctx = cv.getContext('2d')
      cv.width = img.width
      cv.height = img.height
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(img, 0, 0)
      const ratio = Math.min(600 / img.width, 400 / img.height)
      if (ratio < 1) {
        cv.style.width = img.width * ratio + 'px'
        cv.style.height = img.height * ratio + 'px'
      } else {
        cv.style.width = 'auto'
        cv.style.maxWidth = '100%'
      }
    }
    img.src = re.target.result
  }
  reader.readAsDataURL(file)
}

const switchMain = t => (activeMainTab.value = t)
const switchSub  = t => (activeSubTab.value  = t)

/* --------------------  6.  业务：合并 / 提取 / 转换  -------------------- */
const doMerge = async () => {
  if (!mergeImageFile.value || !mergeArchiveFile.value) return toast(mergeStatus, '请先选择文件', 'error')
  try {
    const buf = await mergeArchiveFile.value.arrayBuffer()
    const blob = await embedLSB(mergeImageFile.value, new Uint8Array(buf))
    const { url, name } = makeDownUrl(blob, `stego_${mergeImageFile.value.name}`)
    mergeDownUrl.value = url
    mergeDownName.value = name
    toast(mergeStatus, '隐写完成！', 'success')
  } catch (e) {
    toast(mergeStatus, e.message || '隐写失败', 'error')
  }
}

const doExtract = async () => {
  if (!extractFile.value) return toast(extractStatus, '请选择图片', 'error')
  try {
    const u8 = await extractLSB(extractFile.value)
    const isZip = u8[0] === 0x50 && u8[1] === 0x4B
    const ext = isZip ? 'zip' : 'rar'
    const blob = new Blob([u8], { type: isZip ? 'application/zip' : 'application/x-rar-compressed' })
    const { url, name } = makeDownUrl(blob, `extracted.${ext}`)
    extractDownUrl.value = url
    extractDownName.value = `下载提取的${ext.toUpperCase()}`
    toast(extractStatus, '提取完成！', 'success')
  } catch (e) {
    toast(extractStatus, e.message || '提取失败', 'error')
  }
}

const doConvert = () => {
  if (!uploadedImg) return toast(convertStatus, '请先选择图片', 'error')
  try {
    const canvas = canvasRef.value
    const ext = outFormat.value.split('/')[1] === 'jpeg' ? 'jpg' : outFormat.value.split('/')[1]
    const name = (customName.value.trim() || 'converted') + '.' + ext
    const url = canvas.toDataURL(outFormat.value, quality.value)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    toast(convertStatus, '转换成功，已下载！', 'success')
  } catch (e) {
    toast(convertStatus, '转换失败', 'error')
  }
}
</script>

<template>
  <div class="top-controls">
      <a href="/alambda" class="back-home" ref="backHomeBtn">← 返回首页</a>
      <button class="close-answer-top" ref="closeAnswerTopBtn" aria-label="关闭答案">× 关闭</button>
    </div>
  <main class="main">
    <div class="container">
      <div class="profile" id="home">
        <div class="profile-content">
          <h1>图片工具</h1>
          <p class="description">提供图片隐写和格式转换功能，支持多种图片格式处理</p>
        </div>
      </div>

      <div class="tool-container">
        <!-- 主 Tab -->
        <div class="tab-container">
          <div class="tab" :class="{active:activeMainTab==='steganography'}" @click="switchMain('steganography')">图片隐写</div>
          <div class="tab" :class="{active:activeMainTab==='converter'}"   @click="switchMain('converter')">格式转换</div>
        </div>

        <!-- 隐写面板 -->
        <div v-show="activeMainTab==='steganography'" id="steganographyTab">
          <div class="sub-tab-container">
            <div class="sub-tab" :class="{active:activeSubTab==='merge'}"  @click="switchSub('merge')">合并文件</div>
            <div class="sub-tab" :class="{active:activeSubTab==='extract'}" @click="switchSub('extract')">提取文件</div>
          </div>

          <!-- 合并 -->
          <div v-show="activeSubTab==='merge'" class="tab-content">
            <div class="hint">选择图片文件和压缩文件，将它们合并成一个图片文件（使用像素隐写技术）</div>
            <div class="input-group">
              <label>图片文件 (PNG, JPG, JPEG, WebP)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" @change="e=>pickFile(e,mergeImageFile)">
            </div>
            <div class="input-group">
              <label>压缩文件 (ZIP, RAR)</label>
              <input type="file" accept=".zip,.rar" @change="e=>pickFile(e,mergeArchiveFile)">
            </div>
            <button class="tool-btn" @click="doMerge">开始合并</button>
            <div v-show="mergeStatus.show" :class="['status-message', mergeStatus.type]">{{ mergeStatus.msg }}</div>
            <div v-show="mergeDownUrl" class="download-link">
              <a :href="mergeDownUrl" :download="mergeDownName">下载隐写后的图片</a>
            </div>
          </div>

          <!-- 提取 -->
          <div v-show="activeSubTab==='extract'" class="tab-content">
            <div class="hint">选择隐写后的图片文件，提取其中隐藏的压缩文件</div>
            <div class="input-group">
              <label>隐写后的图片文件</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" @change="e=>pickFile(e,extractFile)">
            </div>
            <button class="tool-btn" @click="doExtract">开始提取</button>
            <div v-show="extractStatus.show" :class="['status-message', extractStatus.type]">{{ extractStatus.msg }}</div>
            <div v-show="extractDownUrl" class="download-link">
              <a :href="extractDownUrl" :download="extractDownName">{{ extractDownName }}</a>
            </div>
          </div>
        </div>

        <!-- 转换面板 -->
        <div v-show="activeMainTab==='converter'" id="converterTab">
          <div class="hint">上传图片进行格式转换，支持调整压缩质量和自定义文件名</div>
          <div class="input-group">
            <label>选择图片文件</label>
            <input type="file" accept="image/*" @change="e=>pickFile(e,convertFile)">
          </div>
          <div class="canvas-container"><canvas id="myCanvas" ref="canvasRef"></canvas></div>
          <div class="input-group">
            <label>选择输出格式：</label>
            <select v-model="outFormat">
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>
          <div class="input-group">
            <label>压缩质量 (0.0 - 1.0)：</label>
            <div class="slider-container">
              <input type="range" min="0" max="1" step="0.01" v-model="quality">
              <span class="quality-value">{{ quality.toFixed(2) }}</span>
            </div>
          </div>
          <div class="input-group">
            <label>更改文件名（不含扩展名）：</label>
            <input type="text" v-model="customName" placeholder="请输入文件名，不输入则不更改">
          </div>
          <button class="tool-btn" @click="doConvert">保存图片</button>
          <div v-show="convertStatus.show" :class="['status-message', convertStatus.type]">{{ convertStatus.msg }}</div>
        </div>
      </div>

      <div class="contact-details">
        <div class="contact-item">
          <h3>使用说明</h3>
          <p>1. 图片隐写：将压缩文件嵌入图片像素中，不影响外观</p>
          <p>2. 格式转换：支持JPEG/PNG/WEBP互转，可调整质量和文件名</p>
        </div>
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

  /* 保持原有样式不变 */
  .tool-container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--color-base);
      padding: 2rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .tab-container {
      display: flex;
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--color-border);
    }

    .tab {
      flex: 1;
      text-align: center;
      padding: 1rem 0;
      cursor: pointer;
      font-weight: 500;
      color: var(--color-text-light);
      position: relative;
      transition: all 0.3s ease;
    }

    .tab:hover {
      color: var(--color-contrast);
    }

    .tab.active {
      color: var(--color-accent);
      font-weight: 600;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 2px;
      background-color: var(--color-accent);
    }

    /* 主内容区域隐藏/显示 */
    .tab-content {
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-text);
    }

    .input-group input[type="file"],
    .input-group select,
    .input-group input[type="range"],
    .input-group input[type="text"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-base);
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .input-group input[type="file"]:hover,
    .input-group select:focus,
    .input-group input[type="range"]:focus,
    .input-group input[type="text"]:focus {
      border-color: var(--color-accent);
      outline: none;
      box-shadow: 0 0 0 3px rgba(62, 80, 182, 0.1);
    }

    .input-group input[type="range"] {
      padding: 0.5rem 0;
    }

    .hint {
      font-size: 0.875rem;
      color: var(--color-text-light);
      text-align: center;
      margin-bottom: 2rem;
      padding: 0.75rem;
      background: rgba(62, 80, 182, 0.05);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-accent);
    }

    .tool-btn {
      width: 100%;
      padding: 1rem;
      background: var(--color-contrast);
      color: var(--color-base);
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }

    .tool-btn:hover {
      background: var(--color-accent);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(62, 80, 182, 0.2);
    }

    .tool-btn:active {
      transform: translateY(0);
    }

    .tool-btn.processing {
      background: var(--color-accent);
      opacity: 0.8;
      cursor: not-allowed;
    }

    .status-message {
      text-align: center;
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: var(--radius-md);
      display: none;
    }

    .status-message.success {
      background: rgba(46, 204, 113, 0.1);
      color: #27ae60;
      border-left: 3px solid #27ae60;
    }

    .status-message.error {
      background: rgba(231, 76, 60, 0.1);
      color: #c0392b;
      border-left: 3px solid #c0392b;
    }

    .download-link {
      text-align: center;
      margin-top: 1.5rem;
      display: none;
    }

    .download-link a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--color-accent);
      color: var(--color-base);
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .download-link a:hover {
      background: #2c3e50;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .canvas-container {
      margin: 1.5rem 0;
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: rgba(62, 80, 182, 0.02);
    }

    #myCanvas {
      display: block;
      max-width: 100%;
      margin: 0 auto;
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
    }

    .slider-container input[type="range"] {
      flex: 1;
    }

    .quality-value {
      min-width: 3rem;
      text-align: center;
      font-weight: 500;
      color: var(--color-accent);
    }

    .sub-tab-container {
      display: flex;
      margin-bottom: 1.5rem;
      background: var(--color-background-light);
      border-radius: var(--radius-md);
      padding: 0.25rem;
    }

    .sub-tab {
      flex: 1;
      text-align: center;
      padding: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-light);
      border-radius: calc(var(--radius-md) - 2px);
      transition: all 0.3s ease;
    }

    .sub-tab:hover {
      color: var(--color-contrast);
    }

    .sub-tab.active {
      background: var(--color-base);
      color: var(--color-accent);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* 响应式调整 */
    @media (max-width: 768px) {
      .tool-container {
        padding: 1rem;
      }
      
      .tab {
        font-size: 0.875rem;
        padding: 0.75rem 0;
      }
      
      .sub-tab {
        font-size: 0.75rem;
        padding: 0.5rem;
      }
      
      .tool-btn {
        padding: 0.875rem;
        font-size: 0.875rem;
      }
    }

    @media (max-width: 480px) {
      .tool-container {
        padding: 0.75rem;
      }
      
      .tab-container {
        flex-direction: column;
        border-bottom: none;
        margin-bottom: 1rem;
      }
      
      .tab {
        border-bottom: 2px solid var(--color-border);
        margin-bottom: 0.5rem;
      }
      
      .tab.active::after {
        display: none;
      }
    }
</style>
