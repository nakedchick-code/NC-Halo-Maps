/*
  NC Halo Maps
  Site for NakedChick's Halo: PC/CE custom maps.
  Site Developer: https://github.com/Chalwk/
*/

document.addEventListener('DOMContentLoaded', function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function debounce(fn, wait) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    /* ---------------------------------------------------------------
       Mobile navigation
       --------------------------------------------------------------- */
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    function setNavOpen(open) {
        if (!mainNav || !navToggle) return;
        mainNav.classList.toggle('show', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setNavOpen(!mainNav.classList.contains('show'));
        });

        document.addEventListener('click', (e) => {
            if (!mainNav.classList.contains('show')) return;
            if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
            setNavOpen(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('show')) {
                setNavOpen(false);
                navToggle.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) setNavOpen(false);
        });
    }

    /* ---------------------------------------------------------------
       Scroll-to-top button
       --------------------------------------------------------------- */
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.setAttribute('type', 'button');
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    document.body.appendChild(scrollBtn);

    let scrollTicking = false;
    function updateScrollBtn() {
        const visible = window.pageYOffset > 300;
        scrollBtn.classList.toggle('visible', visible);
        scrollTicking = false;
    }
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(updateScrollBtn);
    }, { passive: true });
    updateScrollBtn();

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    /* ---------------------------------------------------------------
       Copy-link buttons (used on the Maps page)
       --------------------------------------------------------------- */
    document.querySelectorAll('.copy-link-btn').forEach(btn => {
        const label = btn.querySelector('.copy-link-label');
        const defaultLabel = label ? label.textContent : 'Copy link';

        btn.addEventListener('click', async () => {
            const url = btn.dataset.url;
            if (!url) return;

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                } else {
                    const temp = document.createElement('textarea');
                    temp.value = url;
                    temp.setAttribute('readonly', '');
                    temp.style.position = 'fixed';
                    temp.style.opacity = '0';
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    document.body.removeChild(temp);
                }

                btn.classList.add('copied');
                if (label) label.textContent = 'Copied!';
                btn.setAttribute('aria-label', 'Link copied to clipboard');

                setTimeout(() => {
                    btn.classList.remove('copied');
                    if (label) label.textContent = defaultLabel;
                    btn.setAttribute('aria-label', 'Copy link');
                }, 2000);
            } catch (err) {
                // Clipboard access can fail (permissions, unsupported browser);
                // fail quietly rather than breaking the page.
            }
        });
    });

    /* ---------------------------------------------------------------
       Maps page: search, filter, sort, pagination
       --------------------------------------------------------------- */
    const searchInput = document.getElementById('map-search');
    const mapsGrid = document.getElementById('maps-grid');
    const searchEmpty = document.querySelector('.search-empty');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('map-sort');
    const pagination = document.getElementById('maps-pagination');

    if (!mapsGrid) return;

    const cards = Array.from(mapsGrid.querySelectorAll('.map-card'));
    const perPage = parseInt(mapsGrid.dataset.perPage, 10) || 0;

    const validFilters = ['all', 'PC', 'CE'];
    const validSorts = ['newest', 'oldest', 'name-asc', 'name-desc', 'downloads'];

    const initialParams = new URLSearchParams(window.location.search);

    let activeFilter = validFilters.includes(initialParams.get('game')) ? initialParams.get('game') : 'all';
    let currentSort = validSorts.includes(initialParams.get('sort')) ? initialParams.get('sort') : 'newest';
    let currentPage = Math.max(1, parseInt(initialParams.get('page'), 10) || 1);

    if (searchInput && initialParams.get('q')) {
        searchInput.value = initialParams.get('q');
    }

    filterButtons.forEach(btn => {
        const isActive = btn.dataset.filter === activeFilter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (sortSelect) {
        sortSelect.value = currentSort;
    }

    function getSortedCards() {
        const sorted = cards.slice();

        switch (currentSort) {
            case 'oldest':
                sorted.sort((a, b) => new Date(a.dataset.published) - new Date(b.dataset.published));
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
                break;
            case 'name-desc':
                sorted.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
                break;
            case 'downloads':
                sorted.sort((a, b) =>
                    (parseInt(b.dataset.downloads, 10) || 0) - (parseInt(a.dataset.downloads, 10) || 0)
                );
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.dataset.published) - new Date(a.dataset.published));
        }

        return sorted;
    }

    function cardMatches(card, query) {
        const nameMatches = !query || card.dataset.name.includes(query);
        const games = (card.dataset.games || '').split(',').filter(Boolean);
        const gameMatches = activeFilter === 'all' || games.includes(activeFilter);
        return nameMatches && gameMatches;
    }

    function renderPagination(totalPages) {
        if (!pagination) return;

        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        const makeButton = (label, targetPage, options = {}) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-btn' + (options.active ? ' active' : '');
            btn.textContent = label;
            if (options.disabled) btn.disabled = true;
            if (options.ariaLabel) btn.setAttribute('aria-label', options.ariaLabel);
            if (options.active) btn.setAttribute('aria-current', 'page');
            btn.addEventListener('click', () => {
                currentPage = targetPage;
                applyFilters(false);
                mapsGrid.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
            });
            return btn;
        };

        pagination.appendChild(
            makeButton('Prev', currentPage - 1, {
                disabled: currentPage === 1,
                ariaLabel: 'Previous page'
            })
        );

        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(
                makeButton(String(i), i, {
                    active: i === currentPage,
                    ariaLabel: `Page ${i}`
                })
            );
        }

        pagination.appendChild(
            makeButton('Next', currentPage + 1, {
                disabled: currentPage === totalPages,
                ariaLabel: 'Next page'
            })
        );
    }

    function updateUrl() {
        const query = searchInput ? searchInput.value.trim() : '';
        const params = new URLSearchParams();

        if (query) params.set('q', query);
        if (activeFilter !== 'all') params.set('game', activeFilter);
        if (currentSort !== 'newest') params.set('sort', currentSort);
        if (currentPage > 1) params.set('page', String(currentPage));

        const search = params.toString();
        const newUrl = window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
        window.history.replaceState(null, '', newUrl);
    }

    function applyFilters(resetPage) {
        if (resetPage) currentPage = 1;

        // Reorder the actual cards in the grid to match the chosen sort,
        // so the visual left-to-right, top-to-bottom order is correct.
        const sorted = getSortedCards();
        sorted.forEach(card => mapsGrid.appendChild(card));

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const matching = sorted.filter(card => cardMatches(card, query));

        const totalPages = perPage > 0 ? Math.max(1, Math.ceil(matching.length / perPage)) : 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = perPage > 0 ? (currentPage - 1) * perPage : 0;
        const end = perPage > 0 ? start + perPage : matching.length;
        const visibleOnPage = new Set(matching.slice(start, end));

        cards.forEach(card => {
            card.style.display = visibleOnPage.has(card) ? '' : 'none';
        });

        if (searchEmpty) {
            searchEmpty.hidden = matching.length !== 0;
        }

        renderPagination(totalPages);
        updateUrl();
    }

    // Navigate to the page containing the card referenced by the URL hash.
    function goToHashTarget() {
        if (!window.location.hash) return;
        const targetId = window.location.hash.substring(1); // strip '#'
        const targetCard = document.getElementById(targetId);
        if (!targetCard) return;

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const matching = getSortedCards().filter(card => cardMatches(card, query));
        const index = matching.indexOf(targetCard);

        if (index !== -1 && perPage > 0) {
            const targetPage = Math.floor(index / perPage) + 1;
            if (targetPage !== currentPage) {
                currentPage = targetPage;
                applyFilters(false); // do not reset the page
            }
        }

        targetCard.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center'
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => applyFilters(true), 150));
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            activeFilter = btn.dataset.filter;
            applyFilters(true);
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applyFilters(true);
        });
    }

    applyFilters(false);
    goToHashTarget();
    window.addEventListener('hashchange', goToHashTarget);
});