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
  navToggler.addEventListener("click", function () {
    navbar.classList.toggle("active");
    this.classList.toggle("active");
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
