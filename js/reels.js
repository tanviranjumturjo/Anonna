/* ==========================================================================
   FOR ANONNA BRISTY - INSTAGRAM REELS SHOWCASE
   ========================================================================== */

const ReelsModule = (function () {
    const STORAGE_KEY = 'anonna_reels_links';

    const defaultReels = [];

    let reels = [];

    // DOM Elements
    const reelsGrid = document.getElementById('reels-grid');
    const openReelModalBtn = document.getElementById('open-reel-modal-btn');
    const reelModal = document.getElementById('reel-modal');
    const closeReelBtn = document.getElementById('close-reel-btn');
    const cancelReelBtn = document.getElementById('cancel-reel-btn');
    const reelForm = document.getElementById('reel-form');

    // Player Modal Elements
    const reelPlayerModal = document.getElementById('reel-player-modal');
    const closeReelPlayerBtn = document.getElementById('close-reel-player-btn');
    const reelPlayerTitle = document.getElementById('reel-player-title');
    const reelPlayerCaption = document.getElementById('reel-player-caption');
    const reelPlayerContainer = document.getElementById('reel-player-container');
    const reelExternalLink = document.getElementById('reel-external-link');

    function init() {
        loadReels();
        renderReels();
        setupEventListeners();
    }

    function loadReels() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out any leftover pre-given reel IDs
                reels = parsed.filter(r => !['reel-1', 'reel-2', 'reel-3'].includes(r.id));
            } catch (e) {
                reels = [];
            }
        } else {
            reels = [];
            saveReels();
        }
    }

    function saveReels() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reels));
    }

    function renderReels() {
        if (!reelsGrid) return;
        reelsGrid.innerHTML = '';

        if (reels.length === 0) {
            reelsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.4rem; font-family: var(--font-heading); margin-bottom: 8px;">No reels added yet 🎬</p>
                    <p style="font-size: 0.95rem; margin-bottom: 20px;">Click the button below to add your favorite Instagram Reel link!</p>
                    <button class="btn btn-secondary" onclick="document.getElementById('open-reel-modal-btn').click()">Add New Reel Link 🎬</button>
                </div>
            `;
            return;
        }

        reels.forEach(reel => {
            const card = document.createElement('div');
            card.className = 'reel-card glass-card';
            card.innerHTML = `
                <div class="reel-thumbnail-wrapper">
                    <img src="${reel.thumb}" alt="${escapeHtml(reel.title)}">
                    <div class="reel-play-overlay">
                        <div class="play-icon-glow">▶</div>
                    </div>
                </div>
                <div class="reel-info">
                    <div>
                        <h3 class="reel-title">${escapeHtml(reel.title)}</h3>
                        <p class="reel-caption">${escapeHtml(reel.caption)}</p>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span style="font-size: 0.75rem; color: var(--accent-blush);">Instagram Reel ✨</span>
                        <button class="btn btn-outline btn-sm delete-reel-btn" data-id="${reel.id}">Delete</button>
                    </div>
                </div>
            `;

            // Open reel player on click thumbnail
            card.querySelector('.reel-thumbnail-wrapper').addEventListener('click', () => {
                openReelPlayer(reel);
            });

            // Delete reel button
            card.querySelector('.delete-reel-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                reels = reels.filter(r => r.id !== reel.id);
                saveReels();
                renderReels();
                SoundFX.playClickSound();
            });

            reelsGrid.appendChild(card);
        });
    }

    function openReelPlayer(reel) {
        SoundFX.playClickSound();
        reelPlayerTitle.textContent = reel.title;
        reelPlayerCaption.textContent = reel.caption;
        reelExternalLink.href = reel.url;

        // Clean embed format or fallback preview
        let cleanUrl = reel.url;
        if (!cleanUrl.endsWith('/')) cleanUrl += '/';
        const embedUrl = cleanUrl + 'embed/';

        reelPlayerContainer.innerHTML = `
            <iframe src="${embedUrl}" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no"></iframe>
        `;

        reelPlayerModal.classList.remove('hidden');
    }

    function setupEventListeners() {
        if (openReelModalBtn) {
            openReelModalBtn.addEventListener('click', () => {
                SoundFX.playClickSound();
                reelModal.classList.remove('hidden');
            });
        }

        if (closeReelBtn) closeReelBtn.addEventListener('click', () => reelModal.classList.add('hidden'));
        if (cancelReelBtn) cancelReelBtn.addEventListener('click', () => reelModal.classList.add('hidden'));
        if (closeReelPlayerBtn) {
            closeReelPlayerBtn.addEventListener('click', () => {
                reelPlayerModal.classList.add('hidden');
                reelPlayerContainer.innerHTML = '';
            });
        }

        if (reelForm) {
            reelForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const url = document.getElementById('reel-url').value.trim();
                const title = document.getElementById('reel-title').value.trim();
                const caption = document.getElementById('reel-caption').value.trim();

                if (!url || !title || !caption) return;

                const newReel = {
                    id: 'reel-' + Date.now(),
                    title: title,
                    caption: caption,
                    url: url,
                    thumb: 'assets/images/memory1.jpg' // Default thumbnail placeholder
                };

                reels.unshift(newReel);
                saveReels();
                renderReels();
                reelForm.reset();
                reelModal.classList.add('hidden');
                SoundFX.playUnlockChime();
            });
        }
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
