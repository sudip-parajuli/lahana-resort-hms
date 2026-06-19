# Lahana Resort PMS — Booking Widget Integration Guide

This guide details how to integrate the Lahana Resort booking portal into your primary marketing website (e.g. `https://pailarestrosample-web.vercel.app/` or `https://lahanaresort.com`).

---

## 1. Quick Iframe Embed (Recommended)

To embed the stay booking portal directly into any page of your website, paste the following `<iframe>` HTML code block:

```html
<div class="lahana-booking-container" style="width: 100%; max-width: 800px; margin: 0 auto; padding: 10px;">
  <iframe
    src="https://pms.lahanaresort.com/book"
    id="lahana-booking-widget"
    width="100%"
    height="750"
    frameborder="0"
    scrolling="no"
    style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(45, 80, 22, 0.08); background-color: #FAFAF7; transition: all 0.3s ease;"
  ></iframe>
</div>
```

---

## 2. Dynamic Height Autoresizer (Advanced)

To avoid fixed scrollbars inside the iframe when transitioning between search availability, guest details, and success steps, add this lightweight script to your host page. It listens for height changes emitted by the widget and automatically adapts the iframe size:

### Host Website Script (Your Website)
```html
<script>
  window.addEventListener('message', function(event) {
    // Only accept messages from the PMS domain
    if (event.origin !== 'https://pms.lahanaresort.com' && event.origin !== 'http://localhost:3000') return;

    var data = event.data;
    if (data && data.type === 'lahana-resize' && data.height) {
      var iframe = document.getElementById('lahana-booking-widget');
      if (iframe) {
        iframe.style.height = data.height + 'px';
      }
    }
  });
</script>
```

---

## 3. CORS & CSRF Whitelisting

The backend API server must trust the host website. If the host website changes or you deploy to production:

1. Update `backend/config/settings/base.py`:
   - Add your website domain to `CORS_ALLOWED_ORIGINS` (e.g. `"https://lahanaresort.com"`).
   - Add your domain to `CSRF_TRUSTED_ORIGINS` (e.g. `"https://lahanaresort.com"`).
2. Reload/Restart the PMS backend service.
