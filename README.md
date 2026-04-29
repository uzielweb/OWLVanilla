# OWLCarouselVanilla 🦉

**OWLCarouselVanilla** is a modern, lightweight, high-fidelity Vanilla JavaScript carousel implementation inspired by Owl Carousel, but without jQuery dependencies. Designed to provide a premium experience with refined design and optimized performance.

![OWLCarouselVanilla Demo](https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop)

## ✨ Features

- **Zero Dependencies**: Written in pure Vanilla JS.
- **Premium Design**: Modern design system with glassmorphism, soft shadows, and fluid animations.
- **Responsive**: Adapts to any screen size (Mobile, Tablet, Desktop).
- **Infinite Loop**: Smooth and continuous transition between slides.
- **Interactivity**: Drag (mouse) and touch (mobile) support.
- **Autoplay**: Automatic playback option with pause on hover.
- **Lazy Load**: Optimized image loading.
- **Customizable**: Easy to adjust colors, sizes, and behaviors via CSS and JS.

## 🚀 How to Use

### 1. Include files in your project

Copy the `css/` and `js/` folders to your project and reference the files in your HTML:

```html
<!-- Structural and Design Styles -->
<link rel="stylesheet" href="css/owlcarouselvanilla.css">
<link rel="stylesheet" href="css/style.css">

<!-- Scripts -->
<script src="js/owlcarouselvanilla.js"></script>
```

### 2. HTML Structure

Create a container with the `.owl-carousel` class and place your items inside:

```html
<div class="owl-carousel" id="my-slider">
    <div class="item">
        <!-- Your content here (e.g., card, image, etc.) -->
        <div class="magazine-card">...</div>
    </div>
    <div class="item">...</div>
</div>
```

### 3. Initialization

Initialize the carousel via JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const slider = new OwlCarouselVanilla('#my-slider', {
        items: 3,           // Visible items on desktop
        loop: true,          // Infinite loop
        margin: 30,          // Spacing between items
        nav: true,           // Show navigation arrows
        dots: true,          // Show navigation dots
        autoplay: true,      // Start automatically
        responsive: {        // Adjustments per screen width
            0: { items: 1 },
            640: { items: 2 },
            1024: { items: 3 }
        }
    });
});
```

## ⚙️ Available Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | Number | `3` | Number of visible items. |
| `loop` | Boolean | `true` | Enables infinite loop. |
| `margin` | Number | `0` | Margin between items (px). |
| `nav` | Boolean | `true` | Displays Prev/Next arrows. |
| `dots` | Boolean | `true` | Displays indicator dots. |
| `autoplay` | Boolean | `false` | Enables automatic playback. |
| `autoplayTimeout` | Number | `5000` | Time between slides (ms). |
| `smartSpeed` | Number | `300` | Transition speed (ms). |
| `center` | Boolean | `false` | Centers the active item. |

## 🛠️ API Methods

You can control the carousel programmatically:

```javascript
const carousel = new OwlCarouselVanilla('#my-slider');

carousel.next();          // Go to next slide
carousel.prev();          // Go to previous slide
carousel.to(2);            // Go to slide at index 2
carousel.destroy();        // Remove carousel and restore original HTML
```

## 🎨 Customization

The visual design is controlled by `css/style.css`. You can change the main colors by editing the variables in `:root`:

```css
:root {
    --primary-color: #6366f1; /* Main indigo color */
    --primary-dark: #4f46e5;
    --bg-light: #f8fafc;
}
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Developed with ❤️ for the Web community.
