/**
 * Owl Carousel v2.3.4 - Vanilla JavaScript Edition (Moderna)
 * Suporte Completo: loop, responsive, drag, nav, dots, autoplay, lazyload, center, stagePadding, rewind, refresh, etc.
 */

class OwlCarouselVanilla {
    constructor(selector, userOptions = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.container) throw new Error('OwlCarouselVanilla: Elemento não encontrado');

        this.options = { ...OwlCarouselVanilla.defaults, ...userOptions };
        this.stage = null;
        this.items = [];
        this.clonesCount = 0;
        this.currentIndex = 0;
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
            navContainer: false,
            dots: true,
            dotsContainer: false,
            dotsPosition: 'bottom-center',
            navPosition: 'middle-left-right',
            autoplay: false,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            autoplaySpeed: false,
            smartSpeed: 300,
            fluidSpeed: 250,
            lazyLoad: false,
            responsive: {
                0: { items: 1 },
                576: { items: 2 },
                992: { items: 3 }
            },
            responsiveClass: false,
            startPosition: 0,
            autoWidth: false,
            autoHeight: false,
            animateIn: false,
            animateOut: false,
            mouseDrag: true,
            touchDrag: true,
            pullDrag: true,
            freeDrag: false,
            merge: false,
            mergeFit: true,
            slideBy: 1,
            rewind: true,
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
            onChanged: null,
            onRefresh: null,
            onRefreshed: null
        };
    }

    init() {
        this.trigger('onInitialize');
        this.container.classList.add('owl-carousel', 'owl-loaded');
        
        this.createStage();
        this.collectItems();
        this.applyResponsive();
        this.cloneForLoop();
        this.renderStage();
        this.setupEvents();
        this.goTo(this.options.startPosition, false);

        if (this.currentSettings.autoplay) this.startAutoplay();
        this.trigger('onInitialized');
    }

    refresh() {
        this.trigger('onRefresh');
        this.applyResponsive();
        this.cloneForLoop();
        this.renderStage();
        this.updateActiveClasses();
        this.updateDots();
        this.trigger('onRefreshed');
    }

    trigger(event, extraData = {}) {
        const data = {
            index: this.currentIndex,
            items: this.items.length,
            settings: this.currentSettings,
            ...extraData
        };

        if (this.options[event] && typeof this.options[event] === 'function') {
            this.options[event].call(this, data);
        }
        
        const evt = new CustomEvent(event, { detail: data });
        this.container.dispatchEvent(evt);
    }

    createStage() {
        if (this.stageOuter) this.stageOuter.remove();
        
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

        this.items = children.map(el => {
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
        let currentBreakpoint = 0;
        
        if (this.options.responsive) {
            const breakpoints = Object.keys(this.options.responsive).sort((a, b) => Number(a) - Number(b));
            breakpoints.forEach(bp => {
                if (w >= Number(bp)) {
                    settings = { ...settings, ...this.options.responsive[bp] };
                    currentBreakpoint = bp;
                }
            });
        }

        this.currentSettings = settings;
        this.visibleItems = settings.items;

        if (this.options.responsiveClass) {
            this.container.classList.forEach(cls => {
                if (cls.startsWith('owl-responsive-')) this.container.classList.remove(cls);
            });
            this.container.classList.add(`owl-responsive-${currentBreakpoint}`);
        }

        this.container.classList.toggle('owl-rtl', settings.rtl);
    }

    cloneForLoop() {
        this.clonesCount = 0;
        if (!this.currentSettings.loop || this.items.length <= 1) return;

        const cloneCount = Math.max(this.visibleItems, 3);
        this.clonesCount = cloneCount;

        this.clonesBefore = this.items.slice(-cloneCount).map(el => {
            const clone = el.cloneNode(true);
            clone.classList.add('cloned');
            return clone;
        });

        this.clonesAfter = this.items.slice(0, cloneCount).map(el => {
            const clone = el.cloneNode(true);
            clone.classList.add('cloned');
            return clone;
        });
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

        if (this.currentSettings.mouseDrag) {
            this.stage.addEventListener('mousedown', e => this.dragStart(e));
        }
        if (this.currentSettings.touchDrag) {
            this.stage.addEventListener('touchstart', e => this.dragStart(e), { passive: true });
        }

        if (this.currentSettings.autoplayHoverPause) {
            this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.container.addEventListener('mouseleave', () => this.startAutoplay());
        }

        this.updateNavigation();
        this.updateDotsVisibility();
    }

    updateNavigation() {
        if (this.currentSettings.nav) {
            if (!this.navElement) this.createNavigation();
        } else if (this.navElement) {
            this.navElement.remove();
            this.navElement = null;
        }
    }

    updateDotsVisibility() {
        if (this.currentSettings.dots) {
            this.createDots();
        } else if (this.dotsElement) {
            this.dotsElement.remove();
            this.dotsElement = null;
        }
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
        const padding = this.currentSettings.stagePadding || 0;
        this.stageOuter.style.paddingLeft = `${padding}px`;
        this.stageOuter.style.paddingRight = `${padding}px`;

        const containerWidth = this.stageOuter.clientWidth - (padding * 2);
        const margin = this.currentSettings.margin || 0;
        const items = this.visibleItems || 1;
        
        // Grid unit width
        const unitWidth = (containerWidth - (margin * (items - 1))) / items;
        
        let totalWidth = 0;
        const children = Array.from(this.stage.children);
        
        children.forEach((child) => {
            let itemWidth = unitWidth;

            if (this.currentSettings.merge) {
                const mergeValue = parseInt(child.getAttribute('data-merge')) || 1;
                const fitValue = this.currentSettings.mergeFit ? Math.min(mergeValue, items) : mergeValue;
                itemWidth = (unitWidth * fitValue) + (margin * (fitValue - 1));
            }

            child.style.width = this.currentSettings.autoWidth ? 'auto' : `${itemWidth}px`;
            child.style.marginRight = this.currentSettings.rtl ? '0' : `${margin}px`;
            child.style.marginLeft = this.currentSettings.rtl ? `${margin}px` : '0';
            
            totalWidth += (this.currentSettings.autoWidth ? child.offsetWidth : itemWidth) + margin;
        });

        this.stage.style.width = `${totalWidth}px`;
        this.stage.style.direction = this.currentSettings.rtl ? 'rtl' : 'ltr';
        
        if (this.currentSettings.rtl) {
            this.stage.style.marginRight = `-${margin}px`;
        } else {
            this.stage.style.marginLeft = '0';
        }
    }

    goTo(index, animate = true, speed = null) {
        this.trigger('onTranslate');
        const oldIndex = this.currentIndex;
        
        if (!this.currentSettings.loop && this.currentSettings.rewind) {
            if (index >= this.items.length) index = 0;
            if (index < 0) index = this.items.length - 1;
        }

        this.currentIndex = this.normalize(index);
        
        const children = Array.from(this.stage.children);
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
        const targetItem = children[offset + this.currentIndex];
        
        const padding = this.currentSettings.stagePadding || 0;
        const containerWidth = this.stageOuter.clientWidth - (padding * 2);
        const margin = this.currentSettings.margin || 0;
        const unitWidth = (containerWidth - (margin * (this.visibleItems - 1))) / this.visibleItems;
        
        let translate = 0;
        if (this.currentSettings.autoWidth || this.currentSettings.merge) {
            for (let i = 0; i < offset + this.currentIndex; i++) {
                let w = unitWidth;
                if (this.currentSettings.merge) {
                    const mergeValue = parseInt(children[i].getAttribute('data-merge')) || 1;
                    const fitValue = this.currentSettings.mergeFit ? Math.min(mergeValue, this.visibleItems) : mergeValue;
                    w = (unitWidth * fitValue) + (margin * (fitValue - 1));
                } else if (this.currentSettings.autoWidth) {
                    w = children[i].offsetWidth;
                }
                translate += w + margin;
            }
        } else {
            translate = (offset + this.currentIndex) * (unitWidth + margin);
        }

        if (this.currentSettings.center) {
            let currentItemWidth = unitWidth;
            if (this.currentSettings.merge) {
                const mergeValue = parseInt(targetItem.getAttribute('data-merge')) || 1;
                const fitValue = this.currentSettings.mergeFit ? Math.min(mergeValue, this.visibleItems) : mergeValue;
                currentItemWidth = (unitWidth * fitValue) + (margin * (fitValue - 1));
            } else if (this.currentSettings.autoWidth) {
                currentItemWidth = targetItem.offsetWidth;
            }
            translate -= (containerWidth - currentItemWidth) / 2;
        }

        const multiplier = this.currentSettings.rtl ? 1 : -1;
        const finalTranslate = translate * multiplier;
        const finalSpeed = speed || this.currentSettings.smartSpeed;

        if (animate && (this.currentSettings.animateIn || this.currentSettings.animateOut)) {
            this.applyAnimation(oldIndex, this.currentIndex, finalSpeed);
        } else {
            this.stage.style.transition = animate ? `transform ${finalSpeed}ms ease-out` : 'none';
            this.stage.style.transform = `translate3d(${finalTranslate}px, 0, 0)`;
        }

        this.currentTranslate = finalTranslate;

        if (this.currentSettings.autoHeight) this.updateAutoHeight(finalSpeed);

        this.updateActiveClasses();
        this.updateDots();
        
        setTimeout(() => {
            this.trigger('onTranslated');
            if (oldIndex !== this.currentIndex) {
                this.trigger('onChanged');
            }
        }, animate ? finalSpeed : 0);
    }

    applyAnimation(oldIndex, newIndex, speed) {
        const children = Array.from(this.stage.children);
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
        const prevItem = children[offset + oldIndex];
        const nextItem = children[offset + newIndex];
        const margin = this.currentSettings.margin || 0;

        if (this.currentSettings.animateOut) prevItem.classList.add('animated', this.currentSettings.animateOut);
        if (this.currentSettings.animateIn) nextItem.classList.add('animated', this.currentSettings.animateIn);

        const containerWidth = this.stageOuter.clientWidth - ((this.currentSettings.stagePadding || 0) * 2);
        const itemWidth = (containerWidth - (margin * (this.visibleItems - 1))) / this.visibleItems;
        const translate = (offset + this.currentIndex) * (itemWidth + margin) * (this.currentSettings.rtl ? 1 : -1);
        
        this.stage.style.transition = `transform ${speed}ms ease-out`;
        this.stage.style.transform = `translate3d(${translate}px, 0, 0)`;

        setTimeout(() => {
            if (this.currentSettings.animateOut) prevItem.classList.remove('animated', this.currentSettings.animateOut);
            if (this.currentSettings.animateIn) nextItem.classList.remove('animated', this.currentSettings.animateIn);
        }, speed);
    }

    updateAutoHeight(speed) {
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
        const activeItem = this.stage.children[offset + this.currentIndex];
        if (activeItem) {
            this.stageOuter.style.height = `${activeItem.offsetHeight}px`;
            this.stageOuter.style.transition = `height ${speed}ms ease-in-out`;
        }
    }

    normalize(index) {
        const max = this.items.length;
        if (max === 0) return 0;
        return ((index % max) + max) % max;
    }

    next(speed) { 
        this.trigger('onChange');
        const s = speed || (this.currentSettings.autoplay ? this.currentSettings.autoplaySpeed || this.currentSettings.smartSpeed : this.currentSettings.smartSpeed);
        this.goTo(this.currentIndex + (this.currentSettings.slideBy || 1), true, s); 
    }
    prev(speed) { 
        this.trigger('onChange');
        this.goTo(this.currentIndex - (this.currentSettings.slideBy || 1), true, speed); 
    }

    updateActiveClasses() {
        const children = Array.from(this.stage.children);
        const offset = this.currentSettings.loop ? this.clonesCount : 0;
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
        this.stage.style.transition = 'none';
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
        let diff = currentX - this.startX;

        // Pull Drag (Elastic Effect)
        if (!this.currentSettings.loop && this.currentSettings.pullDrag) {
            const isAtStart = this.currentIndex === 0 && diff > 0;
            const isAtEnd = this.currentIndex === this.items.length - 1 && diff < 0;
            if (isAtStart || isAtEnd) diff *= 0.4;
        }

        this.currentTranslate = this.prevTranslate + diff;
        this.stage.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
    }

    dragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('touchmove', this.onMouseMove);
        document.removeEventListener('touchend', this.onMouseUp);

        if (this.currentSettings.freeDrag) {
            this.prevTranslate = this.currentTranslate;
            return;
        }

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
        const nav = this.currentSettings.navContainer ? 
                    (typeof this.currentSettings.navContainer === 'string' ? document.querySelector(this.currentSettings.navContainer) : this.currentSettings.navContainer) : 
                    document.createElement('div');
        
        if (!this.currentSettings.navContainer) {
            nav.className = `owl-nav owl-nav-${this.currentSettings.navPosition}`;
            this.container.appendChild(nav);
        }

        nav.innerHTML = '';
        const prevBtn = document.createElement('button');
        prevBtn.className = 'owl-prev';
        prevBtn.innerHTML = this.currentSettings.navText[0];
        prevBtn.onclick = () => this.prev();

        const nextBtn = document.createElement('button');
        nextBtn.className = 'owl-next';
        nextBtn.innerHTML = this.currentSettings.navText[1];
        nextBtn.onclick = () => this.next();

        nav.append(prevBtn, nextBtn);
        this.navElement = nav;
    }

    createDots() {
        const dots = this.currentSettings.dotsContainer ? 
                     (typeof this.currentSettings.dotsContainer === 'string' ? document.querySelector(this.currentSettings.dotsContainer) : this.currentSettings.dotsContainer) : 
                     document.createElement('div');

        if (!this.currentSettings.dotsContainer) {
            dots.className = `owl-dots owl-dots-${this.currentSettings.dotsPosition}`;
            if (this.dotsElement) this.dotsElement.remove();
            this.container.appendChild(dots);
        }

        dots.innerHTML = '';
        const dotCount = Math.ceil(this.items.length / (this.currentSettings.autoWidth ? 1 : this.visibleItems));
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'owl-dot';
            dot.onclick = () => this.goTo(i * (this.currentSettings.autoWidth ? 1 : this.visibleItems));
            dots.appendChild(dot);
        }
        this.dotsElement = dots;
        this.updateDots();
    }

    updateDots() {
        if (!this.dotsElement) return;
        const dots = this.dotsElement.querySelectorAll('.owl-dot');
        const activeDot = Math.floor(this.currentIndex / (this.currentSettings.autoWidth ? 1 : this.visibleItems));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeDot));
    }

    startAutoplay() {
        this.pauseAutoplay();
        if (!this.currentSettings.autoplay) return;
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
        this.container.classList.forEach(cls => {
            if (cls.startsWith('owl-responsive-')) this.container.classList.remove(cls);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwlCarouselVanilla;
}