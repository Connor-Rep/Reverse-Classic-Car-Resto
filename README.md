# Reverse Classic Car Restoration

Website for Reverse Classic Car Restoration, a classic car restoration and detailing workshop in Ballintuim, Blairgowrie, Perthshire (https://reverseclassic.co.uk). It is a plain static site: HTML, CSS and a little vanilla JavaScript, with no build step.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Pages

- `index.html` - home page: hero, restoration process, consultation form, our work, recent projects
- `projects.html` - restoration portfolio
- `projects/mustang-fastback-1970.html`, `projects/escort-mk2.html`, `projects/cobra-kit-car.html` - one page per project (before/after and build-notes blocks are hidden until the owner supplies photos and text; see the OWNER INPUT NEEDED comments in each file)
- `contact.html` - consultation / contact form
- `how-we-work.html` - step-by-step timeline (confirmed steps only; optional extra steps are hidden), what to send us
- `faq.html` - FAQ accordion (native details/summary) with FAQPage structured data for the visible questions; extra questions are hidden until the owner answers them
- `restoration/mechanical.html`, `restoration/bodywork.html`, `restoration/protection.html` - service detail pages
- `privacy-policy.html`, `terms-and-conditions.html` - legal pages (noindex while the placeholders are unfilled, so not in the sitemap; add them back when the noindex is removed)
- `404.html` - not-found page (noindex, not in the sitemap)
- `sitemap.xml`, `robots.txt` - search engine files

Styles are in `assets/css/`, the script in `assets/js/script.js`, and fonts (Poppins, Quicksand) are self-hosted in `assets/fonts/`.

## Contact forms

Both forms (home and contact, kept identical) post to FormSubmit (https://formsubmit.co) and are delivered to info@reverseclassic.co.uk. Name and email are required; phone, car, service needed, notes and photos are optional. FormSubmit needs a one-off activation: the first submission triggers a confirmation email, and its link must be clicked before forms are delivered.

## Call buttons

Every page has a click-to-call button in the header and, on screens 768px wide or narrower, a sticky Call / Enquire bar at the bottom (hidden while the cookie banner is showing or a form field has focus). The phone number lives in those two snippets, the footer and the structured data on `index.html`.

## Testimonials

`index.html` contains a hidden testimonials section (`id="testimonials"`). Add real quotes and remove the `hidden` attribute to show it; see the OWNER comment there.

## Owner placeholders

Search the repo for `OWNER INPUT NEEDED` and `OWNER NOTE`:

- `privacy-policy.html`, `terms-and-conditions.html` - business address, deposit, payment terms, cancellation terms, warranty period (shown as `[...]` in the text)
- `index.html` - testimonials section is hidden until real quotes exist; add a sentence about collecting/delivering cars to the "Where we work" line if offered
- `how-we-work.html`, `faq.html` - hidden extra steps / questions (written estimate, progress updates, handover, insurance, collection, timescales, part-finished projects); each has an OWNER INPUT NEEDED comment saying how to enable it
- Every page footer - social links are `#` placeholders until the real profile URLs exist

## Notes

`_archive/` holds images that are not used by the site. It is not part of the site and should be excluded when publishing.
