// ========== 导航栏滚动阴影 ==========
const navbar = document.getElementById('navbar');

function updateNavbarShadow() {
  if (window.scrollY > 8) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

updateNavbarShadow();
window.addEventListener('scroll', updateNavbarShadow, { passive: true });

// ========== 头像加载失败处理 ==========
const avatarImg = document.querySelector('.avatar');
if (avatarImg) {
  avatarImg.addEventListener('error', function() {
    this.style.display = 'none';
    const fallback = this.parentElement.querySelector('.avatar-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
    }
  });
}

// ========== 导航链接点击反馈 ==========
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    navLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    const href = this.getAttribute('href');
    if (href === '#' || href === '') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// ========== 作品卡片入场动画（滚动触发） ==========
const cards = document.querySelectorAll('.work-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

cards.forEach(card => {
  // 初始状态已在CSS动画中设置，这里仅做滚动触发增强
  observer.observe(card);
});

// ========== 键盘导航 ==========
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ========== 页面可见性变化时检查滚动状态 ==========
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateNavbarShadow();
  }
});

console.log('✨ 欢迎来访，保持简单。');

