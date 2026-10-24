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

// Photo limits, checked in the browser before anything is sent
const MAX_PHOTO_TOTAL_BYTES = 10 * 1024 * 1024;
const MAX_PHOTO_COUNT = 10;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_PHOTO_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
// How long to wait for the upload to finish before we stop saying "sending"
const UPLOAD_TIMEOUT_MS = 60000;

const CONTACT_FALLBACK = 'info@reverseclassic.co.uk';
const CONTACT_PHONE = '+44 7792 372717';

/** Returns an error message if the chosen photos aren't acceptable, otherwise ''. */
function validatePhotos(files) {
  if (files.length > MAX_PHOTO_COUNT) {
    return `Please attach no more than ${MAX_PHOTO_COUNT} photos.`;
  }

  const badFile = files.find((file) => {
    const typeOk = ALLOWED_PHOTO_TYPES.includes(file.type) || (!file.type && ALLOWED_PHOTO_EXTENSIONS.test(file.name));
    return !typeOk;
  });
  if (badFile) {
    return `"${badFile.name}" isn't a supported photo. Please attach JPG, PNG, WebP, GIF or HEIC images only.`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_PHOTO_TOTAL_BYTES) {
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return `Your photos total ${totalMb}MB, which is over the 10MB limit. Please remove a few or choose smaller ones.`;
  }

  return '';
}

/** Writes a message into the form's status line, optionally with the email/phone fallback. */
function showFormStatus(status, message, { isError = false, withFallback = false } = {}) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);

  if (withFallback) {
    status.appendChild(document.createTextNode(' If anything looks wrong, email '));
    const mail = document.createElement('a');
    mail.href = `mailto:${CONTACT_FALLBACK}`;
    mail.textContent = CONTACT_FALLBACK;
    status.appendChild(mail);
    status.appendChild(document.createTextNode(' or call '));
    const tel = document.createElement('a');
    tel.href = `tel:${CONTACT_PHONE.replace(/\s/g, '')}`;
    tel.textContent = CONTACT_PHONE;
    status.appendChild(tel);
    status.appendChild(document.createTextNode('.'));
  }

  status.hidden = false;
}

function wireConsultationForm(form) {
  if (!form) return;

  const submitBtn = form.querySelector('.consultation-submit');
  const status = form.querySelector('[data-consultation-status]');
  const submitLabel = submitBtn ? submitBtn.querySelector('.span') : null;
  const originalLabel = submitLabel ? submitLabel.textContent : '';

  const iframeName = `consultation-frame-${consultationFrameId++}`;
  const iframe = document.createElement('iframe');
  iframe.name = iframeName;
  iframe.title = 'Form submission response (hidden)';
  iframe.hidden = true;
  document.body.appendChild(iframe);

  function resetButton() {
    if (submitBtn) submitBtn.disabled = false;
    if (submitLabel) submitLabel.textContent = originalLabel;
  }

  form.addEventListener('submit', (e) => {
    if (!form.action) return;

    const attachments = [];
    form.querySelectorAll('input[type="file"]').forEach((input) => {
      attachments.push(...Array.from(input.files || []));
    });
    const hasAttachment = attachments.length > 0;

    if (hasAttachment) {
      const problem = validatePhotos(attachments);
      if (problem) {
        e.preventDefault();
        showFormStatus(status, problem, { isError: true });
        return;
      }
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    if (status) status.hidden = true;

    if (hasAttachment) {
      if (navigator.onLine === false) {
        e.preventDefault();
        showFormStatus(status, "You appear to be offline, so your request hasn't been sent.", { isError: true, withFallback: true });
        resetButton();
        return;
      }

      // Submit to the hidden iframe so the multipart POST (with the file)
      // reaches FormSubmit without navigating the visitor away from the page.
      form.target = iframeName;

      // The iframe is cross-origin, so we can't read FormSubmit's reply: a
      // "load" only tells us a page came back, not that it was a success.
      // So the wording stays modest and always carries the email/phone fallback.
      let settled = false;
      let timeoutId = null;

      const finish = (message, isError) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        iframe.removeEventListener('load', onLoad);
        window.removeEventListener('offline', onOffline);
        if (!isError) form.reset();
        showFormStatus(status, message, { isError, withFallback: true });
        resetButton();
      };

      const onLoad = () => finish('Thanks - your request has been sent.', false);
      const onOffline = () => finish("Your connection dropped while sending, so your request may not have gone through.", true);

      iframe.addEventListener('load', onLoad);
      window.addEventListener('offline', onOffline);
      timeoutId = setTimeout(() => {
        finish("This is taking longer than expected, so we can't confirm your request was sent.", true);
      }, UPLOAD_TIMEOUT_MS);
      return;
    }

    e.preventDefault();
    form.target = '';

    const formData = new FormData(form);
    // FormSubmit's AJAX endpoint is derived from the form's action, so the
    // destination address only needs changing in the HTML.
    const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

    fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Submission failed');
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        // FormSubmit can answer 200 with success: "false" (e.g. form not activated yet)
        if (data && (data.success === false || data.success === 'false')) {
          throw new Error('Submission rejected');
        }
        form.reset();
        showFormStatus(status, "Thanks - we've got your request and will be in touch shortly.");
      })
      .catch(() => {
        showFormStatus(status, "Something went wrong sending that.", { isError: true, withFallback: true });
      })
      .finally(resetButton);
  });
}

wireConsultationForm(document.getElementById('consultation-form'));

/**
 * FILE UPLOAD STATUS + PREVIEWS
 * Native file inputs are visually hidden in favor of a styled trigger
 * button. Selected photos are tracked in our own array (rather than
 * relying on the native FileList, which can't be edited) so visitors can
 * see a thumbnail of each photo and remove individual ones before
 * sending. The array is written back into the input via a DataTransfer
 * so the eventual multipart form submission only includes what's left.
 */
function wireFileUploadStatus(wrapper) {
  const input = wrapper.querySelector('[data-file-upload-input]');
  const status = wrapper.querySelector('[data-file-upload-status]');
  const previews = wrapper.parentElement
    ? wrapper.parentElement.querySelector('[data-file-upload-previews]')
    : null;
  if (!input || !status) return;

  const defaultText = status.textContent;
  let selectedFiles = [];
  let objectUrls = [];

  function clearObjectUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  function syncInputFiles() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
  }

  function render() {
    if (selectedFiles.length === 0) {
      status.textContent = defaultText;
    } else {
      status.textContent = `${selectedFiles.length} photo${selectedFiles.length === 1 ? '' : 's'} selected`;
    }

    if (!previews) return;

    clearObjectUrls();
    previews.innerHTML = '';
    previews.hidden = selectedFiles.length === 0;

    selectedFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      objectUrls.push(url);

      const item = document.createElement('div');
      item.className = 'file-preview-item';

      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      item.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'file-preview-remove';
      removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        syncInputFiles();
        render();
      });
      item.appendChild(removeBtn);

      previews.appendChild(item);
    });
  }

  input.addEventListener('change', () => {
    selectedFiles = Array.from(input.files || []);
    render();
  });

  if (input.form) {
    input.form.addEventListener('reset', () => {
      selectedFiles = [];
      render();
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
  // Address is partial (no street address yet) - update the query once the user has it
  const MAP_SRC = 'https://www.google.com/maps?q=Ballintuim%2C+Blairgowrie+PH10+7NJ&output=embed';

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
