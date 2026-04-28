# OWLVanilla 🦉

**OWLVanilla** é uma implementação moderna, leve e de alta fidelidade de um carrossel em JavaScript puro (Vanilla JS), inspirada no Owl Carousel, mas sem dependências de jQuery. Projetado para oferecer uma experiência premium com design refinado e performance otimizada.

![OWLVanilla Demo](https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop)

## ✨ Funcionalidades

- **Zero Dependências**: Escrito em Vanilla JS puro.
- **Design Premium**: Sistema de design moderno com glassmorphism, sombras suaves e animações fluidas.
- **Responsivo**: Adaptável a qualquer tamanho de tela (Mobile, Tablet, Desktop).
- **Loop Infinito**: Transição suave e contínua entre slides.
- **Interatividade**: Suporte a arraste (drag) no mouse e toque (touch) em dispositivos móveis.
- **Autoplay**: Opção de reprodução automática com pausa ao passar o mouse.
- **Lazy Load**: Carregamento otimizado de imagens.
- **Customizável**: Fácil de ajustar cores, tamanhos e comportamentos via CSS e JS.

## 🚀 Como Usar

### 1. Inclua os arquivos no seu projeto

Copie as pastas `css/` e `js/` para o seu projeto e referencie os arquivos no seu HTML:

```html
<!-- Estilos Estruturais e de Design -->
<link rel="stylesheet" href="css/owl.css">
<link rel="stylesheet" href="css/style.css">

<!-- Scripts -->
<script src="js/owlvanilla.js"></script>
```

### 2. Estrutura HTML

Crie um container com a classe `.owl-carousel` e coloque seus itens dentro dele:

```html
<div class="owl-carousel" id="meu-slider">
    <div class="item">
        <!-- Seu conteúdo aqui (ex: card, imagem, etc) -->
        <div class="magazine-card">...</div>
    </div>
    <div class="item">...</div>
</div>
```

### 3. Inicialização

Inicialize o carrossel via JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const slider = new OwlCarousel('#meu-slider', {
        items: 3,           // Itens visíveis no desktop
        loop: true,          // Loop infinito
        margin: 30,          // Espaçamento entre itens
        nav: true,           // Mostrar setas de navegação
        dots: true,          // Mostrar pontos de navegação
        autoplay: true,      // Iniciar automaticamente
        responsive: {        // Ajustes por largura de tela
            0: { items: 1 },
            640: { items: 2 },
            1024: { items: 3 }
        }
    });
});
```

## ⚙️ Opções Disponíveis

| Opção | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `items` | Number | `3` | Número de itens visíveis. |
| `loop` | Boolean | `true` | Ativa o loop infinito. |
| `margin` | Number | `0` | Margem entre os itens (px). |
| `nav` | Boolean | `true` | Exibe as setas Prev/Next. |
| `dots` | Boolean | `true` | Exibe os pontos indicadores. |
| `autoplay` | Boolean | `false` | Ativa a reprodução automática. |
| `autoplayTimeout` | Number | `5000` | Tempo entre slides (ms). |
| `smartSpeed` | Number | `300` | Velocidade da transição (ms). |
| `center` | Boolean | `false` | Centraliza o item ativo. |

## 🛠️ Métodos da API

Você pode controlar o carrossel programaticamente:

```javascript
const carousel = new OwlCarousel('#meu-slider');

carousel.next();          // Vai para o próximo slide
carousel.prev();          // Vai para o slide anterior
carousel.to(2);            // Vai para o slide de índice 2
carousel.destroy();        // Remove o carrossel e restaura o HTML original
```

## 🎨 Personalização

O design visual é controlado pelo arquivo `css/style.css`. Você pode alterar as cores principais editando as variáveis no `:root`:

```css
:root {
    --primary-color: #6366f1; /* Cor indigo principal */
    --primary-dark: #4f46e5;
    --bg-light: #f8fafc;
}
```

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
Desenvolvido com ❤️ para a comunidade Web.
