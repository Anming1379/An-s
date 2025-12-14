<!-- Note.vue -->
<script setup>
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/github.min.css'

// 注册语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)

// 初始化 marked 配置
marked.setOptions({ 
  gfm: true, 
  breaks: false, 
  smartLists: true, 
  headerIds: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (e) {}
    }
    return code
  }
})

// DOM 引用
const contentEl = ref(null)
const tocEl = ref(null)
const searchEl = ref(null)
const sidebar = ref(null)
const fileTreeEl = ref(null)

// 响应式状态
const files = ref(new Map())
const selectedFileEl = ref(null)
const currentObserver = ref(null)
const searchTimeout = ref(null)
const tocCollapsed = ref(localStorage.getItem('mdviewer-toc-collapsed') === 'true')

// URL 参数
const route = useRoute()
const router = useRouter()

// 显示加载状态
function showLoading() {
  fileTreeEl.value.innerHTML = '<div class="loading-indicator"></div> 正在加载笔记...'
}

// 加载 Markdown 文件
async function loadMarkdownFiles() {
  showLoading()
  
  try {
    // 使用正确的路径模式
    const modules = import.meta.glob('../docs/**/*.md', { 
      as: 'raw',
      eager: false 
    })
    
    console.log('Vite 找到的模块路径:', Object.keys(modules)) // 调试用
    
    if (Object.keys(modules).length === 0) {
      fileTreeEl.value.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <p>未找到任何 .md 文件</p>
          <p style="font-size: 12px; margin-top: 10px;">请确保 src/docs 文件夹存在并包含 .md 文件</p>
        </div>
      `
      return
    }
    
    const filePromises = Object.entries(modules).map(async ([path, loader]) => {
      // 关键修复：正确处理路径
      const relativePath = path
    .replace(/^.*\/docs\//, '')  // 删除任何前缀，只要碰到 /docs/ 就截断
    .replace(/\.md$/, '')            // 移除 .md 后缀
      
      console.log('原始路径:', path, '→ 处理后:', relativePath) // 调试用
      
      const content = await loader()
      return { path: relativePath, name: relativePath, text: content }
    })
    
    const results = await Promise.all(filePromises)
    
    files.value.clear()
    results.forEach(file => {
      console.log('添加文件:', file.path) // 调试用
      files.value.set(file.path, file)
    })
    
    updateFileStats()
    buildTreeAndRender()
    
    // 加载初始文件
    const names = Array.from(files.value.keys()).sort()
    const fileParam = route.query.file
    const hashParam = window.location.hash.slice(1)
    
    let firstFile = names[0]
    if (fileParam && files.value.has(fileParam)) {
      firstFile = fileParam
    }

    nextTick(() => {
      const nodeEl = document.querySelector(`.file[data-path="${CSS.escape(firstFile)}"]`)
      if (nodeEl) {
        nodeEl.click()
        if (hashParam && !fileParam) {
          setTimeout(() => {
            const target = document.getElementById(hashParam)
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }
    })
  } catch (error) {
    console.error('加载失败:', error)
    fileTreeEl.value.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>加载失败: ${error.message}</p>
      </div>
    `
  }
}

// 更新文件统计
function updateFileStats() {
  const fileCount = document.getElementById('fileCount')
  if (fileCount) {
    fileCount.textContent = files.value.size
  }
}

// 构建文件树模型
function buildTreeModel() {
  const root = {}
  for (const [p, meta] of files.value) {
    const parts = p.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!node.children) node.children = {}
      if (!node.children[part]) node.children[part] = { 
        name: part, 
        path: parts.slice(0, i + 1).join('/'), 
        children: null 
      }
      node = node.children[part]
    }
    node.type = 'file'
    node.text = meta.text
  }
  
  function convert(mapNode) {
    if (!mapNode || !mapNode.children) return []
    return Object.values(mapNode.children).map(n => {
      if (n.children && Object.keys(n.children).length > 0) {
        return { 
          name: n.name, 
          path: n.path, 
          type: 'dir', 
          children: convert(n),
          collapsed: localStorage.getItem(`folder-${n.path}`) === 'true'
        }
      } else {
        return { 
          name: n.name, 
          path: n.path, 
          type: n.type === 'file' ? 'file' : 'dir', 
          text: n.text || '' 
        }
      }
    }).sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      return a.type === 'dir' ? -1 : 1
    })
  }
  
  return convert({ children: root.children || {} })
}

// 渲染文件树
function renderTree(tree, container = fileTreeEl.value) {
  if (!container) return
  container.innerHTML = ''
  if (!tree || tree.length === 0) {
    container.textContent = '未找到文件'
    return
  }
  
  tree.forEach(node => {
    const el = document.createElement('div')
    if (node.type === 'dir') {
      const folder = document.createElement('div')
      folder.className = 'folder'
      // 添加展开/收起图标和文本
      const isCollapsed = node.collapsed !== false
      folder.innerHTML = `<div class="title">${isCollapsed ? '▸' : '▾'} ${node.name}</div>`
      
      // 根据存储的状态添加 expanded 类
      if (!isCollapsed) {
        folder.classList.add('expanded')
      }
      
      folder.addEventListener('click', (ev) => {
        ev.stopPropagation()
        const ch = el.querySelector('.children')
        if (ch) {
          const isCollapsed = ch.style.display === 'none'
          ch.style.display = isCollapsed ? 'block' : 'none'
          ch.classList.toggle('collapsed', !isCollapsed)
          
          // 切换图标
          const title = folder.querySelector('.title')
          title.innerHTML = `${isCollapsed ? '▾' : '▸'} ${node.name}`
          
          // 切换 expanded 类以实现颜色变化
          if (isCollapsed) {
            folder.classList.add('expanded')
          } else {
            folder.classList.remove('expanded')
          }
          
          localStorage.setItem(`folder-${node.path}`, !isCollapsed)
        }
      })
      el.appendChild(folder)
      const children = document.createElement('div')
      children.className = 'children'
      if (node.collapsed) {
        children.style.display = 'none'
        children.classList.add('collapsed')
      }
      renderTree(node.children || [], children)
      el.appendChild(children)
    } else {
      const file = document.createElement('div')
      file.className = 'file'
      file.innerHTML = `<span class="file-icon"></span>${node.name}`
      file.dataset.path = node.path
      file.tabIndex = 0
      file.setAttribute('role', 'treeitem')
      file.addEventListener('click', () => selectFile(node.path, file))
      file.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          selectFile(node.path, file)
        }
      })
      el.appendChild(file)
    }
    container.appendChild(el)
  })
}

// 选择文件
function selectFile(relPath, el) {
  if (selectedFileEl.value) selectedFileEl.value.classList.remove('selected')
  selectedFileEl.value = el
  el.classList.add('selected')

  const entry = files.value.get(relPath)
  if (!entry) {
    contentEl.value.innerHTML = `
      <h1>文件不存在</h1>
      <div class="empty-state">
        <div class="empty-state-icon">×</div>
        <p>无法找到文件: ${relPath}</p>
      </div>
    `
    return
  }
  
  router.replace({ query: { file: relPath } })
  renderMarkdown(entry.text)
  closeSidebarFn()
}

// 渲染 Markdown
function renderMarkdown(md) {
  contentEl.value.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div class="loading-indicator" style="width: 24px; height: 24px; margin: 0 auto 20px;"></div>
      <p>正在渲染内容...</p>
    </div>
  `
  
  setTimeout(() => {
    try {
      const html = marked.parse(md)
      const safe = DOMPurify.sanitize(html, { 
        ADD_ATTR: ['id', 'target', 'rel'],
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      })
      contentEl.value.innerHTML = safe

      const headings = Array.from(contentEl.value.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      headings.forEach(h => {
        const text = (h.textContent || '').trim()
        const base = text.slice(0, 40)
        const encoded = encodeURIComponent(base).replace(/%/g, '-').toLowerCase()
        const slug = encoded || ('section-' + h.tagName.toLowerCase())
        let id = slug
        let i = 1
        while (contentEl.value.querySelector('#' + CSS.escape(id))) {
          id = `${slug}-${i}`
          i++
        }
        h.id = id
      })

      let tocList = headings.filter(h => ['H2', 'H3', 'H4'].includes(h.tagName))
        .map(h => ({ text: h.textContent.trim(), level: parseInt(h.tagName.substring(1), 10), id: h.id }))
      if (tocList.length === 0) {
        tocList = headings.filter(h => h.tagName === 'H1').map(h => ({ text: h.textContent.trim(), level: 1, id: h.id }))
      }
      
      if (tocEl.value) {
        tocEl.value.innerHTML = ''
        tocEl.value.classList.remove('empty-toc')
        
        if (tocList.length === 0) {
          tocEl.value.classList.add('empty-toc')
        } else {
          tocList.forEach(item => {
            const a = document.createElement('a')
            a.href = '#' + item.id
            a.textContent = item.text
            a.className = 'level-' + item.level
            a.addEventListener('click', (e) => {
              e.preventDefault()
              const target = document.getElementById(item.id)
              if (!target) return
              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
              history.replaceState(null, '', `#${item.id}`)
              closeSidebarFn()
            })
            tocEl.value.appendChild(a)
          })
        }
      }

      const blocks = contentEl.value.querySelectorAll('pre code')
      if (blocks.length) {
        blocks.forEach(block => {
          hljs.highlightElement(block)
          const pre = block.parentElement
          if (pre && !pre.querySelector('.copy-btn')) {
            const copyBtn = document.createElement('button')
            copyBtn.className = 'copy-btn'
            copyBtn.innerHTML = '复制'
            copyBtn.style.cssText = `
              position: absolute;
              top: 8px;
              right: 8px;
              padding: 4px 8px;
              background: rgba(0,0,0,0.1);
              border: none;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              color: #666;
            `
            copyBtn.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(block.textContent)
                copyBtn.textContent = '已复制'
                setTimeout(() => copyBtn.textContent = '复制', 2000)
              } catch (err) {
                console.error('复制失败:', err)
              }
            })
            pre.style.position = 'relative'
            pre.appendChild(copyBtn)
          }
        })
      }

      setupIntersectionObserver()
      renderPostProcessLinks()
    } catch (error) {
      console.error('渲染Markdown时出错:', error)
      contentEl.value.innerHTML = `
        <h1>渲染错误</h1>
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p>无法渲染Markdown内容</p>
          <pre style="text-align: left; background: #f8f8f8; padding: 10px; border-radius: 5px; margin-top: 10px;">${error.message}</pre>
        </div>
      `
    }
  }, 50)
}

// 设置 IntersectionObserver
function setupIntersectionObserver() {
  if (currentObserver.value) {
    try {
      currentObserver.value.disconnect()
    } catch (e) {}
    currentObserver.value = null
  }
  
  const observeTags = ['H2', 'H3', 'H4']
  const observeHeadings = Array.from(contentEl.value.querySelectorAll(observeTags.join(', ')))
  const tocMap = new Map()
  
  if (tocEl.value) {
    tocEl.value.querySelectorAll('a').forEach(a => tocMap.set(a.getAttribute('href').slice(1), a))
  }
  
  if (observeHeadings.length > 0) {
    currentObserver.value = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
      const current = (visible[0] && visible[0].target.id) || null
      if (!current) return
      if (tocEl.value) tocEl.value.querySelectorAll('a.active').forEach(a => a.classList.remove('active'))
      const link = tocMap.get(current)
      if (link) link.classList.add('active')
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0.1 })
    
    observeHeadings.forEach(h => currentObserver.value.observe(h))
  }
}

// 链接卡片处理
function renderPostProcessLinks() {
  const links = Array.from(contentEl.value.querySelectorAll('a'))
  links.forEach(a => {
    a.classList.add('md-link-card')
    const href = a.getAttribute('href') || ''
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

// 搜索功能
function handleSearch(event) {
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    const q = event.target.value.trim().toLowerCase()
    if (!q) {
      buildTreeAndRender()
      return
    }
    const matches = []
    for (const [p, meta] of files.value) {
      if (p.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q) || meta.text.toLowerCase().includes(q)) matches.push(p)
    }
    const tempFiles = new Map()
    for (const m of matches) tempFiles.set(m, files.value.get(m))
    const old = new Map(files.value)
    files.value.clear()
    for (const [k, v] of tempFiles) files.value.set(k, v)
    buildTreeAndRender()
    files.value.clear()
    for (const [k, v] of old) files.value.set(k, v)
  }, 300)
}

// 侧边栏开关
function openSidebar() {
  sidebar.value.classList.add('open')
  document.getElementById('tocBackdrop').classList.add('open')
  document.body.style.overflow = 'hidden'
}

function closeSidebarFn() {
  sidebar.value.classList.remove('open')
  document.getElementById('tocBackdrop').classList.remove('open')
  document.body.style.overflow = ''
}

// 目录开关
function toggleToc() {
  tocCollapsed.value = !tocCollapsed.value
  localStorage.setItem('mdviewer-toc-collapsed', String(tocCollapsed.value))
}

// 构建并渲染树
function buildTreeAndRender() {
  const tree = buildTreeModel()
  renderTree(tree)
}

// 监听 popstate 事件
function handlePopstate() {
  const fileParam = new URLSearchParams(window.location.search).get('file')
  if (fileParam && files.value.has(fileParam)) {
    const nodeEl = document.querySelector(`.file[data-path="${CSS.escape(fileParam)}"]`)
    if (nodeEl) nodeEl.click()
  }
}

// 生命周期钩子
onMounted(() => {
  loadMarkdownFiles()
  window.addEventListener('popstate', handlePopstate)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopstate)
  if (currentObserver.value) {
    currentObserver.value.disconnect()
  }
})
</script>

<template>
  <aside class="sidebar" id="sidebar" ref="sidebar">
    <div class="sidebar-header">
      <div class="logo" style="font-weight: 500; font-size: var(--font-size-sm);">桉的笔记本</div>
      <button id="closeSidebar" class="close-btn" title="关闭侧边栏" @click="closeSidebarFn">×</button>
    </div>

    <input id="search" class="search" placeholder="搜索笔记..." @input="handleSearch" ref="searchEl" />
    
    <div class="file-tree" id="fileTree" ref="fileTreeEl">
      <div class="loading-indicator"></div> 正在加载笔记...
    </div>
    
    <div class="toc-section">
      <div class="toc-header">
        <div class="toc-title">目录</div>
        <button id="tocToggle" class="toc-toggle" @click="toggleToc">
          {{ tocCollapsed ? '展开' : '收起' }}
        </button>
      </div>
      <nav id="toc" class="toc" :class="{ collapsed: tocCollapsed }" ref="tocEl">当前未加载</nav>
    </div>
    
    <div class="file-stats" id="fileStats">
      共加载 <span id="fileCount">{{ files.size }}</span> 篇笔记
    </div>
  </aside>

  <main class="main">
    <div class="container">
      <div class="md-layout">
        <div class="md-main">
          <section class="md-content" id="content" ref="contentEl">
            <h1>Markdown 阅读器</h1>
            <p>从左侧文件列表中选择一个 Markdown 文件开始阅读。</p>
            <p>此阅读器支持代码高亮、目录导航、全文搜索等功能。</p>
            <div class="empty-state">
              <div class="empty-state-icon">📚</div>
              <p>选择一个笔记开始阅读吧</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>

  <button id="tocFab" class="toc-fab" aria-label="打开侧边栏" @click="openSidebar">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>
  <div id="tocBackdrop" class="toc-backdrop" aria-hidden="true" @click="closeSidebarFn"></div>
</template>

<style scoped>
/* 完全保留原 CSS，无需修改 */
.file-tree {
  font-size: var(--font-size-sm);
  line-height: 3;
  margin-bottom: var(--spacing-lg);
}

.folder, .file {
  cursor: pointer;
  user-select: none;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), color var(--transition-fast);
  margin-bottom: 4px;
}

.folder:hover, .file:hover {
  background: rgba(62, 80, 182, 0.08);
}

/* 文件夹展开时的蓝色高亮效果 */
.folder.expanded {
  background: rgba(62, 80, 182, 0.12);
  color: var(--color-accent);
}

.folder.expanded .title {
  color: var(--color-accent);
  font-weight: 500;
}

.folder .title {
  font-weight: 500;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  gap: 8px;
}

.file {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  width: 6px;
  height: 6px;
  background: var(--color-text-light);
  border-radius: 50%;
  opacity: 0.6;
}

.file.selected {
  background: rgba(62, 80, 182, 0.08);
  font-weight: 500;
}

.file.selected .file-icon {
  background: var(--color-accent);
  opacity: 1;
}

/* 增强的缩进效果 */
.children {
  padding-left: 24px;
  margin-top: 4px;
  border-left: 2px solid var(--color-border);
  max-height: 500px;
  overflow-y: hidden;
  transition: max-height var(--transition-normal), border-color var(--transition-fast);
}

/* 展开时边框变蓝 */
.children:not(.collapsed) {
  border-left-color: var(--color-accent);
}

.children.collapsed {
  max-height: 0;
}

.header {
  z-index: 1001;
  background: var(--color-base); 
  border-bottom: 1px solid var(--color-border);
}

.main {
  padding-top: 0; 
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.mobile-toggle {
  display: none;
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-base);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.search {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-base);
  color: var(--color-text);
  outline: none;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.meta {
  min-width: 160px;
  color: var(--color-text-light);
  font-size: var(--font-size-xs);
}

.loading-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(62, 80, 182, 0.2);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.md-content {
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: none;
  background: transparent;
  box-shadow: none;
}

.md-content h1 {
  text-align: center;
  font-size: var(--font-size-xl);
  margin: 0.6em 0 0.4em 0;
  color: var(--color-contrast);
  line-height: 6;
}

.md-content h2 {
  text-align: left;
  font-size: var(--font-size-lg);
  margin: 0.9em 0 0.35em 0;
  color: var(--color-contrast);
  line-height: 5;
}

.md-content h3 {
  text-align: left;
  font-size: 1.1rem;
  margin: 0.8em 0 0.35em 0;
  color: var(--color-contrast);
  line-height: 4;
}

.md-content h4 {
  text-align: left;
  font-size: 1rem;
  margin: 0.7em 0 0.3em 0;
  color: var(--color-contrast);
  line-height: 4;
}

.md-content h5 {
  text-align: left;
  font-size: 0.95rem;
  margin: 0.6em 0 0.25em 0;
  color: var(--color-contrast);
  line-height: 4;
}

.md-content h6 {
  text-align: left;
  font-size: 0.9rem;
  margin: 0.5em 0 0.2em 0;
  color: var(--color-contrast);
  line-height: 4;
}

.md-content p, .md-content li {
  text-align: left;
  color: var(--color-text);
  line-height: 2;
}

.md-content a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.md-content a:hover {
  text-decoration: underline;
}

.md-content img {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.md-content blockquote {
  margin: 1em 0;
  padding: 12px 16px;
  border-left: 3px solid var(--color-accent);
  background: rgba(62, 80, 182, 0.08);
  color: var(--color-text);
  border-radius: var(--radius-sm);
}

.md-content hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 22px 0;
}

.md-content ul, .md-content ol {
  padding-left: 1.3em;
}

.md-content li {
  margin: 0.35em 0;
}

.md-content table {
  border-collapse: collapse;
  width: 100%;
}

.md-content th, .md-content td {
  border: 1px solid var(--color-border);
  padding: 10px;
  text-align: left;
}

.md-content thead th {
  background: rgba(62, 80, 182, 0.08);
  font-weight: 500;
}

.md-content pre {
  background: #f6f8fa;
  color: var(--color-text);
  padding: 14px;
  border-radius: var(--radius-sm);
  overflow: auto;
  font-size: 0.9rem;
}

.md-content code {
  background: rgba(62, 80, 182, 0.08);
  color: var(--color-text);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.md-content pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

.md-content a.md-link-card {
  display: inline-block;
  padding: 10px 14px;
  margin: 6px 6px 6px 0;
  background: rgba(62, 80, 182, 0.08);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(62, 80, 182, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-weight: 500;
  width: 100%;
}

.md-content a.md-link-card:hover, .md-content a.md-link-card:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
}

.toc-section {
  margin-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toc-title {
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--color-contrast);
}

.toc-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-base);
  color: var(--color-text-light);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.toc-toggle:hover {
  border-color: var(--color-accent);
}

.toc {
  overflow: auto;
  max-height: 300px;
  transition: max-height var(--transition-normal);
}

.toc.collapsed {
  max-height: 0;
  overflow: hidden;
}

.toc a {
  display: block;
  text-decoration: none;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  position: relative;
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  margin-bottom: 2px;
}

.toc .level-1 {
  padding-left: 8px;
  color: var(--color-contrast);
  font-weight: 500;
}

.toc .level-2 {
  padding-left: 16px;
  color: var(--color-text);
}

.toc .level-3 {
  padding-left: 24px;
  color: var(--color-text-light);
}

.toc .level-4 {
  padding-left: 32px;
  color: var(--color-text-light);
}

.toc a:hover {
  background: rgba(62, 80, 182, 0.08);
  color: var(--color-text);
}

.toc a.active {
  background: rgba(62, 80, 182, 0.08);
  color: var(--color-accent);
  font-weight: 500;
}

.sidebar {
  position: fixed;
  left: -550px;
  top: 0;
  bottom: 0;
  z-index: 1002;
  width: 280px;
  background: var(--color-base);
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-md);
  box-sizing: border-box;
  overflow-y: auto;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  max-height: 100vh;
}

.sidebar.open {
  left: 0;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.25);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.close-btn {
  border: 0;
  background: transparent;
  color: var(--color-text-light);
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  line-height: 2;
}

.close-btn:hover {
  color: var(--color-text);
}

.toc-fab {
  display: none;
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1003;
  border: 1px solid var(--color-border);
  background: var(--color-base);
  color: var(--color-text);
  border-radius: 50%;
  padding: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.toc-fab:hover {
  background: var(--color-accent);
  color: white;
  transform: scale(1.1);
}

.toc-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1001;
  backdrop-filter: blur(2px);
}

.toc-backdrop.open {
  display: block;
}

.md-layout {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
  width: 100%;
}

.md-main {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.main .container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-light);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

@media (max-width: 980px) {
  .toc-fab {
    display: flex;
  }
}

@media (max-width: 767px) {
  .mobile-toggle {
    display: inline-block;
  }
  
  .search {
    min-width: 100%;
    order: 3;
  }
  
  .toolbar {
    gap: 8px;
  }
  
  .md-content {
    max-width: 100%;
    padding: 0 var(--spacing-sm);
  }
  
  .sidebar {
    width: 85%;
    max-width: 300px;
  }
}

@media (min-width: 981px) {
  .sidebar {
    width: 50%;
    max-width: 500px;
  }
  
  .md-main {
    margin-left: 0;
    width: 100%;
  }
  
  .md-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .toc-fab {
    display: flex;
  }
}

.toc:empty::before {
  content: "当前未加载";
  color: var(--color-text-light);
  font-style: italic;
  font-size: var(--font-size-sm);
  display: block;
  padding: 12px;
}

.toc.empty-toc::before {
  content: "本文无标题";
  color: var(--color-text-light);
  font-style: italic;
  font-size: var(--font-size-sm);
  display: block;
  padding: 12px;
}

.sidebar-intro {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  margin-top: 6px;
  margin-bottom: var(--spacing-sm);
}

.file-stats {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-sm);
}
</style>
