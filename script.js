/**
 * MAJESTIC PARFUMS — Full Site Interaction & E-Commerce Logic
 * Cart state persists across all pages via localStorage key: 'majesticCart'
 * Pages: index.html → product.html → checkout.html → confirmation.html
 */

document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  const isHomePage         = !!document.querySelector('.hero');
  const isProductPage      = !!document.querySelector('.product-hero-section');
  const isCheckoutPage     = !!document.querySelector('.checkout-main-wrap');
  const isConfirmationPage = !!document.querySelector('.confirmation-main-wrap');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: localStorage CART
  // ═══════════════════════════════════════════════════════════════════════════

  function loadCart() {
    try {
      const items = JSON.parse(localStorage.getItem('majesticCart') || '[]');
      return items.map(item => ({
        ...item,
        selected: item.selected !== false
      }));
    } catch (e) {
      return [];
    }
  }

  function saveCart(cartData) {
    localStorage.setItem('majesticCart', JSON.stringify(cartData));
  }

  let cart = loadCart();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: TOAST NOTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  const toastNotice = document.getElementById('toastNotice');

  function showToast(message) {
    if (!toastNotice) return;
    const msgEl = toastNotice.querySelector('.toast-message');
    if (msgEl) msgEl.textContent = message;
    toastNotice.classList.add('show');
    setTimeout(() => toastNotice.classList.remove('show'), 2800);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: HEADER — Mobile Menu Toggle
  // ═══════════════════════════════════════════════════════════════════════════

  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav    = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: HEADER — Scroll Shadow
  // ═══════════════════════════════════════════════════════════════════════════

  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: NAVBAR ACTIVE LINK UNDERLINE & SCROLL-SPY
  // ═══════════════════════════════════════════════════════════════════════════

  function initNavbarActiveUnderline() {
    const mainNavLinks = document.querySelectorAll('.main-nav a');
    if (!mainNavLinks.length) return;

    if (isHomePage) {
      const sectionConfigs = [
        { id: 'home', el: document.getElementById('home') || document.querySelector('.hero') },
        { id: 'about', el: document.getElementById('about') },
        { id: 'best-of-month', el: document.getElementById('best-of-month') },
        { id: 'shop', el: document.getElementById('shop') },
        { id: 'testimonials', el: document.getElementById('testimonials') }
      ].filter(item => item.el !== null);

      function setActiveNav(targetId) {
        mainNavLinks.forEach(link => {
          const href = link.getAttribute('href') || '';
          const cleanHash = href.replace(/^.*#/, '');
          const isHomeLink = (cleanHash === 'home' || cleanHash === '' || href === '#' || href === 'index.html');

          if ((targetId === 'home' && isHomeLink) || cleanHash === targetId) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }

      let isClickScrolling = false;
      let clickScrollTimer = null;

      // Handle clicking on nav links for smooth navigation & immediate underline update
      mainNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href') || '';
          if (href.startsWith('#') || href.startsWith('index.html#')) {
            const targetId = href.replace(/^.*#/, '') || 'home';
            const targetEl = document.getElementById(targetId) || (targetId === 'home' ? document.querySelector('.hero') : null);

            if (targetEl) {
              e.preventDefault();
              isClickScrolling = true;
              clearTimeout(clickScrollTimer);

              setActiveNav(targetId);

              const headerOffset = 85;
              const targetTop = targetId === 'home' ? 0 : (targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset);

              window.scrollTo({
                top: targetTop,
                behavior: 'smooth'
              });

              if (history.replaceState) {
                history.replaceState(null, '', targetId === 'home' ? window.location.pathname : '#' + targetId);
              }

              clickScrollTimer = setTimeout(() => {
                isClickScrolling = false;
              }, 850);
            }
          }
        });
      });

      // Scroll-spy: automatically update the active underline based on scroll position
      function onScrollSpy() {
        if (isClickScrolling) return;

        const scrollPos = window.scrollY;

        // Near top of page: Home is active
        if (scrollPos < 120) {
          setActiveNav('home');
          return;
        }

        // Near bottom of page: Testimonials is active
        if (window.innerHeight + scrollPos >= document.documentElement.scrollHeight - 50) {
          setActiveNav('testimonials');
          return;
        }

        // Check sections from bottom to top
        const headerOffset = 140;
        let activeSectionId = 'home';

        for (let i = sectionConfigs.length - 1; i >= 0; i--) {
          const sec = sectionConfigs[i];
          const secTop = sec.el.getBoundingClientRect().top + scrollPos;
          if (scrollPos >= secTop - headerOffset) {
            activeSectionId = sec.id;
            break;
          }
        }

        setActiveNav(activeSectionId);
      }

      let spyRaf = null;
      window.addEventListener('scroll', () => {
        if (!spyRaf) {
          spyRaf = requestAnimationFrame(() => {
            onScrollSpy();
            spyRaf = null;
          });
        }
      }, { passive: true });

      // Handle page load with hash (e.g. index.html#about or index.html#shop from another page)
      const initialHash = window.location.hash.replace('#', '');
      if (initialHash && ['home', 'about', 'best-of-month', 'shop', 'testimonials'].includes(initialHash)) {
        setActiveNav(initialHash);
        setTimeout(() => {
          const targetEl = document.getElementById(initialHash) || (initialHash === 'home' ? document.querySelector('.hero') : null);
          if (targetEl) {
            const headerOffset = 85;
            const targetTop = initialHash === 'home' ? 0 : (targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset);
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          }
        }, 150);
      } else {
        setActiveNav('home');
      }

      // Handle browser back/forward navigation
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        setActiveNav(hash);
      });
    }
  }

  initNavbarActiveUnderline();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: SHOPPING BAG DRAWER + CART RENDERING (home & product pages)
  // ═══════════════════════════════════════════════════════════════════════════

  const bagCountBadge    = document.querySelector('.bag-count');
  const bagButton        = document.querySelector('.bag-button');
  const bagDrawer        = document.getElementById('bagDrawer');
  const bagBackdrop      = document.getElementById('bagBackdrop');
  const drawerClose      = document.getElementById('drawerClose');
  const drawerBody       = document.getElementById('drawerBody');
  const drawerFooter     = document.getElementById('drawerFooter');
  const drawerSubtotal   = document.getElementById('drawerSubtotal');
  const drawerCount      = document.getElementById('drawerCount');
  const drawerSelectAllBar = document.getElementById('drawerSelectAllBar');
  const cartSelectAll    = document.getElementById('cartSelectAll');
  const cartSelectedCount = document.getElementById('cartSelectedCount');
  const drawerCheckoutBtn = document.getElementById('drawerCheckoutBtn') || document.getElementById('checkoutBtn');

  function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateBadge() {
    const count = getTotalItems();
    if (bagCountBadge) bagCountBadge.textContent = String(count);
    if (drawerCount)   drawerCount.textContent   = String(count);
  }

  function renderCart() {
    updateBadge();
    if (!drawerBody) return;

    const totalItems = getTotalItems();
    if (totalItems === 0) {
      drawerBody.innerHTML = `
        <div class="empty-bag-notice">
          <p>Your shopping bag is currently empty.</p>
          <a href="index.html#best-of-month" class="drawer-shop-link">Discover Bestsellers →</a>
        </div>`;
      if (drawerSelectAllBar) drawerSelectAllBar.style.display = 'none';
      if (drawerFooter) drawerFooter.style.display = 'none';
      return;
    }

    if (drawerSelectAllBar) drawerSelectAllBar.style.display = 'flex';
    if (drawerFooter) drawerFooter.style.display = 'block';

    const selectedItems = cart.filter(item => item.selected !== false);
    const selectedCount = selectedItems.length;
    const selectedSubtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (drawerSubtotal) drawerSubtotal.textContent = `$${selectedSubtotal.toFixed(2)}`;
    if (cartSelectedCount) cartSelectedCount.textContent = String(selectedCount);
    if (cartSelectAll) cartSelectAll.checked = (selectedCount === cart.length && cart.length > 0);

    if (drawerCheckoutBtn) {
      if (selectedCount === 0) {
        drawerCheckoutBtn.classList.add('disabled');
        drawerCheckoutBtn.setAttribute('disabled', 'true');
        drawerCheckoutBtn.textContent = 'CHOOSE ITEMS TO CHECKOUT';
      } else {
        drawerCheckoutBtn.classList.remove('disabled');
        drawerCheckoutBtn.removeAttribute('disabled');
        drawerCheckoutBtn.textContent = `PROCEED TO CHECKOUT ($${selectedSubtotal.toFixed(2)})`;
      }
    }

    drawerBody.innerHTML = cart.map((item, index) => {
      const isChecked = item.selected !== false;
      const sizeLabel = item.size === '5x5' ? '5x5ml Discovery Box' : `${item.size} ML`;
      return `
      <div class="cart-item-row ${isChecked ? '' : 'unselected'}" data-index="${index}">
        <label class="cart-item-select-wrap" aria-label="Select ${item.name} for checkout">
          <input type="checkbox" class="cart-item-checkbox item-select" data-index="${index}" ${isChecked ? 'checked' : ''} />
        </label>
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>${sizeLabel}</p>
          <div class="cart-qty-controls">
            <button type="button" class="cart-qty-btn decrease" data-index="${index}" aria-label="Decrease">−</button>
            <span class="cart-qty-num">${item.quantity}</span>
            <button type="button" class="cart-qty-btn increase" data-index="${index}" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="cart-item-price-col">
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          <button type="button" class="cart-item-remove" data-index="${index}" title="Remove">✕</button>
        </div>
      </div>`;
    }).join('');

    // Wire Item Checkboxes
    drawerBody.querySelectorAll('.cart-item-checkbox.item-select').forEach(box => {
      box.addEventListener('change', () => {
        const idx = Number(box.dataset.index);
        cart[idx].selected = box.checked;
        saveCart(cart);
        renderCart();
      });
    });

    // Quantity controls
    drawerBody.querySelectorAll('.cart-qty-btn.decrease').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity -= 1;
        } else {
          cart.splice(idx, 1);
        }
        saveCart(cart);
        renderCart();
      });
    });

    drawerBody.querySelectorAll('.cart-qty-btn.increase').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        cart[idx].quantity += 1;
        saveCart(cart);
        renderCart();
      });
    });

    drawerBody.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
      });
    });
  }

  // Wire Select All Checkbox
  if (cartSelectAll) {
    cartSelectAll.addEventListener('change', () => {
      const isAll = cartSelectAll.checked;
      cart.forEach(item => { item.selected = isAll; });
      saveCart(cart);
      renderCart();
    });
  }

  // Wire Checkout Button in Drawer (Cart Checkout flow)
  if (drawerCheckoutBtn) {
    drawerCheckoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedItems = cart.filter(item => item.selected !== false);
      if (selectedItems.length === 0) return;

      const cartSession = {
        type: 'cart',
        items: JSON.parse(JSON.stringify(selectedItems))
      };
      localStorage.setItem('majesticCheckoutSession', JSON.stringify(cartSession));
      window.location.href = 'checkout.html';
    });
  }

  function openBagDrawer() {
    if (bagDrawer && bagBackdrop) {
      bagDrawer.classList.add('open');
      bagBackdrop.classList.add('open');
    }
  }

  function closeBagDrawer() {
    if (bagDrawer && bagBackdrop) {
      bagDrawer.classList.remove('open');
      bagBackdrop.classList.remove('open');
    }
  }

  if (bagButton)   bagButton.addEventListener('click', openBagDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeBagDrawer);
  if (bagBackdrop) bagBackdrop.addEventListener('click', closeBagDrawer);

  // Initial render (always, so badge shows across pages)
  renderCart();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED: SEARCH OVERLAY (home & product pages)
  // ═══════════════════════════════════════════════════════════════════════════

  const searchBtn     = document.querySelector('.search-button');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchInput   = document.getElementById('fragranceSearchInput');
  const quickCatBtns  = document.querySelectorAll('.quick-cat-btn');

  function openSearch() {
    if (searchOverlay) {
      searchOverlay.classList.add('open');
      if (searchInput) setTimeout(() => searchInput.focus(), 50);
    }
  }

  function closeSearch() {
    if (searchOverlay) {
      searchOverlay.classList.remove('open');
      if (searchInput) searchInput.value = '';
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchOverlay?.classList.contains('open') ? closeSearch() : openSearch();
    });
  }
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && searchOverlay?.classList.contains('open')) closeSearch();
  });

  document.addEventListener('click', e => {
    if (searchOverlay?.classList.contains('open') &&
        !searchOverlay.contains(e.target) &&
        !searchBtn?.contains(e.target)) {
      closeSearch();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME PAGE ONLY
  // ═══════════════════════════════════════════════════════════════════════════

  if (isHomePage) {

    // ─── Category Filter Pills ───
    const filterPills  = document.querySelectorAll('.filter-pill');
    const perfumeCards = document.querySelectorAll('.perfume-card');
    const cardsTrack   = document.getElementById('cardsTrack');
    const carouselDotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.querySelector('.carousel-arrow.prev');
    const nextBtn = document.querySelector('.carousel-arrow.next');

    function setCategory(filterValue) {
      filterPills.forEach(p => {
        const match = p.getAttribute('data-filter') === filterValue;
        p.classList.toggle('active', match);
        p.setAttribute('aria-selected', String(match));
      });

      perfumeCards.forEach(card => {
        const cats = card.getAttribute('data-categories') || '';
        const visible = filterValue === 'all' || cats.split(' ').includes(filterValue);
        card.classList.toggle('hidden', !visible);
        if (visible) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.97)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 30);
        }
      });

      if (cardsTrack) cardsTrack.scrollTo({ left: 0, behavior: 'smooth' });
      updateCarouselDots();
    }

    function updateCarouselDots() {
      if (!carouselDotsContainer || !cardsTrack) return;
      carouselDotsContainer.innerHTML = '';
      const visible = Array.from(perfumeCards).filter(c => !c.classList.contains('hidden'));
      const cardWidth  = visible[0]?.offsetWidth || 300;
      const trackWidth = cardsTrack.offsetWidth || 1200;
      const perPage    = Math.max(1, Math.round(trackWidth / (cardWidth + 24)));
      const pages      = Math.ceil(visible.length / perPage);
      if (pages <= 1) return;

      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => {
          cardsTrack.scrollTo({ left: i * trackWidth, behavior: 'smooth' });
          document.querySelectorAll('.carousel-dots .dot').forEach((d, idx) => {
            d.classList.toggle('active', idx === i);
          });
        });
        carouselDotsContainer.appendChild(dot);
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => setCategory(pill.getAttribute('data-filter')));
    });

    if (prevBtn && nextBtn && cardsTrack) {
      prevBtn.addEventListener('click', () => cardsTrack.scrollBy({ left: -cardsTrack.offsetWidth * 0.75, behavior: 'smooth' }));
      nextBtn.addEventListener('click', () => cardsTrack.scrollBy({ left:  cardsTrack.offsetWidth * 0.75, behavior: 'smooth' }));
    }

    if (cardsTrack) {
      cardsTrack.addEventListener('scroll', () => {
        const activeIdx = Math.round(cardsTrack.scrollLeft / cardsTrack.offsetWidth);
        document.querySelectorAll('.carousel-dots .dot').forEach((d, idx) => {
          d.classList.toggle('active', idx === activeIdx);
        });
      });
    }

    updateCarouselDots();
    window.addEventListener('resize', updateCarouselDots);

    // ─── Search Category Mapping ───
    const searchCategoryMap = [
      { terms: ['men', 'mens', "men's", 'him', 'for him', 'masculine', 'male', 'mens perfume', "men's perfume"], category: 'him', label: "Men's Fragrances (For Him)" },
      { terms: ['women', 'womens', "women's", 'her', 'for her', 'feminine', 'female', 'womens perfume', "women's perfume"], category: 'her', label: "Women's Fragrances (For Her)" },
      { terms: ['unisex', 'gender neutral', 'shared'], category: 'unisex', label: 'Unisex Fragrances' },
      { terms: ['woody', 'wood', 'sandalwood', 'cedar', 'oud'], category: 'woody', label: 'Woody Fragrances' },
      { terms: ['fresh', 'citrus', 'clean', 'aquatic', 'bergamot'], category: 'fresh', label: 'Fresh Fragrances' },
      { terms: ['oriental', 'amber', 'spicy', 'vanilla', 'warm'], category: 'oriental', label: 'Oriental Fragrances' },
      { terms: ['floral', 'flower', 'rose', 'violet', 'iris', 'jasmine'], category: 'floral', label: 'Floral Fragrances' },
      { terms: ['long lasting', 'long-lasting', 'longevity', 'extrait'], category: 'long-lasting', label: 'Long Lasting Fragrances' },
    ];

    function executeSearch(query) {
      const q = query.toLowerCase().trim();
      if (!q) return;

      let matched = null;
      for (const item of searchCategoryMap) {
        if (item.terms.some(t => q.includes(t) || t.includes(q))) {
          matched = item;
          break;
        }
      }

      if (matched) {
        closeSearch();
        setCategory(matched.category);
        document.getElementById('best-of-month')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Showing: ${matched.label}`);
        return;
      }

      // Name search fallback
      let found = false;
      perfumeCards.forEach(card => {
        const name = card.querySelector('.card-name')?.textContent.toLowerCase() || '';
        const show = name.includes(q);
        card.classList.toggle('hidden', !show);
        if (show) found = true;
      });

      closeSearch();
      document.getElementById('best-of-month')?.scrollIntoView({ behavior: 'smooth' });
      updateCarouselDots();
      showToast(found ? `Found results for "${query}"` : `No exact match — showing all fragrances`);
      if (!found) setCategory('all');
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); executeSearch(searchInput.value); }
      });
    }

    quickCatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat   = btn.getAttribute('data-category');
        const label = btn.textContent.trim();
        closeSearch();
        setCategory(cat);
        document.getElementById('best-of-month')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Viewing: ${label}`);
      });
    });

    // ─── Size Pill Selector (cards) ───
    perfumeCards.forEach(card => {
      const sizePills   = card.querySelectorAll('.size-pill');
      const priceEl     = card.querySelector('.card-price');
      const perMlEl     = card.querySelector('.card-price-per-ml');

      sizePills.forEach(pill => {
        pill.addEventListener('click', () => {
          sizePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          if (priceEl)  priceEl.textContent  = `$${pill.dataset.price}`;
          if (perMlEl) perMlEl.textContent = `($${pill.dataset.perMl} / ml)`;
        });
      });
    });

    // ─── Add-to-Cart for Home Cards ───
    document.querySelectorAll('.card-add-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card  = btn.closest('.perfume-card');
        if (!card) return;

        const name       = card.querySelector('.card-name')?.textContent.trim() || 'Perfume';
        const activePill = card.querySelector('.size-pill.active');
        const size       = activePill?.dataset.size || '50';
        const price      = Number(activePill?.dataset.price) || 185;
        const img        = card.querySelector('.card-bottle-img')?.src || '';

        const existing = cart.find(i => i.name === name && i.size === size);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({ name, size, price, image: img, quantity: 1 });
        }

        saveCart(cart);
        renderCart();

        btn.textContent = '✓ ADDED TO BAG';
        btn.style.background = '#111111';
        btn.style.color = '#ffffff';
        showToast(`${name} (${size}ml) added to bag`);

        setTimeout(() => {
          btn.textContent = 'ADD TO CART';
          btn.style.background = '';
          btn.style.color = '';
        }, 1400);
      });
    });

    // ─── Newsletter ───
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', e => {
        e.preventDefault();
        const input = newsletterForm.querySelector('.newsletter-input');
        if (input?.value) {
          showToast('Welcome to The Private Circle');
          input.value = '';
        }
      });
    }

  } // end isHomePage

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT PAGE ONLY
  // ═══════════════════════════════════════════════════════════════════════════

  if (isProductPage) {

    // Also wire search overlay quick-cat buttons on product page
    // (they redirect to index.html with the category hash)
    quickCatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        closeSearch();
        window.location.href = `index.html#best-of-month?cat=${cat}`;
      });
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const q = searchInput.value.trim();
          if (q) {
            closeSearch();
            window.location.href = `index.html#best-of-month`;
          }
        }
      });
    }

    // ─── Thumbnail Image Switcher ───
    const thumbBtns      = document.querySelectorAll('.thumb-btn');
    const mainProductImg = document.getElementById('mainProductImg');

    if (thumbBtns.length && mainProductImg) {
      thumbBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const newSrc = btn.getAttribute('data-img');
          if (!newSrc) return;

          mainProductImg.style.opacity   = '0';
          mainProductImg.style.transform = 'scale(0.97)';

          setTimeout(() => {
            mainProductImg.src = newSrc;
            mainProductImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            mainProductImg.style.opacity    = '1';
            mainProductImg.style.transform  = 'scale(1)';
          }, 180);

          thumbBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        });
      });
    }

    // ─── Dynamic Pricing ───
    const sizeSelectBtns    = document.querySelectorAll('.size-select-btn');
    const livePriceFigure   = document.getElementById('livePriceFigure');
    const livePricePerMl    = document.getElementById('livePricePerMl');
    const installmentFigure = document.getElementById('installmentFigure');
    const btnPriceSummary   = document.getElementById('btnPriceSummary');
    const qtyMinus          = document.getElementById('qtyMinus');
    const qtyPlus           = document.getElementById('qtyPlus');
    const qtyVal            = document.getElementById('qtyVal');
    const addonCheck        = document.getElementById('addonCheck') || document.getElementById('upsellCheck');
    const engravingBox      = document.getElementById('engravingBox');
    const engravingToggleBtn = document.getElementById('engravingToggleBtn');
    const selectedSizeText  = document.getElementById('selectedSizeText');

    // Initialize from the active button in the page DOM
    const initialActiveBtn  = document.querySelector('.size-select-btn.active');
    let activeBasePrice     = initialActiveBtn ? (Number(initialActiveBtn.dataset.price) || 185) : 185;
    let activePerMl         = initialActiveBtn ? (parseFloat(initialActiveBtn.dataset.perMl) || 3.70) : 3.70;
    let activeSize          = initialActiveBtn ? (initialActiveBtn.dataset.size || '50') : '50';
    let currentQty          = 1;
    let addonPrice          = addonCheck ? (Number(addonCheck.dataset.addonPrice) || 9) : 9;
    let addonSelected       = addonCheck ? addonCheck.checked : false;

    function recalcPrice() {
      const perfumeSubtotal = activeBasePrice * currentQty;
      const addonSubtotal   = addonSelected ? (addonPrice * 1) : 0;
      const total           = perfumeSubtotal + addonSubtotal;
      const installment     = (total / 4).toFixed(2);

      if (livePriceFigure)   livePriceFigure.textContent   = total.toFixed(0);
      if (livePricePerMl)    livePricePerMl.textContent    = `($${activePerMl.toFixed(2)} / ml)`;
      if (installmentFigure) installmentFigure.textContent = `$${installment}`;
      if (btnPriceSummary)   btnPriceSummary.textContent   = `— $${total.toFixed(2)}`;
    }

    // Run initial recalc to reflect correct page price
    recalcPrice();

    sizeSelectBtns.forEach(btn => {
      if (btn.id === 'engravingToggleBtn') return;
      btn.addEventListener('click', () => {
        sizeSelectBtns.forEach(b => { if (b.id !== 'engravingToggleBtn') b.classList.remove('active'); });
        btn.classList.add('active');
        activeSize      = btn.dataset.size || '50';
        activeBasePrice = Number(btn.dataset.price) || 185;
        activePerMl     = parseFloat(btn.dataset.perMl) || 3.70;
        if (selectedSizeText) selectedSizeText.textContent = `${activeSize} ML`;
        recalcPrice();
      });
    });

    if (engravingToggleBtn && engravingBox) {
      engravingToggleBtn.addEventListener('click', () => {
        engravingBox.style.display = engravingBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (addonCheck) {
      addonCheck.addEventListener('change', () => {
        addonSelected = addonCheck.checked;
        addonPrice = Number(addonCheck.dataset.addonPrice) || 9;
        recalcPrice();
      });
    }

    if (qtyMinus && qtyPlus && qtyVal) {
      qtyMinus.addEventListener('click', () => {
        if (currentQty > 1) { currentQty--; qtyVal.textContent = currentQty; recalcPrice(); }
      });
      qtyPlus.addEventListener('click', () => {
        if (currentQty < 10) { currentQty++; qtyVal.textContent = currentQty; recalcPrice(); }
      });
    }

    // ─── Add to Cart & Buy Now (Product Page) ───
    const productAddToCartBtn = document.getElementById('productAddToCartBtn');
    const productBuyNowBtn    = document.getElementById('productBuyNowBtn');

    function getCurrentProductName() {
      const h1 = document.querySelector('.product-title-name');
      if (!h1) return 'Aurélia Nuit Dorée';
      let name = '';
      h1.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) name += node.textContent;
      });
      name = name.trim();
      if (!name) {
        name = h1.textContent.replace('EXTRAIT', '').replace('EAU DE PARFUM', '').trim();
      }
      return name || 'Aurélia Nuit Dorée';
    }

    function addCurrentSelectionToCart() {
      const currentName  = getCurrentProductName();
      const currentImage = mainProductImg?.getAttribute('src') || 'assets/product-rose-bottle.png';

      // 1. Add / update perfume item in cart
      const existing = cart.find(i => i.name === currentName && i.size === activeSize);
      if (existing) {
        existing.quantity += currentQty;
        existing.price = activeBasePrice;
        existing.selected = true;
      } else {
        cart.push({
          name:     currentName,
          size:     activeSize,
          price:    activeBasePrice,
          image:    currentImage,
          quantity: currentQty,
          selected: true
        });
      }

      // 2. Add extra item if selected (as separate item with its own $9.00 price)
      if (addonSelected) {
        const addonName = 'Majestic Set – 5 Mini Perfume';
        const existingAddon = cart.find(i => i.name === addonName);
        if (existingAddon) {
          existingAddon.quantity += 1;
          existingAddon.selected = true;
        } else {
          cart.push({
            name:     addonName,
            size:     '5x5',
            price:    addonPrice,
            image:    'assets/mini-set-thumb.png',
            quantity: 1,
            selected: true
          });
        }
      }

      saveCart(cart);
      renderCart();
    }

    function handleAddToCart() {
      addCurrentSelectionToCart();
      const currentName = getCurrentProductName();
      showToast(`${currentName} (${activeSize}ml) added to bag`);

      if (productAddToCartBtn) {
        const btnText = productAddToCartBtn.querySelector('.btn-text');
        if (btnText) {
          btnText.textContent = '✓ ADDED';
          setTimeout(() => { btnText.textContent = 'ADD TO CART'; }, 1800);
        }
      }
    }

    // Buy Now Flow: Skips cart entirely, does not alter cart, creates direct session for only this product
    function handleBuyNow(e) {
      if (e) e.preventDefault();

      const currentName  = getCurrentProductName();
      const currentImage = mainProductImg?.getAttribute('src') || 'assets/product-rose-bottle.png';

      const buyNowItems = [
        {
          name:     currentName,
          size:     activeSize,
          price:    activeBasePrice,
          image:    currentImage,
          quantity: currentQty
        }
      ];

      if (addonSelected) {
        buyNowItems.push({
          name:     'Majestic Set – 5 Mini Perfume',
          size:     '5x5',
          price:    addonPrice,
          image:    'assets/mini-set-thumb.png',
          quantity: 1
        });
      }

      const buyNowSession = {
        type: 'buy_now',
        items: buyNowItems
      };

      // Set checkout session for ONLY this product
      localStorage.setItem('majesticCheckoutSession', JSON.stringify(buyNowSession));

      // CART IS NOT TOUCHED!
      window.location.href = 'checkout.html';
    }

    if (productAddToCartBtn) productAddToCartBtn.addEventListener('click', handleAddToCart);
    if (productBuyNowBtn)    productBuyNowBtn.addEventListener('click', handleBuyNow);

    // ─── Accordion Toggle ───
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item  = trigger.closest('.accordion-item');
        const panel = item.querySelector('.accordion-panel');
        const icon  = trigger.querySelector('.accordion-icon');
        const isOpen = item.classList.contains('active');

        if (isOpen) {
          item.classList.remove('active');
          panel.style.display = 'none';
          trigger.setAttribute('aria-expanded', 'false');
          if (icon) icon.textContent = '+';
        } else {
          item.classList.add('active');
          panel.style.display = 'block';
          trigger.setAttribute('aria-expanded', 'true');
          if (icon) icon.textContent = '−';
        }
      });
    });

    // ─── Similar Products: Add-to-Cart + Size Pills ───
    document.querySelectorAll('.similar-grid .perfume-card').forEach(card => {
      const sizePills = card.querySelectorAll('.size-pill');
      const priceEl   = card.querySelector('.card-price');
      const perMlEl   = card.querySelector('.card-price-per-ml');

      sizePills.forEach(pill => {
        pill.addEventListener('click', () => {
          sizePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          if (priceEl)  priceEl.textContent  = `$${pill.dataset.price}`;
          if (perMlEl) perMlEl.textContent = `($${pill.dataset.perMl} / ml)`;
        });
      });

      const addBtn = card.querySelector('.card-add-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const name       = card.querySelector('.card-name')?.textContent.trim() || 'Perfume';
          const activePill = card.querySelector('.size-pill.active');
          const size       = activePill?.dataset.size || '50';
          const price      = Number(activePill?.dataset.price) || 185;
          const img        = card.querySelector('.card-bottle-img')?.src || '';

          const existing = cart.find(i => i.name === name && i.size === size);
          if (existing) { existing.quantity += 1; }
          else          { cart.push({ name, size, price, image: img, quantity: 1 }); }

          saveCart(cart);
          renderCart();
          showToast(`${name} (${size}ml) added to bag`);

          addBtn.textContent = '✓ ADDED TO BAG';
          addBtn.style.background = '#111111';
          addBtn.style.color = '#ffffff';
          setTimeout(() => {
            addBtn.textContent = 'ADD TO CART';
            addBtn.style.background = '';
            addBtn.style.color = '';
          }, 1400);
        });
      }
    });

    // ─── Similar Products: Click bottle/title to inspect at top ───
    document.querySelectorAll('.similar-card-link').forEach(link => {
      link.addEventListener('click', e => {
        const targetHref = link.getAttribute('href');
        if (targetHref && (targetHref.endsWith('.html') || targetHref.includes('.html'))) {
          return; // Let standard navigation happen
        }
        e.preventDefault();
        const card = link.closest('.perfume-card');
        if (!card) return;
        const name = card.querySelector('.card-name')?.textContent.trim();
        const img = card.querySelector('.card-bottle-img')?.getAttribute('src');
        const activePill = card.querySelector('.size-pill.active');
        const price = Number(activePill?.dataset.price) || 185;
        const perMl = parseFloat(activePill?.dataset.perMl) || 3.70;
        const size = activePill?.dataset.size || '50';

        if (mainProductImg && img) {
          mainProductImg.style.opacity = '0';
          mainProductImg.style.transform = 'scale(0.97)';
          setTimeout(() => {
            mainProductImg.src = img;
            mainProductImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            mainProductImg.style.opacity = '1';
            mainProductImg.style.transform = 'scale(1)';
          }, 180);
        }
        const titleEl = document.querySelector('.product-title-name');
        if (titleEl && name) {
          titleEl.innerHTML = `${name} <span class="product-edition-pill">EXTRAIT</span>`;
        }
        activeBasePrice = price;
        activePerMl = perMl;
        activeSize = size;
        if (selectedSizeText) selectedSizeText.textContent = `${activeSize} ML`;
        recalcPrice();

        const breadcrumbLast = document.querySelector('.product-breadcrumb li[aria-current="page"]');
        if (breadcrumbLast && name) breadcrumbLast.textContent = name;

        const hero = document.getElementById('productHero');
        if (hero) {
          hero.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

  } // end isProductPage

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECKOUT PAGE ONLY
  // ═══════════════════════════════════════════════════════════════════════════

  if (isCheckoutPage) {

    // ─── Retrieve items for checkout from active session (or cart selection) ───
    let checkoutSession = null;
    try {
      checkoutSession = JSON.parse(localStorage.getItem('majesticCheckoutSession') || 'null');
    } catch (e) {
      checkoutSession = null;
    }

    let checkoutItems = [];
    if (checkoutSession && Array.isArray(checkoutSession.items) && checkoutSession.items.length > 0) {
      // Flow 1 (Buy Now): Contains ONLY the single product + its optional add-on
      // Flow 2 (Cart Checkout): Contains ONLY the items selected with checkboxes in cart
      checkoutItems = checkoutSession.items;
    } else {
      // Direct navigation fallback: only selected items in cart
      const selected = cart.filter(i => i.selected !== false);
      checkoutItems = selected.length > 0 ? selected : cart;
    }

    const summaryArea     = document.querySelector('.checkout-summary-card');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal    = document.getElementById('summaryTotal');
    const submitOrderBtn  = document.getElementById('submitOrderBtn');
    const discountRow     = document.getElementById('discountRow');
    const discountAmount  = document.getElementById('discountAmount');

    let checkoutTotal = 0;
    let discountApplied = false;

    function buildCheckoutSummary() {
      // Replace the hardcoded item row area
      const existingRows = document.querySelectorAll('.summary-item-row');
      existingRows.forEach(r => r.remove());

      const perksBlock = document.querySelector('.summary-perks-list');

      if (!checkoutItems || checkoutItems.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'padding: 24px 0; text-align: center; font-size: 16px; color: #666;';
        emptyMsg.innerHTML = `
          <p style="margin-bottom: 16px;">No items selected for checkout.</p>
          <a href="index.html#best-of-month" style="font-weight:700; color:#111; text-decoration:underline;">
            Discover Bestsellers →
          </a>`;
        if (perksBlock && summaryArea) {
          summaryArea.insertBefore(emptyMsg, perksBlock);
        }
        checkoutTotal = 0;
        updateCheckoutTotals();
        return;
      }

      checkoutTotal = 0;
      const fragment = document.createDocumentFragment();

      checkoutItems.forEach(item => {
        checkoutTotal += item.price * item.quantity;
        const row = document.createElement('div');
        row.className = 'summary-item-row';
        const metaText = item.size === '5x5' ? '5x5ml Discovery Box • Maison Set' : `${item.size} ML Flacon • Extrait de Parfum`;
        row.innerHTML = `
          <div class="summary-item-img-wrap">
            <img src="${item.image}" alt="${item.name}" class="summary-item-img" />
            <span class="summary-item-qty">${item.quantity}</span>
          </div>
          <div class="summary-item-desc">
            <h4>${item.name}</h4>
            <p>${metaText}</p>
            <span class="summary-item-badge">Grasse Signature Edition</span>
          </div>
          <div class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</div>`;
        fragment.appendChild(row);
      });

      const titleEl = summaryArea.querySelector('.summary-card-title');
      if (titleEl && perksBlock) {
        summaryArea.insertBefore(fragment, perksBlock);
      }

      updateCheckoutTotals();
    }

    function updateCheckoutTotals() {
      const discAmt = discountApplied ? checkoutTotal * 0.10 : 0;
      const finalTotal = checkoutTotal - discAmt;

      if (summarySubtotal) summarySubtotal.textContent = `$${checkoutTotal.toFixed(2)}`;
      if (summaryTotal)    summaryTotal.textContent    = `$${finalTotal.toFixed(2)} USD`;
      if (submitOrderBtn)  {
        const span = submitOrderBtn.querySelector('span:last-child');
        if (span) span.textContent = `COMPLETE ORDER & PAY — $${finalTotal.toFixed(2)}`;
      }
      const klarnaStrong = document.querySelector('#klarnaPanel strong');
      if (klarnaStrong) klarnaStrong.textContent = `$${(finalTotal / 4).toFixed(2)}`;
    }

    buildCheckoutSummary();

    // ─── Voucher Code ───
    const voucherInput    = document.getElementById('voucherCodeInput');
    const applyVoucherBtn = document.getElementById('applyVoucherBtn');
    const voucherFeedback = document.getElementById('voucherFeedback');

    function showVoucherMsg(msg, success) {
      if (!voucherFeedback) return;
      voucherFeedback.textContent = msg;
      voucherFeedback.className = `voucher-feedback ${success ? 'success' : 'error'}`;
      voucherFeedback.style.display = 'block';
      if (!success) setTimeout(() => { voucherFeedback.style.display = 'none'; }, 4000);
    }

    if (applyVoucherBtn && voucherInput) {
      applyVoucherBtn.addEventListener('click', () => {
        const code = voucherInput.value.trim().toUpperCase();
        if (!code) { showVoucherMsg('Please enter a privilege code.', false); return; }
        if (discountApplied) { showVoucherMsg('A discount is already applied.', false); return; }
        if (code === 'MAJESTIC10') {
          discountApplied = true;
          const disc = checkoutTotal * 0.10;
          if (discountRow)   discountRow.style.display   = 'flex';
          if (discountAmount) discountAmount.textContent = `-$${disc.toFixed(2)}`;
          updateCheckoutTotals();
          showVoucherMsg('✓ MAJESTIC10 — 10% Privilege Discount Applied!', true);
          voucherInput.disabled       = true;
          applyVoucherBtn.textContent = 'APPLIED';
          applyVoucherBtn.disabled    = true;
        } else {
          showVoucherMsg('Invalid code. Try MAJESTIC10.', false);
        }
      });
    }

    // ─── Payment Tab Switching ───
    const payTabs      = document.querySelectorAll('.pay-tab');
    const cardPanel    = document.getElementById('cardPanel');
    const expressPanel = document.getElementById('expressPanel');
    const klarnaPanel  = document.getElementById('klarnaPanel');

    payTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        payTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        [cardPanel, expressPanel, klarnaPanel].forEach(p => { if (p) p.style.display = 'none'; });
        const target = tab.dataset.tab;
        if (target === 'card'    && cardPanel)    cardPanel.style.display    = 'block';
        if (target === 'express' && expressPanel) expressPanel.style.display = 'block';
        if (target === 'klarna'  && klarnaPanel)  klarnaPanel.style.display  = 'block';
      });
    });

    // ─── Save customer and full order on form submit ───
    const checkoutForm = document.getElementById('checkoutPaymentForm');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', () => {
        const first = document.getElementById('firstName')?.value || '';
        const last  = document.getElementById('lastName')?.value  || '';
        const addr  = document.getElementById('address')?.value   || '';
        const city  = document.getElementById('city')?.value      || '';
        const zip   = document.getElementById('postalCode')?.value || '';
        const country = document.getElementById('country')?.value  || '';

        const discAmt = discountApplied ? checkoutTotal * 0.10 : 0;
        const finalTotal = checkoutTotal - discAmt;
        const sessionType = checkoutSession?.type || 'cart';

        const orderData = {
          sessionType: sessionType,
          items: JSON.parse(JSON.stringify(checkoutItems)),
          subtotal: checkoutTotal,
          discount: discAmt,
          discountCode: discountApplied ? 'MAJESTIC10' : null,
          total: finalTotal,
          customerName: `${first} ${last}`.trim() || 'Éléonore Laurent',
          customerAddress: `${addr}, ${city} ${zip}, ${country}`,
          orderRef: '#MP-2026-' + Math.floor(1000 + Math.random() * 9000)
        };

        localStorage.setItem('majesticOrder', JSON.stringify(orderData));
        localStorage.setItem('customerName', orderData.customerName);
        localStorage.setItem('customerAddress', orderData.customerAddress);

        // Cart cleanup management:
        if (sessionType === 'cart') {
          // Remove ONLY the checked-out items from cart; unselected items STAY in cart!
          const purchasedKeys = new Set(checkoutItems.map(i => `${i.name}__${i.size}`));
          const remainingCart = cart.filter(item => !purchasedKeys.has(`${item.name}__${item.size}`));
          localStorage.setItem('majesticCart', JSON.stringify(remainingCart));
        }
        // If sessionType === 'buy_now', cart was never touched and remains completely untouched!

        // Clear active session
        localStorage.removeItem('majesticCheckoutSession');
      });
    }

  } // end isCheckoutPage

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRMATION PAGE ONLY
  // ═══════════════════════════════════════════════════════════════════════════

  if (isConfirmationPage) {

    let order = null;
    try {
      order = JSON.parse(localStorage.getItem('majesticOrder') || 'null');
    } catch (e) {
      order = null;
    }

    if (order && order.items && order.items.length > 0) {
      // 1. Order reference
      const orderRefEls = document.querySelectorAll('.order-ref-code');
      orderRefEls.forEach(el => el.textContent = order.orderRef || '#MP-2026-8891');

      // 2. Customer name & destination
      const customerNameEl = document.getElementById('confirmCustomerName');
      const addressEl      = document.getElementById('confirmAddress');
      const cityZipEl      = document.getElementById('confirmCityZip');

      if (customerNameEl && order.customerName) customerNameEl.textContent = order.customerName;
      if (addressEl && order.customerAddress) {
        const parts = order.customerAddress.split(',');
        addressEl.textContent = parts[0]?.trim() || '';
        if (cityZipEl && parts.length > 1) {
          cityZipEl.textContent = parts.slice(1).join(',').trim();
        }
      }

      // 3. Render purchased items into confirmItemsContainer
      const itemsContainer = document.getElementById('confirmItemsContainer');
      if (itemsContainer) {
        itemsContainer.innerHTML = order.items.map(item => {
          const sizeLabel = item.size === '5x5' ? '5x5ml Discovery Box' : `${item.size} ML Flacon`;
          return `
            <div class="confirm-item-row">
              <img src="${item.image}" alt="${item.name}" class="confirm-item-img" />
              <div class="confirm-item-details">
                <h3 class="confirm-item-name">${item.name}</h3>
                <p class="confirm-item-meta">${sizeLabel} • Qty: ${item.quantity}</p>
                <span class="confirm-item-edition">Grasse Signature Edition</span>
              </div>
              <div class="confirm-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>`;
        }).join('');
      }

      // 4. Breakdown Totals
      const subtotalEl = document.getElementById('confirmSubtotal');
      if (subtotalEl) subtotalEl.textContent = `$${order.subtotal.toFixed(2)}`;

      if (order.discount && order.discount > 0) {
        const discRow = document.getElementById('confirmDiscountRow');
        const discEl  = document.getElementById('confirmDiscount');
        if (discRow) discRow.style.display = 'flex';
        if (discEl)  discEl.textContent  = `-$${order.discount.toFixed(2)}`;
      }

      const totalPaidEl = document.getElementById('confirmTotalPaid');
      if (totalPaidEl) totalPaidEl.textContent = `$${order.total.toFixed(2)} USD`;
    }

  } // end isConfirmationPage

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME PAGE: Handle URL param for category (from product page search redirect)
  // ═══════════════════════════════════════════════════════════════════════════

  if (isHomePage) {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam  = urlParams.get('cat');
    if (catParam) {
      // Apply category filter from URL param
      setTimeout(() => {
        const filterPills = document.querySelectorAll('.filter-pill');
        filterPills.forEach(p => {
          if (p.getAttribute('data-filter') === catParam) p.click();
        });
        document.getElementById('best-of-month')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH: User localStorage Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  function loadUser() {
    try { return JSON.parse(localStorage.getItem('majesticUser') || 'null'); }
    catch (e) { return null; }
  }

  function saveUser(user) {
    localStorage.setItem('majesticUser', JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem('majesticUser');
  }

  function loadAllUsers() {
    try { return JSON.parse(localStorage.getItem('majesticUsers') || '[]'); }
    catch (e) { return []; }
  }

  function saveAllUsers(users) {
    localStorage.setItem('majesticUsers', JSON.stringify(users));
  }

  function getInitials(name) {
    if (!name) return 'MP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH: Navbar — Show login button or account dropdown depending on state
  // ═══════════════════════════════════════════════════════════════════════════

  function initNavbarAuth() {
    const user          = loadUser();
    const navLoginBtn   = document.getElementById('navLoginBtn');
    const navAccountWrap = document.getElementById('navAccountWrap');

    if (!navLoginBtn && !navAccountWrap) return; // page has no auth nav

    if (user) {
      // Logged in — show account wrap, hide login button
      if (navLoginBtn)    navLoginBtn.style.display    = 'none';
      if (navAccountWrap) navAccountWrap.style.display = 'inline-block';

      // Populate initials & name
      const initials = getInitials(user.name);
      const firstName = (user.name || '').split(' ')[0];

      const navAvatarInitials   = document.getElementById('navAvatarInitials');
      const navAccountName      = document.getElementById('navAccountName');
      const dropdownAvatarLarge = document.getElementById('dropdownAvatarLarge');
      const dropdownUserName    = document.getElementById('dropdownUserName');
      const dropdownUserEmail   = document.getElementById('dropdownUserEmail');

      if (navAvatarInitials)   navAvatarInitials.textContent   = initials;
      if (navAccountName)      navAccountName.textContent      = firstName;
      if (dropdownAvatarLarge) dropdownAvatarLarge.textContent = initials;
      if (dropdownUserName)    dropdownUserName.textContent    = user.name || '';
      if (dropdownUserEmail)   dropdownUserEmail.textContent   = user.email || '';
    } else {
      // Logged out — show login button, hide account wrap
      if (navLoginBtn)    navLoginBtn.style.display    = 'inline-flex';
      if (navAccountWrap) navAccountWrap.style.display = 'none';
    }

    // Dropdown toggle
    const navAccountBtn      = document.getElementById('navAccountBtn');
    const navAccountDropdown = document.getElementById('navAccountDropdown');

    if (navAccountBtn && navAccountDropdown) {
      navAccountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navAccountDropdown.classList.toggle('open');
        navAccountBtn.setAttribute('aria-expanded', String(isOpen));
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navAccountBtn.contains(e.target) && !navAccountDropdown.contains(e.target)) {
          navAccountDropdown.classList.remove('open');
          navAccountBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          navAccountDropdown.classList.remove('open');
          navAccountBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Logout button (dropdown)
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (dropdownLogoutBtn) {
      dropdownLogoutBtn.addEventListener('click', () => {
        clearUser();
        showToast('You have been logged out.');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      });
    }

    // Logout button (profile sidebar)
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener('click', () => {
        clearUser();
        showToast('You have been logged out.');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      });
    }
  }

  initNavbarAuth();

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH PAGE: auth.html — All form logic
  // ═══════════════════════════════════════════════════════════════════════════

  const isAuthPage = !!document.getElementById('loginView');

  if (isAuthPage) {

    // --- VIEW SWITCHING ---
    const loginView  = document.getElementById('loginView');
    const signupView = document.getElementById('signupView');
    const forgotView = document.getElementById('forgotView');
    const forgotSentCard  = document.getElementById('forgotSentCard');
    const authSuccessCard = document.getElementById('authSuccessCard');

    function showView(view) {
      [loginView, signupView, forgotView, forgotSentCard, authSuccessCard].forEach(v => {
        if (v) v.style.display = 'none';
      });
      if (view) view.style.display = 'block';
    }

    // Apply view from URL hash
    function applyHashView() {
      const hash = window.location.hash;
      if (hash === '#signup') showView(signupView);
      else if (hash === '#forgot') showView(forgotView);
      else showView(loginView);
    }
    applyHashView();
    window.addEventListener('hashchange', applyHashView);

    // Toggle links
    document.getElementById('gotoSignupLink')?.addEventListener('click', (e) => {
      e.preventDefault(); history.pushState(null, '', '#signup'); showView(signupView);
    });
    document.getElementById('gotoLoginLink')?.addEventListener('click', (e) => {
      e.preventDefault(); history.pushState(null, '', '#login'); showView(loginView);
    });
    document.getElementById('gotoForgotLink')?.addEventListener('click', (e) => {
      e.preventDefault(); history.pushState(null, '', '#forgot'); showView(forgotView);
    });
    document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
      e.preventDefault(); history.pushState(null, '', '#login'); showView(loginView);
    });
    document.getElementById('returnToLoginAfterSentBtn')?.addEventListener('click', () => {
      history.pushState(null, '', '#login'); showView(loginView);
    });

    // --- PASSWORD SHOW/HIDE ---
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const inp = document.getElementById(targetId);
        if (!inp) return;
        const isText = inp.type === 'text';
        inp.type = isText ? 'password' : 'text';
        btn.querySelector('.eye-open').style.display  = isText ? '' : 'none';
        btn.querySelector('.eye-closed').style.display = isText ? 'none' : '';
      });
    });

    // --- PASSWORD STRENGTH ---
    const signupPwdInput = document.getElementById('signupPassword');
    if (signupPwdInput) {
      signupPwdInput.addEventListener('input', () => {
        const val = signupPwdInput.value;
        const seg1 = document.getElementById('strengthSeg1');
        const seg2 = document.getElementById('strengthSeg2');
        const seg3 = document.getElementById('strengthSeg3');
        const lbl  = document.getElementById('strengthLabel');

        let strength = 0;
        if (val.length >= 8) strength++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
        if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) strength++;

        [seg1, seg2, seg3].forEach(s => {
          if (s) s.className = 'strength-segment';
        });

        if (val.length === 0) {
          if (lbl) lbl.textContent = 'Password strength';
          return;
        }
        if (strength === 1) {
          if (seg1) seg1.classList.add('active-weak');
          if (lbl) lbl.textContent = 'Weak — add uppercase, numbers or symbols';
        } else if (strength === 2) {
          if (seg1) seg1.classList.add('active-medium');
          if (seg2) seg2.classList.add('active-medium');
          if (lbl) lbl.textContent = 'Medium — almost there!';
        } else {
          if (seg1) seg1.classList.add('active-strong');
          if (seg2) seg2.classList.add('active-strong');
          if (seg3) seg3.classList.add('active-strong');
          if (lbl) lbl.textContent = 'Strong password ✓';
        }
      });
    }

    // --- HELPERS: Show field error ---
    function showFieldError(inputId, errorId, message) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errorId);
      if (inp) inp.classList.add('error');
      if (err) { if (message) err.textContent = message; err.classList.add('show'); }
    }
    function clearFieldError(inputId, errorId) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errorId);
      if (inp) inp.classList.remove('error');
      if (err) err.classList.remove('show');
    }
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    // --- LOGIN FORM ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldError('loginEmail', 'loginEmailError');
        clearFieldError('loginPassword', 'loginPasswordError');

        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        let valid = true;

        if (!isValidEmail(email)) {
          showFieldError('loginEmail', 'loginEmailError', 'Please enter a valid email address.');
          valid = false;
        }
        if (password.length < 6) {
          showFieldError('loginPassword', 'loginPasswordError', 'Password must be at least 6 characters.');
          valid = false;
        }
        if (!valid) return;

        // Check against stored users
        const allUsers = loadAllUsers();
        const matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (!matchedUser) {
          showFieldError('loginEmail', 'loginEmailError', 'No account found or incorrect password.');
          showFieldError('loginPassword', 'loginPasswordError', 'Please check your email and password.');
          return;
        }

        // Show loading
        const btn = document.getElementById('loginSubmitBtn');
        if (btn) btn.classList.add('loading');

        // Save session user (without password)
        const sessionUser = { name: matchedUser.name, email: matchedUser.email };
        saveUser(sessionUser);

        // Show success card
        setTimeout(() => {
          if (btn) btn.classList.remove('loading');
          const titleEl = document.getElementById('authSuccessTitle');
          const subEl   = document.getElementById('authSuccessSubtext');
          if (titleEl) titleEl.textContent = `Welcome back, ${matchedUser.name.split(' ')[0]}!`;
          if (subEl)   subEl.textContent   = 'Authenticating your private privileges. Redirecting…';
          showView(authSuccessCard);
          setTimeout(() => { window.location.href = 'index.html'; }, 1400);
        }, 900);
      });
    }

    // --- SIGN UP FORM ---
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldError('signupName', 'signupNameError');
        clearFieldError('signupEmail', 'signupEmailError');
        clearFieldError('signupPassword', 'signupPasswordError');
        clearFieldError('signupConfirmPassword', 'signupConfirmError');
        const termsErr = document.getElementById('termsError');
        if (termsErr) termsErr.classList.remove('show');

        const name     = document.getElementById('signupName').value.trim();
        const email    = document.getElementById('signupEmail').value.trim();
        const phone    = document.getElementById('signupPhone')?.value.trim() || '';
        const password = document.getElementById('signupPassword').value;
        const confirm  = document.getElementById('signupConfirmPassword').value;
        const terms    = document.getElementById('termsCheck').checked;
        let valid = true;

        if (!name || name.length < 2) {
          showFieldError('signupName', 'signupNameError', 'Please enter your full name.');
          valid = false;
        }
        if (!isValidEmail(email)) {
          showFieldError('signupEmail', 'signupEmailError', 'Please enter a valid email address.');
          valid = false;
        }
        if (password.length < 8) {
          showFieldError('signupPassword', 'signupPasswordError', 'Password must be at least 8 characters.');
          valid = false;
        }
        if (password !== confirm) {
          showFieldError('signupConfirmPassword', 'signupConfirmError', 'Passwords do not match.');
          valid = false;
        }
        if (!terms) {
          if (termsErr) { termsErr.textContent = 'You must accept the Terms & Privacy Policy.'; termsErr.classList.add('show'); }
          valid = false;
        }
        if (!valid) return;

        // Check if email already exists
        const allUsers = loadAllUsers();
        const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          showFieldError('signupEmail', 'signupEmailError', 'An account with this email already exists. Please log in.');
          return;
        }

        // Show loading
        const btn = document.getElementById('signupSubmitBtn');
        if (btn) btn.classList.add('loading');

        // Save new user (with hashed-enough password for demo)
        const newUser = { name, email, phone, password };
        allUsers.push(newUser);
        saveAllUsers(allUsers);

        // Save session
        saveUser({ name, email });

        setTimeout(() => {
          if (btn) btn.classList.remove('loading');
          const titleEl = document.getElementById('authSuccessTitle');
          const subEl   = document.getElementById('authSuccessSubtext');
          if (titleEl) titleEl.textContent = `Welcome to the Maison, ${name.split(' ')[0]}!`;
          if (subEl)   subEl.textContent   = 'Your account has been created. Redirecting to your boutique…';
          showView(authSuccessCard);
          setTimeout(() => { window.location.href = 'index.html'; }, 1400);
        }, 1000);
      });
    }

    // --- FORGOT PASSWORD FORM ---
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldError('forgotEmail', 'forgotEmailError');
        const email = document.getElementById('forgotEmail').value.trim();
        if (!isValidEmail(email)) {
          showFieldError('forgotEmail', 'forgotEmailError', 'Please enter a valid email address.');
          return;
        }
        const sentEmailEl = document.getElementById('sentEmailAddress');
        if (sentEmailEl) sentEmailEl.textContent = email;
        showView(forgotSentCard);
      });
    }

  } // end isAuthPage

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE PAGE: Tab switching & profile save
  // ═══════════════════════════════════════════════════════════════════════════

  const isProfilePage = !!document.querySelector('.profile-layout-grid');

  if (isProfilePage) {
    // Redirect to login if not logged in
    const user = loadUser();
    if (!user) {
      window.location.href = 'auth.html#login';
    }

    // Populate profile fields from stored user
    if (user) {
      const profName  = document.getElementById('profName');
      const profEmail = document.getElementById('profEmail');
      const sidebarUserName  = document.getElementById('sidebarUserName');
      const sidebarUserEmail = document.getElementById('sidebarUserEmail');
      const sidebarAvatar    = document.getElementById('sidebarAvatar');
      const editAvatarPreview = document.getElementById('editAvatarPreview');
      const initials = getInitials(user.name);
      if (profName)  profName.value  = user.name  || '';
      if (profEmail) profEmail.value = user.email || '';
      if (sidebarUserName)  sidebarUserName.textContent  = user.name  || '';
      if (sidebarUserEmail) sidebarUserEmail.textContent = user.email || '';
      if (sidebarAvatar)    sidebarAvatar.textContent    = initials;
      if (editAvatarPreview) editAvatarPreview.textContent = initials;
    }

    // Sidebar tab switching
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
      if (btn.id === 'sidebarLogoutBtn') return;
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        document.querySelectorAll('.profile-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.profile-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById('tab-' + target);
        if (pane) pane.classList.add('active');
      });
    });

    // Handle hash-based tab activation from dropdown links
    function activateTabFromHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const btn = document.querySelector(`.profile-nav-btn[data-tab="${hash}"]`);
        if (btn) btn.click();
      }
    }
    activateTabFromHash();

    // Fragrance chips
    document.querySelectorAll('.note-accord-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    // Profile save
    const profileDetailsForm = document.getElementById('profileDetailsForm');
    if (profileDetailsForm) {
      profileDetailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedName  = document.getElementById('profName')?.value.trim();
        const updatedEmail = document.getElementById('profEmail')?.value.trim();
        const currentUser = loadUser();
        if (currentUser) {
          currentUser.name  = updatedName  || currentUser.name;
          currentUser.email = updatedEmail || currentUser.email;
          saveUser(currentUser);
          showToast('Profile saved successfully.');
          initNavbarAuth(); // refresh navbar
        }
      });
    }
  }

}); // end DOMContentLoaded
