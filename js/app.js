/* ==========================================================================
   TANVIR & ANONNA'S DIARY - MAIN APPLICATION CONTROLLER
   Love letters: list view + romantic popup, filtering & navigation
   ========================================================================== */

(function () {
    const STORAGE_KEY = 'anonna_love_letters';

    let loveLetters = [];

    // DOM Elements
    const lettersGrid = document.getElementById('letters-grid');
    const filterTabBtns = document.querySelectorAll('.filter-tabs .tab-btn');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIcon = document.getElementById('sound-icon');
    const navLinks = document.querySelectorAll('.nav-link');

    // Letter Modal Elements
    const openLetterModalBtn = document.getElementById('open-letter-modal-btn');
    const letterModal = document.getElementById('letter-modal');
    const closeLetterBtn = document.getElementById('close-letter-btn');
    const cancelLetterBtn = document.getElementById('cancel-letter-btn');
    const letterForm = document.getElementById('letter-form');

    // Detail Popup
    const detailPopup = document.getElementById('detail-popup');
    const detailPopupContent = document.getElementById('detail-popup-content');
    const closeDetailPopup = document.getElementById('close-detail-popup');

    let currentFilter = 'all';

    function initApp() {
        loadLetters();
        renderLetters(currentFilter);
        setupFilterTabs();
        setupSoundToggle();
        setupScrollSpy();
        setupDaysCounter();
        setupLetterModal();
        setupDetailPopup();
    }

    function loadLetters() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                loveLetters = parsed.filter(l => !['let-1', 'let-2', 'let-3', 'let-4'].includes(l.id));
            } catch (e) {
                loveLetters = [];
            }
        } else {
            loveLetters = [];
            saveLetters();
        }
    }

    function saveLetters() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loveLetters));
    }

    function renderLetters(filterCategory) {
        currentFilter = filterCategory || 'all';
        if (!lettersGrid) return;
        lettersGrid.innerHTML = '';

        const filtered = currentFilter === 'all'
            ? loveLetters
            : loveLetters.filter(l => l.category === currentFilter);

        if (filtered.length === 0) {
            lettersGrid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.4rem; font-family: var(--font-heading); margin-bottom: 8px;">No love letters written yet 💌</p>
                    <p style="font-size: 0.95rem; margin-bottom: 20px;">Click the button above to write your first letter!</p>
                </div>
            `;
            return;
        }

        const list = document.createElement('div');
        list.className = 'item-list';

        filtered.forEach(letter => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-row-icon">💌</div>
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(letter.title)}</div>
                    <div class="item-row-sub">"${escapeHtml(letter.quote)}"</div>
                </div>
                <div class="item-row-meta">${escapeHtml(letter.categoryLabel || letter.category)}</div>
                <div class="item-row-actions"><button class="del-letter-btn" title="Delete">🗑️</button></div>
                <span class="item-row-arrow">→</span>
            `;

            row.addEventListener('click', (e) => {
                if (e.target.closest('.del-letter-btn')) return;
                openLetterPopup(letter);
            });

            row.querySelector('.del-letter-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                loveLetters = loveLetters.filter(l => l.id !== letter.id);
                saveLetters();
                renderLetters(currentFilter);
                SoundFX.playClickSound();
            });

            list.appendChild(row);
        });

        lettersGrid.appendChild(list);
    }

    function openLetterPopup(letter) {
        SoundFX.playClickSound();
        detailPopupContent.innerHTML = `
            <div class="popup-heart-decor">💕</div>
            <span class="popup-category">${escapeHtml(letter.categoryLabel || letter.category)}</span>
            <h2 class="popup-title">${escapeHtml(letter.title)}</h2>
            <p class="popup-quote">"${escapeHtml(letter.quote)}"</p>
            <div class="popup-body">${escapeHtml(letter.body)}</div>
            <p class="popup-sign">— ${escapeHtml(letter.sign)}</p>
        `;
        detailPopup.classList.remove('hidden');
    }

    function setupDetailPopup() {
        if (closeDetailPopup) {
            closeDetailPopup.addEventListener('click', () => {
                detailPopup.classList.add('hidden');
            });
        }
        if (detailPopup) {
            detailPopup.addEventListener('click', (e) => {
                if (e.target === detailPopup) detailPopup.classList.add('hidden');
            });
        }
    }

    function setupLetterModal() {
        if (openLetterModalBtn) {
            openLetterModalBtn.addEventListener('click', () => {
                SoundFX.playClickSound();
                if (letterModal) letterModal.classList.remove('hidden');
            });
        }

        if (closeLetterBtn) closeLetterBtn.addEventListener('click', () => letterModal.classList.add('hidden'));
        if (cancelLetterBtn) cancelLetterBtn.addEventListener('click', () => letterModal.classList.add('hidden'));

        if (letterForm) {
            letterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('letter-title').value.trim();
                const category = document.getElementById('letter-category').value;
                const categorySelect = document.getElementById('letter-category');
                const categoryLabel = categorySelect.options[categorySelect.selectedIndex].text;
                const quote = document.getElementById('letter-quote').value.trim();
                const body = document.getElementById('letter-body').value.trim();
                const sign = document.getElementById('letter-sign').value.trim();

                if (!title || !quote || !body || !sign) return;

                const newLetter = {
                    id: 'let-' + Date.now(),
                    category: category,
                    categoryLabel: categoryLabel,
                    title: title,
                    quote: quote,
                    body: body,
                    sign: sign
                };

                loveLetters.unshift(newLetter);
                saveLetters();
                renderLetters(currentFilter);
                letterForm.reset();
                if (letterModal) letterModal.classList.add('hidden');
                SoundFX.playUnlockChime();
            });
        }
    }

    function setupFilterTabs() {
        filterTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                renderLetters(filter);
                SoundFX.playClickSound();
            });
        });
    }

    function setupSoundToggle() {
        if (!soundToggleBtn) return;
        soundToggleBtn.addEventListener('click', () => {
            const isEnabled = SoundFX.toggleSound();
            soundIcon.textContent = isEnabled ? '🔔' : '🔕';
            if (isEnabled) SoundFX.playUnlockChime();
        });
    }

    function setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset;
            sections.forEach(current => {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 120;
                const sectionId = current.getAttribute('id');

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    function setupDaysCounter() {
        const daysEl = document.getElementById('days-count');
        if (!daysEl) return;

        const startDate = new Date(2018, 4, 18);

        function calculateDays() {
            const now = new Date();
            return Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        }

        const target = calculateDays();
        let count = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
            count += step;
            if (count >= target) {
                count = target;
                clearInterval(timer);
            }
            daysEl.textContent = count.toLocaleString() + '+';
        }, 20);

        setInterval(() => {
            const fresh = calculateDays();
            daysEl.textContent = fresh.toLocaleString() + '+';
        }, 3600000);
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();
