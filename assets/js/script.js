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
 * CONSULTATION FORM HANDLER
 * Submits straight to FormSubmit (https://formsubmit.co) so photo
 * attachments actually reach us — a mailto: link can't carry files.
 * Sent via fetch to FormSubmit's AJAX endpoint so the visitor stays on
 * the page; falls back to a normal page-navigating submit if that fails.
 *
 * FormSubmit's AJAX endpoint doesn't support file uploads at all, so when
 * a photo is attached we skip the fetch entirely and let the form submit
 * normally to the real (non-AJAX) endpoint. FormSubmit then redirects back
 * here with a query flag, which we pick up on load to show the same
 * thank-you message.
 */
const CONSULTATION_SENT_PARAM = 'consultation_sent';

function wireConsultationForm(form) {
  if (!form) return;

  const submitBtn = form.querySelector('.consultation-submit');
  const status = form.querySelector('[data-consultation-status]');
  const submitLabel = submitBtn ? submitBtn.querySelector('.span') : null;
  const originalLabel = submitLabel ? submitLabel.textContent : '';

  form.addEventListener('submit', (e) => {
    if (!form.action) return;

    const fileInputs = form.querySelectorAll('input[type="file"]');
    const hasAttachment = Array.from(fileInputs).some((input) => input.files && input.files.length > 0);

    if (hasAttachment) {
      // Let the browser do a normal multipart POST straight to FormSubmit;
      // its AJAX endpoint rejects file uploads.
      let nextField = form.querySelector('input[name="_next"]');
      if (!nextField) {
        nextField = document.createElement('input');
        nextField.type = 'hidden';
        nextField.name = '_next';
        form.appendChild(nextField);
      }
      const returnUrl = new URL(window.location.href);
      returnUrl.hash = '';
      returnUrl.searchParams.set(CONSULTATION_SENT_PARAM, '1');
      nextField.value = returnUrl.toString();
      return;
    }

    e.preventDefault();

    const formData = new FormData(form);
    const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    if (status) status.hidden = true;

    fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Submission failed');
        form.reset();
        if (status) {
          status.textContent = "Thanks — we've got your request and will be in touch shortly.";
          status.hidden = false;
        }
      })
      .catch(() => {
        if (status) {
          status.textContent = "Something went wrong sending that. You can also email us directly at info@safetay.uk.";
          status.hidden = false;
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      });
  });

  if (status && new URLSearchParams(window.location.search).get(CONSULTATION_SENT_PARAM) === '1') {
    status.textContent = "Thanks — we've got your request and will be in touch shortly.";
    status.hidden = false;

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete(CONSULTATION_SENT_PARAM);
    history.replaceState(null, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
  }
}

wireConsultationForm(document.getElementById('consultation-form'));


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
