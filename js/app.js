/* ==========================================================================
   TANVIR & ANONNA'S DIARY - MAIN APPLICATION CONTROLLER (CLOUD EDITION)
   Love letters: Real-time Firebase sync, auto-date, reactions & popups
   ========================================================================== */

(function () {
    let loveLetters = [];
    let currentFilter = 'all';

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

    // Wait for the Firebase module to finish loading from index.html
    function waitForFirebase(callback) {
        if (window.db && window.fb) {
            callback();
        } else {
            setTimeout(() => waitForFirebase(callback), 100);
        }
    }

    function initApp() {
        waitForFirebase(() => {
            setupFirebaseListener();
            setupFilterTabs();
            setupSoundToggle();
            setupScrollSpy();
            setupDaysCounter();
            setupLetterModal();
            setupDetailPopup();
        });
    }

    function setupFirebaseListener() {
        const lettersRef = window.fb.ref(window.db, 'letters');
        
        // Listens to the cloud and updates the letters list instantly
        window.fb.onValue(lettersRef, (snapshot) => {
            const data = snapshot.val();
            loveLetters = [];
            
            if (data) {
                for (let key in data) {
                    loveLetters.push({
                        id: key, 
                        likes: 0,
                        broken: 0,
                        ...data[key]
                    });
                }
                // Sort by date added (newest first)
                loveLetters.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            }
            renderLetters(currentFilter);
        });
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
            const displayDate = formatDateStr(letter.timestamp);

            row.innerHTML = `
                <div class="item-row-icon">💌</div>
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(letter.title)}</div>
                    <div class="item-row-sub">"${escapeHtml(letter.quote)}"</div>
                    <div class="item-row-date">${displayDate}</div>
                </div>
                <div class="item-row-reactions">
                    <button class="reaction-btn love-btn" title="Love">
                        ❤️ <span class="reaction-count">${letter.likes || 0}</span>
                    </button>
                    <button class="reaction-btn break-btn" title="Heartbreak">
                        💔 <span class="reaction-count">${letter.broken || 0}</span>
                    </button>
                </div>
                <div class="item-row-actions">
                    <button class="del-letter-btn" title="Delete">🗑️</button>
                </div>
                <span class="item-row-arrow">→</span>
            `;

            row.addEventListener('click', (e) => {
                if (e.target.closest('.reaction-btn') || e.target.closest('.del-letter-btn')) return;
                openLetterPopup(letter);
            });

            // Love reaction
            row.querySelector('.love-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newLikes = (letter.likes || 0) + 1;
                const ref = window.fb.ref(window.db, 'letters/' + letter.id + '/likes');
                window.fb.set(ref, newLikes);
                if (window.SoundFX) window.SoundFX.playHeartSound();
            });

            // Broken love reaction
            row.querySelector('.break-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newBroken = (letter.broken || 0) + 1;
                const ref = window.fb.ref(window.db, 'letters/' + letter.id + '/broken');
                window.fb.set(ref, newBroken);
                if (window.SoundFX) window.SoundFX.playBreakSound();
            });

            // Instant cloud delete
            row.querySelector('.del-letter-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const letterRef = window.fb.ref(window.db, 'letters/' + letter.id);
                window.fb.remove(letterRef);
                if (window.SoundFX) window.SoundFX.playClickSound();
            });

            list.appendChild(row);
        });

        lettersGrid.appendChild(list);
    }

    function openLetterPopup(letter) {
        if (window.SoundFX) window.SoundFX.playClickSound();
        const displayDate = formatDateStr(letter.timestamp);

        detailPopupContent.innerHTML = `
            <div class="popup-heart-decor">💕</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                <span class="popup-category">${escapeHtml(letter.categoryLabel || letter.category)}</span>
                <span class="popup-date-badge">${displayDate}</span>
            </div>
            <h2 class="popup-title">${escapeHtml(letter.title)}</h2>
            <p class="popup-quote">"${escapeHtml(letter.quote)}"</p>
            <div class="popup-body">${escapeHtml(letter.body)}</div>
            <p class="popup-sign">— ${escapeHtml(letter.sign)}</p>
            
            <div class="popup-reactions-bar">
                <button class="reaction-btn love-btn popup-love-btn">
                    ❤️ Love <span class="reaction-count">${letter.likes || 0}</span>
                </button>
                <button class="reaction-btn break-btn popup-break-btn">
                    💔 Heartbreak <span class="reaction-count">${letter.broken || 0}</span>
                </button>
            </div>
        `;

        const popLoveBtn = detailPopupContent.querySelector('.popup-love-btn');
        if (popLoveBtn) {
            popLoveBtn.addEventListener('click', () => {
                const newLikes = (letter.likes || 0) + 1;
                const ref = window.fb.ref(window.db, 'letters/' + letter.id + '/likes');
                window.fb.set(ref, newLikes);
                letter.likes = newLikes;
                popLoveBtn.querySelector('.reaction-count').textContent = newLikes;
                if (window.SoundFX) window.SoundFX.playHeartSound();
            });
        }

        const popBreakBtn = detailPopupContent.querySelector('.popup-break-btn');
        if (popBreakBtn) {
            popBreakBtn.addEventListener('click', () => {
                const newBroken = (letter.broken || 0) + 1;
                const ref = window.fb.ref(window.db, 'letters/' + letter.id + '/broken');
                window.fb.set(ref, newBroken);
                letter.broken = newBroken;
                popBreakBtn.querySelector('.reaction-count').textContent = newBroken;
                if (window.SoundFX) window.SoundFX.playBreakSound();
            });
        }

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
                if (window.SoundFX) window.SoundFX.playClickSound();
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
                    category: category,
                    categoryLabel: categoryLabel,
                    title: title,
                    quote: quote,
                    body: body,
                    sign: sign,
                    likes: 0,
                    broken: 0,
                    timestamp: new Date().toISOString()
                };

                // Push letter directly to Firebase
                const lettersRef = window.fb.ref(window.db, 'letters');
                window.fb.push(lettersRef, newLetter);

                letterForm.reset();
                if (letterModal) letterModal.classList.add('hidden');
                if (window.SoundFX) window.SoundFX.playUnlockChime();
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
                if (window.SoundFX) window.SoundFX.playClickSound();
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

        const startDate = new Date(2018, 4, 25);

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

    function formatDateStr(timestamp) {
        if (!timestamp) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) return timestamp;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();