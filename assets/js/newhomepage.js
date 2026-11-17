(function () {
  'use strict';
  var menu = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  var narrow = window.matchMedia('(max-width: 800px)');
  function resetMenu() {
    menu.hidden = !narrow.matches;
    nav.hidden = narrow.matches;
    menu.setAttribute('aria-expanded', 'false');
  }
  resetMenu();
  narrow.addEventListener('change', resetMenu);
  menu.addEventListener('click', function () {
    var open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.hidden = !open;
  });
  nav.addEventListener('click', function (event) {
    if (narrow.matches && event.target.closest('a')) {
      nav.hidden = true;
      menu.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && narrow.matches && !nav.hidden) {
      nav.hidden = true;
      menu.setAttribute('aria-expanded', 'false');
      menu.focus();
    }
  });
  var image = document.getElementById('product-image');
  var imageLink = document.getElementById('product-image-link');
  var caption = document.getElementById('product-caption');
  var assetBase = image.src.slice(0, image.src.lastIndexOf('/') + 1);
  var views = {
    production: { file: 'V3-Works-Order-register.webp', alt: 'Fraction ERP works order register showing jobs, quantities, production status and ship dates', caption: 'Works orders. Job status, material allocation and delivery dates in one view.' },
    overview: { file: 'dashboard-overview.webp', alt: 'Fraction ERP dashboard showing sales, quotes, purchasing, production, quality and tasks', caption: 'Business overview. Sales, purchasing, production and quality in one place.' },
    stock: { file: 'V3-manage-stock.webp', alt: 'Fraction ERP stock management screen', caption: 'Stock management. Inventory information connected to your operation.' }
  };
  document.querySelectorAll('[data-view]').forEach(function (link, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = link.className;
    button.innerHTML = link.innerHTML;
    button.setAttribute('aria-pressed', String(index === 0));
    button.setAttribute('aria-controls', 'product-image');
    button.addEventListener('click', function () {
      var view = views[link.dataset.view];
      image.src = assetBase + view.file;
      image.alt = view.alt;
      imageLink.href = image.src;
      imageLink.setAttribute('aria-label', 'Open full-size ' + link.textContent.trim() + ' screenshot (opens in new tab)');
      caption.textContent = view.caption;
      document.querySelectorAll('.view-link').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
    });
    link.replaceWith(button);
  });
})();
