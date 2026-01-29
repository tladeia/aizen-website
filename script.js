/* ============================================
   ZEN BY AIZEN - WEBSITE SCRIPTS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  initHeader();
  initHeroCarousel();
  initTestimonialsCarousel();
  initFAQ();
  initWaitlistForm();
  initHeroForm();
});

/* ============================================
   HEADER - Scroll behavior
   ============================================ */
function initHeader() {
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });
}

/* ============================================
   HERO - Conversation carousel
   ============================================ */
function initHeroCarousel() {
  const conversations = document.querySelectorAll('.conversation');
  let currentConv = 0;
  const totalConv = conversations.length;
  const interval = 5000; // 5 seconds

  function showConversation(index) {
    conversations.forEach((conv, i) => {
      conv.classList.toggle('active', i === index);
    });
  }

  function nextConversation() {
    currentConv = (currentConv + 1) % totalConv;
    showConversation(currentConv);
  }

  // Start automatic rotation
  setInterval(nextConversation, interval);
}

/* ============================================
   TESTIMONIALS - Carousel
   ============================================ */
function initTestimonialsCarousel() {
  const testimonials = document.querySelectorAll('.testimonial');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  let currentTestimonial = 0;
  const totalTestimonials = testimonials.length;
  const interval = 6000; // 6 seconds
  let autoplayTimer;

  function showTestimonial(index) {
    testimonials.forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    currentTestimonial = index;
  }

  function nextTestimonial() {
    const next = (currentTestimonial + 1) % totalTestimonials;
    showTestimonial(next);
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextTestimonial, interval);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showTestimonial(index);
      resetAutoplay();
    });
  });

  // Start automatic rotation
  startAutoplay();
}

/* ============================================
   FAQ - Accordion
   ============================================ */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      // Close other items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
        }
      });

      // Toggle current item
      item.classList.toggle('open');
    });
  });
}

/* ============================================
   WAITLIST FORM
   ============================================ */
function initWaitlistForm() {
  const form = document.getElementById('waitlist-form');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const input = form.querySelector('.waitlist-input');
    const email = input.value.trim();

    if (!email) return;

    // Replace form with success message
    form.innerHTML = `
      <div class="waitlist-success">
        <p style="font-size: 20px; color: var(--color-blue); font-weight: 500;">
          Pronto! Você tá na fila.
        </p>
        <p style="color: #666; margin-top: 8px;">
          A gente avisa quando chegar sua vez.
        </p>
      </div>
    `;
  });
}

/* ============================================
   HERO FORM
   ============================================ */
function initHeroForm() {
  const form = document.getElementById('hero-form');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const input = form.querySelector('.hero-input');
    const value = input.value.trim();

    if (!value) return;

    // Replace form with success message
    form.innerHTML = `
      <div class="hero-success">
        <p style="font-size: 18px; color: var(--color-blue); font-weight: 600;">
          ✓ Pronto! Você tá na fila.
        </p>
        <p style="color: #666; margin-top: 4px; font-size: 15px;">
          A gente avisa quando chegar sua vez.
        </p>
      </div>
    `;
  });
}

/* ============================================
   SMOOTH SCROLL - For anchor links
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerHeight = document.getElementById('header').offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});
