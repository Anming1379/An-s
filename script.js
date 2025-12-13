/**
 * An's web page - 主要JavaScript功能
 */
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupSmoothScrolling();
    setupImageLoading();
    setupResponsiveBehavior();
});

/** 移动端菜单 */
function setupMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const icon = navToggle?.querySelector('.material-icons'); // 找到图标

    if (!navToggle || !navMenu || !icon) return;

    // 切换菜单
    navToggle.addEventListener('click', () => {
        const isExpanded = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(isExpanded));
        icon.textContent = isExpanded ? 'close' : 'menu'; // 切换图标
    });

    // 点击外部关闭
    document.addEventListener('click', (event) => {
        const isMobile = window.innerWidth <= 767;
        if (!isMobile) return;
        if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            icon.textContent = 'menu';
        }
    });

    // 点击菜单项（移动端）自动收起
    navMenu.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 767) {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                icon.textContent = 'menu';
            }
        });
    });
}

/** 平滑滚动并考虑固定头部高度 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
            const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerHeight);

            window.scrollTo({ top, behavior: 'smooth' });
            // 更新哈希（避免 pushState 异常返回行为）
            setTimeout(() => { location.hash = href; }, 200);
        });
    });
}

/** 图片加载优化 */
function setupImageLoading() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');

        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
            img.addEventListener('error', function() {
                console.warn('图片加载失败:', this.src);
                this.style.opacity = '0.5';
            });
        }
    });
}

/** 响应式行为：窗口变化时重置菜单状态 */
function setupResponsiveBehavior() {
    const resetOnDesktop = debounce(() => {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        const icon = navToggle?.querySelector('.material-icons');
        if (!navMenu || !navToggle || !icon) return;

        if (window.innerWidth > 767) {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            icon.textContent = 'menu';
        }
    }, 200);

    window.addEventListener('resize', resetOnDesktop);
    resetOnDesktop();
}

/** 防抖 */
function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}
