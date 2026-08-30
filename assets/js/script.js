'use strict';

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
 * TEXT REVEAL ON SCROLL
 */
const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealEls.forEach((el) => revealObserver.observe(el));
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


/**
 * COOKIE CONSENT + GOOGLE MAPS EMBED
 * The Google Maps embed sets its own third-party cookies, so it's not
 * loaded until the visitor accepts. Nothing else on the site sets
 * cookies, so this is the only thing consent gates.
 */
(function () {
  const CONSENT_KEY = 'safetay-cookie-consent';
  const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d35136.00287413038!2d-3.3762618!3d56.5916962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48866a745863c873%3A0xc3f58a8a30f3a61e!2sBlairgowrie!5e0!3m2!1sen!2suk!4v1700000000000!5m2!1sen!2suk';

  function getConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      /* ignore - consent just won't persist across visits */
    }
  }

  function loadMaps() {
    document.querySelectorAll('[data-map-embed]').forEach((container) => {
      if (container.querySelector('iframe')) return;
      container.innerHTML = `<iframe src="${MAP_SRC}" width="100%" height="220" style="border:0; border-radius: 8px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    });
  }

  function hideBanner() {
    const banner = document.querySelector('[data-cookie-banner]');
    if (banner) banner.hidden = true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const consent = getConsent();

    if (consent === 'accepted') {
      loadMaps();
      hideBanner();
    } else if (consent === 'declined') {
      hideBanner();
    } else {
      const banner = document.querySelector('[data-cookie-banner]');
      if (banner) banner.hidden = false;
    }

    const acceptBtn = document.querySelector('[data-cookie-accept]');
    const declineBtn = document.querySelector('[data-cookie-decline]');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        setConsent('accepted');
        loadMaps();
        hideBanner();
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        setConsent('declined');
        hideBanner();
      });
    }

    // Per-map "load it anyway" button, for a visitor who declined (or
    // hasn't chosen yet) but wants to see the map on this one page.
    document.querySelectorAll('[data-map-consent-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setConsent('accepted');
        loadMaps();
        hideBanner();
      });
    });
  });
})();
