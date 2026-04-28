/**
 * Owl Carousel v2.3.4 - Vanilla JavaScript Edition (Moderna)
 * Suporte a: loop, responsive, drag, nav, dots, autoplay, lazyload, center
 */

class OwlCarousel {
    constructor(selector, userOptions = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.container) throw new Error('OwlCarousel: Elemento não encontrado');

        this.options = { ...OwlCarousel.defaults, ...userOptions };
        this.stage = null;
        this.items = [];
        this.clones = [];
        this.currentIndex = 0;
        this.visibleItems = this.options.items;
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.autoplayTimer = null;
        this.resizeTimer = null;

        this.init();
    }

    static get defaults() {
        return {
            items: 3,
            loop: true,
            margin: 0,
            stagePadding: 0,
            center: false,
            nav: true,
            navText: ['‹', '›'],
            dots: true,
            autoplay: false,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            smartSpeed: 300,
            lazyLoad: false,
            responsive: {
                0: { items: 1 },
                576: { items: 2 },
                992: { items: 3 }
            },
            startPosition: 0
        };
    }

    init() {
        this.container.classList.add('owl-carousel', 'owl-loaded');
        this.createStage();
        this.collectItems();
        this.applyResponsive();
        this.cloneForLoop();
        this.renderStage();
        this.setupEvents();
        this.goTo(this.options.startPosition, false);

        if (this.options.autoplay) this.startAutoplay();
    }

    createStage() {
        const outer = document.createElement('div');
        outer.className = 'owl-stage-outer';
        this.stage = document.createElement('div');
        this.stage.className = 'owl-stage';
        outer.appendChild(this.stage);
        this.container.appendChild(outer);
    }

    collectItems() {
        let children = Array.from(this.container.children).filter(el => 
            !el.classList.contains('owl-stage-outer')
        );

        this.items = children.map((el, i) => {
            el.classList.add('owl-item');
            if (this.options.lazyLoad) this.applyLazyLoad(el);
            return el;
        });
    }

    applyLazyLoad(item) {
        const imgs = item.querySelectorAll('img[data-src], img.owl-lazy');
        imgs.forEach(img => {
            img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        });
    }

    applyResponsive() {
        const w = window.innerWidth;
        let items = this.options.items;

        Object.keys(this.options.responsive)
            .sort((a, b) => a - b)
            .forEach(bp => {
                if (w >= Number(bp)) items = this.options.responsive[bp].items || items;
            });

        this.visibleItems = items;
    }

    cloneForLoop() {
        this.clonesCount = 0;
        if (!this.options.loop || this.items.length <= 1) return;

        const cloneCount = Math.max(this.visibleItems, 3);
        this.clonesCount = cloneCount;

        // Clones from the end to put at the beginning
        this.clonesBefore = [];
        for (let i = this.items.length - cloneCount; i < this.items.length; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('cloned');
            this.clonesBefore.push(clone);
        }

        // Clones from the beginning to put at the end
        this.clonesAfter = [];
        for (let i = 0; i < cloneCount; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('cloned');
            this.clonesAfter.push(clone);
        }
    }

    renderStage() {
        this.stage.innerHTML = '';
        if (this.options.loop) {
            this.clonesBefore.forEach(clone => this.stage.appendChild(clone));
        }
        this.items.forEach(item => this.stage.appendChild(item));
        if (this.options.loop) {
            this.clonesAfter.forEach(clone => this.stage.appendChild(clone));
        }
        this.updateStageStyles();
    }


    setupEvents() {
        // Resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.handleResize(), 200);
        });

        // Drag
        this.stage.addEventListener('mousedown', e => this.dragStart(e));
        this.stage.addEventListener('touchstart', e => this.dragStart(e), { passive: true });

        // Hover pause autoplay
        if (this.options.autoplayHoverPause) {
            this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.container.addEventListener('mouseleave', () => this.startAutoplay());
        }

        if (this.options.nav) this.createNavigation();
        if (this.options.dots) this.createDots();
    }

    handleResize() {
        this.applyResponsive();
        this.updateStageStyles();
        this.goTo(this.currentIndex, false);
    }

    updateStageStyles() {
        const itemWidth = (this.container.offsetWidth - this.options.margin * (this.visibleItems - 1)) / this.visibleItems;
        Array.from(this.stage.children).forEach(child => {
            child.style.width = `${itemWidth}px`;
            child.style.marginRight = `${this.options.margin}px`;
        });
        this.stage.style.width = `${this.stage.children.length * (itemWidth + this.options.margin)}px`;
    }

    goTo(index, animate = true) {
        this.currentIndex = this.normalize(index);
        const itemWidth = this.stage.children[0].offsetWidth + this.options.margin;
        const offset = this.options.loop ? this.clonesCount : 0;
        let translate = - (offset + this.currentIndex) * itemWidth;

        if (this.options.center) {
            translate += (this.container.offsetWidth - itemWidth) / 2;
        }

        this.stage.style.transition = animate ? `transform ${this.options.smartSpeed}ms ease-out` : 'none';
        this.stage.style.transform = `translate3d(${translate}px, 0, 0)`;

        this.updateActiveClasses();
        this.updateDots();
    }

    normalize(index) {
        const max = this.items.length;
        return ((index % max) + max) % max;
    }

    next() { this.goTo(this.currentIndex + 1); }
    prev() { this.goTo(this.currentIndex - 1); }

    updateActiveClasses() {
        const children = Array.from(this.stage.children);
        const offset = this.options.loop ? this.clonesCount : 0;
        children.forEach((child, i) => {
            const realIndex = i - offset;
            const isActive = realIndex === this.currentIndex;
            child.classList.toggle('active', isActive);
            if (this.options.center) child.classList.toggle('center', isActive);
        });
    }


    // ==================== Drag ====================
    dragStart(e) {
        this.isDragging = true;
        this.startX = this.getX(e);
        this.prevTranslate = this.currentTranslate;

        document.addEventListener('mousemove', this.dragMove.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));
        document.addEventListener('touchmove', this.dragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.dragEnd.bind(this));
    }

    dragMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const currentX = this.getX(e);
        this.currentTranslate = this.prevTranslate + (currentX - this.startX);

        this.stage.style.transition = 'none';
        this.stage.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
    }

    dragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.dragMove.bind(this));
        document.removeEventListener('mouseup', this.dragEnd.bind(this));
        document.removeEventListener('touchmove', this.dragMove.bind(this));
        document.removeEventListener('touchend', this.dragEnd.bind(this));

        const moved = this.currentTranslate - this.prevTranslate;
        if (Math.abs(moved) > 80) {
            if (moved > 0) this.prev();
            else this.next();
        } else {
            this.goTo(this.currentIndex);
        }
    }

    getX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    // ==================== Navigation & Dots ====================
    createNavigation() {
        const nav = document.createElement('div');
        nav.className = 'owl-nav';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'owl-prev';
        prevBtn.innerHTML = this.options.navText[0];
        prevBtn.addEventListener('click', () => this.prev());

        const nextBtn = document.createElement('button');
        nextBtn.className = 'owl-next';
        nextBtn.innerHTML = this.options.navText[1];
        nextBtn.addEventListener('click', () => this.next());

        nav.append(prevBtn, nextBtn);
        this.container.appendChild(nav);
    }

    createDots() {
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'owl-dots';

        const dotCount = Math.ceil(this.items.length / this.visibleItems);
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('button');
            dot.className = `owl-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goTo(i * this.visibleItems));
            this.dotsContainer.appendChild(dot);
        }
        this.container.appendChild(this.dotsContainer);
    }

    updateDots() {
        if (!this.dotsContainer) return;
        const dots = this.dotsContainer.querySelectorAll('.owl-dot');
        const activeDot = Math.floor(this.currentIndex / this.visibleItems);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeDot));
    }

    // ==================== Autoplay ====================
    startAutoplay() {
        if (this.autoplayTimer || !this.options.autoplay) return;
        this.autoplayTimer = setInterval(() => this.next(), this.options.autoplayTimeout);
    }

    pauseAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

// ==================== Public API ====================
    to(index) { this.goTo(index); }
    destroy() {
        this.pauseAutoplay();
        this.container.innerHTML = '';
        this.container.classList.remove('owl-carousel', 'owl-loaded');
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwlCarousel;
}