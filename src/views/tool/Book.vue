<!-- src/views/tool/Book.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const ANSWERS = [
  "再等等，会更清晰的。", "现在下结论还太早。", "不，但这并非定局。",
  "你已经比想象中更接近了。", "转个方向，会有不同的景色。", "看似无路，其实暗藏转机。",
  "顺其自然，答案会自己冒出来。", "不是现在，但以后可能。", "有些事，需要你轻轻推一下。",
  "别急，风还没吹到你这边。", "保持好奇，会有新发现。", "别这么问。",
  "你需要一点耐心，也需要一点勇气。", "等一等。", "它在向你靠近，但还差一步。",
  "你已经知道该怎么做了，只是还没承认。", "事情比你担心的简单。", "一切正在悄悄展开。",
  "放松一点，答案会浮上来。", "不必全部理解，也能继续前进。", "环境会帮你做出选择。",
  "时机不对。", "你想的没错，只是时机未到。", "它会在最意外的瞬间解决。",
  "越想越乱，不如静一静。", "你会得到回应，只是不是现在。", "小小的尝试，会打开大门。",
  "真相正在变得更清楚。", "不要忽略那些微小的提示。", "是时候相信直觉了。",
  "结果会比你预期的柔和。", "放下执念，新的可能就进来了。", "它不会按你想象的方式发生。",
  "现在的犹豫也有它的意义。", "再确认一次，你会更踏实。", "因缘还在悄悄排队。",
  "你的下一步比现在更重要。", "你需要一点点冒险。", "它正在向好的方向发展。",
  "你会得到你需要的，而不是你以为的。", "给自己留一个退路，也留一个入口。", "也许吧。",
  "不排除这种可能性。", "结果会出现在你预料之外。", "你会在途中找到线索。",
  "轻轻改变一点点，就会完全不一样。", "你已经准备好了，只是还没意识到。", "概率很大。",
  "你该把注意力放在最简单的那一步。", "这个不一定。"
]

// DOM 引用
const questionInput = ref(null)
const questionForm = ref(null)
const randomAnswerBtn = ref(null)
const answerFullscreen = ref(null)
const answerText = ref(null)
const answerNumber = ref(null)
const backHomeBtn = ref(null)
const closeAnswerTopBtn = ref(null)

let userId = ''

// ==================== 核心逻辑 ====================
function generateUserId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 9)
  return 'user_' + timestamp + '_' + randomStr
}

function getOrCreateUserId() {
  let storedId = localStorage.getItem('answerBookUserId')
  if (!storedId) {
    storedId = generateUserId()
    localStorage.setItem('answerBookUserId', storedId)
  }
  return storedId
}

function simpleHash(str) {
  let hash = 0
  const inputStr = String(str).toLowerCase()
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getAnswerByQuestion(question, userId) {
  const combinedInput = userId + '_' + question.trim().toLowerCase()
  const hash = simpleHash(combinedInput)
  const index = hash % ANSWERS.length
  return { text: ANSWERS[index], index }
}

function getRandomAnswer() {
  const randomIndex = Math.floor(Math.random() * ANSWERS.length)
  return { text: ANSWERS[randomIndex], index: randomIndex }
}

function showFullscreenAnswer(answer, index) {
  answerText.value.textContent = answer
  answerNumber.value.textContent = `答案 #${index + 1}`
  
  answerFullscreen.value.classList.add('active')
  answerFullscreen.value.setAttribute('aria-hidden', 'false')
  
  backHomeBtn.value.style.display = 'none'
  closeAnswerTopBtn.value.style.display = 'block'

  answerText.value.animate(
    [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 1000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
  )

  answerNumber.value.animate(
    [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 800, delay: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
  )

  document.body.style.overflow = 'hidden'
  setTimeout(() => answerFullscreen.value.focus(), 100)
}

function closeFullscreenAnswer() {
  answerText.value.getAnimations().forEach(anim => anim.cancel())
  answerNumber.value.getAnimations().forEach(anim => anim.cancel())
  
  answerFullscreen.value.classList.remove('active')
  answerFullscreen.value.setAttribute('aria-hidden', 'true')
  
  backHomeBtn.value.style.display = 'block'
  closeAnswerTopBtn.value.style.display = 'none'
  
  document.body.style.overflow = ''
  questionInput.value.focus()
}

function handleSubmit(e) {
  e.preventDefault()
  const question = questionInput.value.value.trim()
  if (!question) {
    alert('请输入问题')
    return
  }

  const submitBtn = questionForm.value.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = '思考中...'
  submitBtn.disabled = true

  setTimeout(() => {
    try {
      const { text, index } = getAnswerByQuestion(question, userId)
      showFullscreenAnswer(text, index)
    } catch (error) {
      showFullscreenAnswer("答案之书暂时无法回应，请稍后再试。", 0)
    } finally {
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }
  }, 800)
}

function handleRandom() {
  const { text, index } = getRandomAnswer()
  showFullscreenAnswer(text, index)
}

function handleFullscreenClick(e) {
  if (e.target === answerFullscreen.value) closeFullscreenAnswer()
}

function handleKeydown(e) {
  if (e.key === 'Escape' && answerFullscreen.value.classList.contains('active')) {
    closeFullscreenAnswer()
  }
}

function adjustTextAlignment() {
  if (window.innerWidth >= 768) {
    answerText.value.style.marginLeft = 'auto'
    answerText.value.style.marginRight = 'auto'
    answerText.value.style.maxWidth = '80%'
  } else {
    answerText.value.style.marginLeft = ''
    answerText.value.style.marginRight = ''
    answerText.value.style.maxWidth = ''
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  userId = getOrCreateUserId()
  closeAnswerTopBtn.value.style.display = 'none'
  answerFullscreen.value.setAttribute('aria-hidden', 'true')
  
  questionForm.value.addEventListener('submit', handleSubmit)
  randomAnswerBtn.value.addEventListener('click', handleRandom)
  closeAnswerTopBtn.value.addEventListener('click', closeFullscreenAnswer)
  answerFullscreen.value.addEventListener('click', handleFullscreenClick)
  document.addEventListener('keydown', handleKeydown)
  
  adjustTextAlignment()
  window.addEventListener('resize', adjustTextAlignment)

  if ('ontouchstart' in window) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.style.touchAction = 'manipulation'
    })
  }
})

onUnmounted(() => {
  questionForm.value?.removeEventListener('submit', handleSubmit)
  randomAnswerBtn.value?.removeEventListener('click', handleRandom)
  closeAnswerTopBtn.value?.removeEventListener('click', closeFullscreenAnswer)
  answerFullscreen.value?.removeEventListener('click', handleFullscreenClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', adjustTextAlignment)
})
</script>

<template>
  <div>
    <div class="top-controls">
      <a href="/alambda" class="back-home" ref="backHomeBtn">← 返回首页</a>
      <button class="close-answer-top" ref="closeAnswerTopBtn" aria-label="关闭答案">× 关闭</button>
    </div>

    <main class="main">
      <div class="container">
        <div class="question-container">
          <h1 class="question-title">答案之书</h1>
          <p class="description">问任何问题，或是随机翻开一页吧</p>
          
          <form class="question-form" ref="questionForm">
            <textarea 
              class="question-input" 
              ref="questionInput"
              placeholder="输入你的问题...."
              required
              aria-label="输入您的问题"
            ></textarea>
            
            <div class="action-buttons">
              <button type="submit" class="btn btn-primary">获取答案</button>
              <button type="button" class="btn btn-random" ref="randomAnswerBtn">随机翻开</button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <div class="answer-fullscreen" ref="answerFullscreen" role="dialog" aria-modal="true" tabindex="-1">
      <div class="answer-content">
        <div class="answer-text" ref="answerText"></div>
        <div class="answer-number" ref="answerNumber"></div>
      </div>
    </div>
  </div>
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

.container {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.question-container {
  text-align: center;
  animation: fadeInUp 1.5s ease-out;
}

.question-title {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xxl);
  line-height: 1.2;
}

.description {
  font-size: var(--font-size-md);
  color: var(--color-text-light);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}

.question-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-main);
  font-size: var(--font-size-md);
  line-height: 1.6;
  background: var(--color-background-light);
  resize: none;
  min-height: 120px;
  transition: all var(--transition-normal);
  margin-bottom: var(--spacing-md);
}

.question-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(62, 80, 182, 0.1);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-random {
  background: transparent;
  color: var(--color-contrast);
  border: 2px solid var(--color-contrast);
  box-shadow: none;
}

.btn-random:hover {
  background: var(--color-accent);
  color: var(--color-base);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.answer-fullscreen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-base);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl);
  opacity: 0;
  visibility: hidden;
  z-index: 100;
  transition: all var(--transition-normal);
}

.answer-fullscreen.active {
  opacity: 1;
  visibility: visible;
}

.answer-fullscreen.active .close-answer-top {
  display: block; /* 全屏时显示关闭按钮 */
}

.answer-content {
  max-width: 800px;
  width: 90%;
  text-align: center;
  padding: var(--spacing-xl);
}

.answer-text {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  line-height: 1.5;
  font-weight: 300;
  color: var(--color-contrast);
  margin-bottom: var(--spacing-lg);
}

.answer-number {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  background: var(--color-background-light);
  display: inline-block;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 767px) {
  .main { padding: calc(var(--spacing-lg) + 40px) 0 var(--spacing-lg); }
  .question-title { font-size: var(--font-size-xl); }
  .action-buttons { flex-direction: column; }
  .action-buttons .btn { width: 100%; min-height: 44px; }
}
</style>
