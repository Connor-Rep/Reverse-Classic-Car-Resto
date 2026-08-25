'use strict';

/**
 * SERVICE CARD OVERLAY LOGIC
 */
const serviceReadMoreBtns = document.querySelectorAll(".service-read-more");
const serviceCloseBtns = document.querySelectorAll(".close-overlay");

serviceReadMoreBtns.forEach(btn => {
  btn.addEventListener("click", function() {
    const overlay = this.closest(".service-card").querySelector(".card-overlay");
    if (overlay) overlay.classList.add("active");
  });
});

serviceCloseBtns.forEach(btn => {
  btn.addEventListener("click", function() {
    this.closest(".card-overlay").classList.remove("active");
  });
});



/**
 * SMOOTH SCROLLING FOR ALL INTERNAL ANCHOR LINKS
 */
const anchorLinks = document.querySelectorAll('a[href^="#"]');

anchorLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');

    // Make sure it's an actual section link and not just an empty "#" 
    if (targetId !== '#' && targetId.startsWith('#')) {
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        // keeps URL clean
        e.preventDefault();

        // Smoothly scroll to the target section
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Close the mobile navbar if it's open
        const navbar = document.querySelector('[data-navbar]');
        const navToggler = document.querySelector('[data-nav-toggler]');
        if (navbar && navbar.classList.contains('active')) {
          navbar.classList.remove('active');
          navToggler.classList.remove('active');
        }
      }
    }
  });
});


/**
 * MOBILE NAVBAR TOGGLE
 */
const navbar = document.querySelector("[data-navbar]");
const navToggler = document.querySelector("[data-nav-toggler]");

if (navbar && navToggler) {
  navToggler.setAttribute("aria-expanded", "false");

  navToggler.addEventListener("click", function () {
    const isActive = navbar.classList.toggle("active");
    this.classList.toggle("active");
    this.setAttribute("aria-expanded", String(isActive));
  });
}

// Secretly erase the hash from the address bar when arriving from another page
window.addEventListener("load", () => {
  if (window.location.hash) {
    setTimeout(() => {
      history.replaceState(null, null, window.location.pathname);
    }, 10);
  }
});


/**
 * GLOBAL CART SYNC (Reads from Local Storage)
 */
window.addEventListener('DOMContentLoaded', () => {
  const cartBadge = document.getElementById('cart-count');
  if (cartBadge) {
      // Look in the browser memory for the cart, or use an empty array if nothing is there
      const savedCart = JSON.parse(localStorage.getItem('safetay_cart')) || [];
      cartBadge.innerText = savedCart.length; // Update the number!
  }
});

/**
 * GLOBAL HEADER QUOTE BUTTON
 */
const headerBookingBtn = document.getElementById("header-booking-btn");

headerBookingBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    // No matter what is in the basket, go straight to the checkout page!
    window.location.href = "./quote.html";
});


/**
 * "WHY CHOOSE US" STAT COUNTER ANIMATION
 */
const counters = document.querySelectorAll('[data-count-to]');

if (counters.length) {
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 5); /* stronger ease-out: slows more as it nears the final value */
      el.textContent = Math.round(eased * target) + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach((el) => counterObserver.observe(el));
}


/**
 * MAILTO FORM HANDLER (Consultation + Contact forms)
 * Static site, no backend: this opens the visitor's own email client with a
 * pre-filled message addressed to the shop. They still have to hit "send"
 * themselves — it is not a fully automatic server-side email.
 */
function wireMailtoForm(form, to, subjectPrefix) {
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const lines = [];
    data.forEach((value, key) => {
      if (String(value).trim()) lines.push(`${key}: ${value}`);
    });

    const subject = encodeURIComponent(`${subjectPrefix} - ${data.get('name') || 'New enquiry'}`);
    const body = encodeURIComponent(lines.join('\n'));

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}

wireMailtoForm(document.getElementById('consultation-form'), 'info@safetay.uk', 'Free Consultation Request');
wireMailtoForm(document.getElementById('contact-form'), 'info@safetay.uk', 'Website Contact Form');
