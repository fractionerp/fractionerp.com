(function () {
  'use strict';

  var COOKIE_NAME = 'cookie_consent';
  var COOKIE_DAYS = 365;

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function loadGoogleAnalytics() {
    if (!window.gaTrackingId) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.gaTrackingId;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', window.gaTrackingId, { anonymize_ip: true });
  }

  function showBanner() {
    var banner = document.getElementById('cookie-consent');
    if (banner) {
      banner.style.display = 'block';
      // Trigger reflow then add active class for animation
      banner.offsetHeight;
      banner.classList.add('active');
    }
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-consent');
    if (banner) {
      banner.classList.remove('active');
      setTimeout(function () {
        banner.style.display = 'none';
      }, 400);
    }
  }

  function init() {
    var consent = getCookie(COOKIE_NAME);

    // If already consented, load GA
    if (consent === 'accepted') {
      loadGoogleAnalytics();
      return;
    }

    // If already rejected, do nothing
    if (consent === 'rejected') {
      return;
    }

    // No choice yet — show the banner
    showBanner();

    var acceptBtn = document.getElementById('cookie-accept');
    var rejectBtn = document.getElementById('cookie-reject');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        setCookie(COOKIE_NAME, 'accepted', COOKIE_DAYS);
        loadGoogleAnalytics();
        hideBanner();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        setCookie(COOKIE_NAME, 'rejected', COOKIE_DAYS);
        hideBanner();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
