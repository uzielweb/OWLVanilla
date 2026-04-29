/**
 * Owl Carousel v2.3.4 - Vanilla JavaScript Edition (Moderna)
 * Suporte a: loop, responsive, drag, nav, dots, autoplay, lazyload, center
 */

class OwlCarouselVanilla {
    constructor(selector, userOptions = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.container) throw new Error('OwlCarouselVanilla: Elemento não encontrado');

        this.options = { ...OwlCarouselVanilla.defaults, ...userOptions };
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
            startPosition: 0,
            // New options
            autoWidth: false,
            autoHeight: false,
            animateIn: false, // CSS class
            animateOut: false, // CSS class
            mouseDrag: true,
            touchDrag: true,
            slideBy: 1,
            rtl: false,
            // Callbacks
            onInitialize: null,
            onInitialized: null,
            onResize: null,
            onResized: null,
            onDrag: null,
            onDragged: null,
            onTranslate: null,
            onTranslated: null,
            onChange: null,
            onChanged: null
        };
    }

    init() {
        this.trigger('onInitialize');
        this.container.classList.add('owl-carousel', 'owl-loaded');
        if (this.options.rtl) this.container.classList.add('owl-rtl');
        
        this.createStage();
        this.collectItems();
        this.applyResponsive();
        this.cloneForLoop();
        this.renderStage();
        this.setupEvents();
        this.goTo(this.options.startPosition, false);

        if (this.options.autoplay) this.startAutoplay();
        this.trigger('onInitialized');
    }

    trigger(event, data) {
        if (this.options[event] && typeof this.options[event] === 'function') {
            this.options[event].call(this, data);
        }
        // Also dispatch a native event
        const evt = new CustomEvent(event, { detail: data });
        this.container.dispatchEvent(evt);
    }

    createStage() {
        const outer = document.createElement('div');
        outer.className = 'owl-stage-outer';
        this.stage = document.createElement('div');
        this.stage.className = 'owl-stage';
        outer.appendChild(this.stage);
        this.container.appendChild(outer);
        this.stageOuter = outer;
    }

    collectItems() {
        let children = Array.from(this.container.children).filter(el => 
            !el.classList.contains('owl-stage-outer') && 
            !el.classList.contains('owl-nav') && 
            !el.classList.contains('owl-dots')
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
        let settings = { ...this.options };
        
        if (this.options.responsive) {
            // Sort breakpoints numerically to ensure correct override order
            const breakpoints = Object.keys(this.options.responsive).sort((a, b) => Number(a) - Number(b));
            
            breakpoints.forEach(bp => {
                if (w >= Number(bp)) {
                    settings = { ...settings, ...this.options.responsive[bp] };
                }
            });
        }

        this.currentSettings = settings;
        this.visibleItems = settings.items;
    }

    cloneForLoop() {
        this.clonesCount = 0;
        if (!this.currentSettings.loop || this.items.length <= 1) return;

        const cloneCount = Math.max(this.visibleItems, 3);
        this.clonesCount = cloneCount;

        this.clonesBefore = [];
        for (let i = this.items.length - cloneCount; i < this.items.length; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('cloned');
            this.clonesBefore.push(clone);
        }

        this.clonesAfter = [];
        for (let i = 0; i < cloneCount; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('cloned');
            this.clonesAfter.push(clone);
        }
    }

    renderStage() {
        this.stage.innerHTML = '';
        if (this.currentSettings.loop) {
            this.clonesBefore.forEach(clone => this.stage.appendChild(clone));
        }
        this.items.forEach(item => this.stage.appendChild(item));
        if (this.currentSettings.loop) {
            this.clonesAfter.forEach(clone => this.stage.appendChild(clone));
        }
        this.updateStageStyles();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.trigger('onResize');
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.handleResize();
                this.trigger('onResized');
            }, 200);
        });

        if (this.options.mouseDrag) {
            this.stage.addEventListener('mousedown', e => this.dragStart(e));
        }
        if (this.options.touchDrag) {
            this.stage.addEventListener('touchstart', e => this.dragStart(e), { passive: true });
        }

        if (this.options.autoplayHoverPause) {
            this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.container.addEventListener('mouseleave', () => this.startAutoplay());
        }

        if (this.options.nav) this.createNavigation();
        if (this.options.dots) this.createDots();
    }

    handleResize() {
        const oldItems = this.visibleItems;
        this.applyResponsive();
        
        if (oldItems !== this.visibleItems) {
            this.cloneForLoop();
            this.renderStage();
        } else {
            this.updateStageStyles();
        }
        
        this.goTo(this.currentIndex, false);
    }

    updateStageStyles() {
        const containerWidth = this.container.offsetWidth;
        const margin = this.currentSettings.margin || 0;
        const items = this.visibleItems;
        
        const itemWidth = (containerWidth - (margin * (items - 1))) / items;
        
        let totalWidth = 0;
        const children = Array.from(this.stage.children);
        
        children.forEach((child, i) => {
            if (this.currentSettings.autoWidth) {
                child.style.width = 'auto';
            } else {
                child.style.width = `${itemWidth}px`;
            }
            
            child.style.marginRight = this.currentSettings.rtl ? '0' : `${margin}px`;
            child.style.marginLeft = this.currentSettings.rtl ? `${margin}px` : '0';
            
            totalWidth += child.offsetWidth + margin;
        });

        this.stage.style.width = `${totalWidth}px`;
        
        if (this.currentSettings.rtl) {
            this.stage.style.marginRight = `-${margin}px`;
            this.stage.style.direction = 'rtl';
        } else {
            this.stage.style.marginLeft = '0';
        }
    }

    goTo(index, animate = true) {
        this.trigger('onTranslate');
        const oldIndex = this.currentIndex;
        this.currentIndex = this.normalize(index);
        
        const children = Array.from(this.stage.children);
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
        const targetItem = children[offset + this.currentIndex];
        const margin = this.currentSettings.margin || 0;
        
        let translate = 0;
        if (this.currentSettings.autoWidth) {
            for (let i = 0; i < offset + this.currentIndex; i++) {
                translate += children[i].offsetWidth + margin;
            }
        } else {
            const itemWidth = children[0].offsetWidth + margin;
            translate = (offset + this.currentIndex) * itemWidth;
        }

        if (this.currentSettings.center) {
            const containerWidth = this.container.offsetWidth;
            const itemWidth = targetItem.offsetWidth;
            translate -= (containerWidth - itemWidth) / 2;
        }

        // RTL adjustment
        const multiplier = this.currentSettings.rtl ? 1 : -1;
        const finalTranslate = translate * multiplier;

        // AnimateIn / AnimateOut
        if (animate && (this.currentSettings.animateIn || this.currentSettings.animateOut)) {
            this.applyAnimation(oldIndex, this.currentIndex);
        } else {
            this.stage.style.transition = animate ? `transform ${this.currentSettings.smartSpeed}ms ease-out` : 'none';
            this.stage.style.transform = `translate3d(${finalTranslate}px, 0, 0)`;
        }

        this.currentTranslate = finalTranslate;

        if (this.currentSettings.autoHeight) {
            this.updateAutoHeight();
        }

        this.updateActiveClasses();
        this.updateDots();
        
        setTimeout(() => {
            this.trigger('onTranslated');
            if (oldIndex !== this.currentIndex) {
                this.trigger('onChanged', { index: this.currentIndex });
            }
        }, animate ? this.currentSettings.smartSpeed : 0);
    }

    applyAnimation(oldIndex, newIndex) {
        const children = Array.from(this.stage.children);
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
        const prevItem = children[offset + oldIndex];
        const nextItem = children[offset + newIndex];
        const margin = this.currentSettings.margin || 0;

        if (this.currentSettings.animateOut) {
            prevItem.classList.add('animated', this.currentSettings.animateOut);
        }
        if (this.currentSettings.animateIn) {
            nextItem.classList.add('animated', this.currentSettings.animateIn);
        }

        const itemWidth = children[0].offsetWidth + margin;
        const translate = (offset + this.currentIndex) * itemWidth * (this.currentSettings.rtl ? 1 : -1);
        
        this.stage.style.transition = `transform ${this.currentSettings.smartSpeed}ms ease-out`;
        this.stage.style.transform = `translate3d(${translate}px, 0, 0)`;

        setTimeout(() => {
            if (this.currentSettings.animateOut) prevItem.classList.remove('animated', this.currentSettings.animateOut);
            if (this.currentSettings.animateIn) nextItem.classList.remove('animated', this.currentSettings.animateIn);
        }, this.currentSettings.smartSpeed);
    }

    updateAutoHeight() {
        const offset = this.options.loop ? this.clonesCount : 0;
        const activeItem = this.stage.children[offset + this.currentIndex];
        if (activeItem) {
            this.stageOuter.style.height = `${activeItem.offsetHeight}px`;
            this.stageOuter.style.transition = `height ${this.currentSettings.smartSpeed}ms ease-in-out`;
        }
    }

    normalize(index) {
        const max = this.items.length;
        return ((index % max) + max) % max;
    }

    next() { 
        this.trigger('onChange');
        this.goTo(this.currentIndex + (this.currentSettings.slideBy || 1)); 
    }
    prev() { 
        this.trigger('onChange');
        this.goTo(this.currentIndex - (this.currentSettings.slideBy || 1)); 
    }

    updateActiveClasses() {
        const children = Array.from(this.stage.children);
        const offset = this.options.loop ? this.clonesCount : 0;
        children.forEach((child, i) => {
            const realIndex = i - offset;
            const isActive = realIndex === this.currentIndex;
            child.classList.toggle('active', isActive);
            if (this.currentSettings.center) child.classList.toggle('center', isActive);
        });
    }

    dragStart(e) {
        if (!this.currentSettings.mouseDrag && e.type.includes('mouse')) return;
        if (!this.currentSettings.touchDrag && e.type.includes('touch')) return;

        this.isDragging = true;
        this.startX = this.getX(e);
        this.prevTranslate = this.currentTranslate;
        this.trigger('onDrag');

        this.onMouseMove = this.dragMove.bind(this);
        this.onMouseUp = this.dragEnd.bind(this);

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('touchmove', this.onMouseMove, { passive: false });
        document.addEventListener('touchend', this.onMouseUp);
    }

    dragMove(e) {
        if (!this.isDragging) return;
        if (e.cancelable) e.preventDefault();

        const currentX = this.getX(e);
        this.currentTranslate = this.prevTranslate + (currentX - this.startX);

        this.stage.style.transition = 'none';
        this.stage.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
    }

    dragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('touchmove', this.onMouseMove);
        document.removeEventListener('touchend', this.onMouseUp);

        const moved = this.currentTranslate - this.prevTranslate;
        if (Math.abs(moved) > 80) {
            if (this.currentSettings.rtl) {
                if (moved < 0) this.prev(); else this.next();
            } else {
                if (moved > 0) this.prev(); else this.next();
            }
        } else {
            this.goTo(this.currentIndex);
        }
        this.trigger('onDragged');
    }

    getX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    createNavigation() {
        const nav = document.createElement('div');
        nav.className = 'owl-nav';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'owl-prev';
        prevBtn.innerHTML = this.currentSettings.navText[0];
        prevBtn.addEventListener('click', () => this.prev());

        const nextBtn = document.createElement('button');
        nextBtn.className = 'owl-next';
        nextBtn.innerHTML = this.currentSettings.navText[1];
        nextBtn.addEventListener('click', () => this.next());

        nav.append(prevBtn, nextBtn);
        this.container.appendChild(nav);
    }

    createDots() {
        if (this.dotsContainer) this.dotsContainer.remove();
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'owl-dots';

        const dotCount = Math.ceil(this.items.length / (this.currentSettings.autoWidth ? 1 : this.visibleItems));
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('button');
            dot.className = `owl-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goTo(i * (this.currentSettings.autoWidth ? 1 : this.visibleItems)));
            this.dotsContainer.appendChild(dot);
        }
        this.container.appendChild(this.dotsContainer);
    }

    updateDots() {
        if (!this.dotsContainer) return;
        const dots = this.dotsContainer.querySelectorAll('.owl-dot');
        const activeDot = Math.floor(this.currentIndex / (this.currentSettings.autoWidth ? 1 : this.visibleItems));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeDot));
    }

    startAutoplay() {
        if (this.autoplayTimer || !this.currentSettings.autoplay) return;
        this.autoplayTimer = setInterval(() => this.next(), this.currentSettings.autoplayTimeout);
    }

    pauseAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    to(index) { this.goTo(index); }
    destroy() {
        this.pauseAutoplay();
        this.container.innerHTML = '';
        this.container.classList.remove('owl-carousel', 'owl-loaded', 'owl-rtl');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwlCarouselVanilla;
}