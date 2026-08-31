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
 * a photo is attached we submit the form to a hidden iframe instead —
 * that's a real multipart POST (so attachments work) but it never
 * navigates the visitor's own tab away to formsubmit.co.
 */
let consultationFrameId = 0;

function wireConsultationForm(form) {
  if (!form) return;

  const submitBtn = form.querySelector('.consultation-submit');
  const status = form.querySelector('[data-consultation-status]');
  const submitLabel = submitBtn ? submitBtn.querySelector('.span') : null;
  const originalLabel = submitLabel ? submitLabel.textContent : '';

  const iframeName = `consultation-frame-${consultationFrameId++}`;
  const iframe = document.createElement('iframe');
  iframe.name = iframeName;
  iframe.hidden = true;
  document.body.appendChild(iframe);

  form.addEventListener('submit', (e) => {
    if (!form.action) return;

    const fileInputs = form.querySelectorAll('input[type="file"]');
    const hasAttachment = Array.from(fileInputs).some((input) => input.files && input.files.length > 0);

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    if (status) status.hidden = true;

    if (hasAttachment) {
      // Submit to the hidden iframe so the multipart POST (with the file)
      // reaches FormSubmit without navigating the visitor away from the page.
      form.target = iframeName;

      const onLoad = () => {
        iframe.removeEventListener('load', onLoad);
        form.reset();
        if (status) {
          status.textContent = "Thanks — we've got your request and will be in touch shortly.";
          status.hidden = false;
        }
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      };
      iframe.addEventListener('load', onLoad);
      return;
    }

    e.preventDefault();

    const formData = new FormData(form);
    const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

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
          status.textContent = "Something went wrong sending that. You can also email us directly at info@reverseclassic.co.uk.";
          status.hidden = false;
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      });
  });
}

wireConsultationForm(document.getElementById('consultation-form'));

/**
 * FILE UPLOAD STATUS TEXT
 * Native file inputs are visually hidden in favor of a styled trigger
 * button, so reflect the current selection back to the visitor here.
 */
function wireFileUploadStatus(wrapper) {
  const input = wrapper.querySelector('[data-file-upload-input]');
  const status = wrapper.querySelector('[data-file-upload-status]');
  if (!input || !status) return;

  const defaultText = status.textContent;

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    if (files.length === 0) {
      status.textContent = defaultText;
    } else if (files.length === 1) {
      status.textContent = files[0].name;
    } else {
      status.textContent = `${files.length} photos selected`;
    }
  });

  if (input.form) {
    input.form.addEventListener('reset', () => {
      status.textContent = defaultText;
    });
  }
}

document.querySelectorAll('.file-upload').forEach(wireFileUploadStatus);


/**
 * COOKIE CONSENT + GOOGLE MAPS EMBED
 * The Google Maps embed sets its own third-party cookies, so it's not
 * loaded until the visitor accepts. Nothing else on the site sets
 * cookies, so this is the only thing consent gates.
 */
(function () {
  const CONSENT_KEY = 'reverse-cookie-consent';
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
