/**
* Template Name: Arsha - v4.8.0
* Template URL: https://bootstrapmade.com/arsha-free-bootstrap-html-template-corporate/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Header menus: pointer, keyboard and mobile navigation.
   */
  const navbar = select('#navbar')
  const navToggle = select('.mobile-nav-toggle')
  const dropdownToggles = select('#navbar .nav-dropdown-toggle', true)
  const desktopNav = window.matchMedia('(min-width: 992px)')

  const setDropdown = (button, expanded) => {
    button.setAttribute('aria-expanded', String(expanded))
    button.parentElement.classList.toggle('dropdown-open', expanded)
    button.nextElementSibling.classList.toggle('dropdown-active', expanded)
  }
  const closeDropdowns = (except) => {
    dropdownToggles.forEach(button => {
      if (button !== except) setDropdown(button, false)
    })
  }
  const setMobileNav = (expanded) => {
    if (!navbar || !navToggle) return
    navbar.classList.toggle('navbar-mobile', expanded)
    navToggle.setAttribute('aria-expanded', String(expanded))
    const icon = navToggle.querySelector('i')
    icon.classList.toggle('bi-list', !expanded)
    icon.classList.toggle('bi-x', expanded)
    if (!expanded) closeDropdowns()
  }

  if (navbar && navToggle) {
    navToggle.addEventListener('click', () => {
      setMobileNav(!navbar.classList.contains('navbar-mobile'))
    })
    dropdownToggles.forEach(button => {
      const dropdown = button.parentElement
      button.addEventListener('click', event => {
        const expanded = desktopNav.matches && event.detail > 0
          ? true
          : button.getAttribute('aria-expanded') !== 'true'
        closeDropdowns(button)
        setDropdown(button, expanded)
      })
      dropdown.addEventListener('pointerenter', event => {
        if (desktopNav.matches && event.pointerType === 'mouse') {
          closeDropdowns(button)
          setDropdown(button, true)
        }
      })
      dropdown.addEventListener('pointerleave', () => {
        if (desktopNav.matches && !dropdown.contains(document.activeElement)) {
          setDropdown(button, false)
        }
      })
      dropdown.addEventListener('focusout', event => {
        if (desktopNav.matches && !dropdown.contains(event.relatedTarget)) setDropdown(button, false)
      })
    })
    document.addEventListener('click', event => {
      if (!navbar.contains(event.target) || event.target === navbar) {
        closeDropdowns()
        setMobileNav(false)
      }
    })
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return
      const expanded = dropdownToggles.find(button => button.getAttribute('aria-expanded') === 'true')
      if (expanded) {
        setDropdown(expanded, false)
        expanded.focus()
      } else if (navbar.classList.contains('navbar-mobile')) {
        setMobileNav(false)
        navToggle.focus()
      }
    })
    desktopNav.addEventListener('change', () => setMobileNav(false))
  }

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function (e) {
    if (select(this.hash)) {
      e.preventDefault()

      let navbar = select('#navbar')
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        let icon = navbarToggle.querySelector('i')
        icon.classList.remove('bi-x')
        icon.classList.add('bi-list')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Preloader
   */
  let preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove()
    });
  }

  /**
   * Initiate  glightbox 
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function (direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function (e) {
        e.preventDefault();
        portfolioFilters.forEach(function (el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function () {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
  AOS.init({
      duration: 250,
      easing: "ease-out",
      once: true,
      mirror: false
    });
  });

})()



