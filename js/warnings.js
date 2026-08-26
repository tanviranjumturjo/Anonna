/* ==========================================================================
   TANVIR & ANONNA'S DIARY - MUTUAL WARNINGS CONTROLLER (CLOUD REAL-TIME)
   Real-time warnings, 1-5 severity levels, auto-date & cloud sync
   ========================================================================== */

const WarningsModule = (function () {
    let warnings = [];

    // DOM Elements
    const warningsList = document.getElementById('warnings-list');
    const warningForm = document.getElementById('warning-form');
    const warningTextInput = document.getElementById('warning-text');
    const warningLevelInput = document.getElementById('warning-level');
    const warningAuthorInput = document.getElementById('warning-author');
    const toggleAddWarningBtn = document.getElementById('toggle-add-warning-btn');
    const warningFormContainer = document.getElementById('warning-form-container');

    // Wait for Firebase
    function waitForFirebase(callback) {
        if (window.db && window.fb) {
            callback();
        } else {
            setTimeout(() => waitForFirebase(callback), 100);
        }
    }

    function init() {
        waitForFirebase(() => {
            setupFirebaseListener();
            setupEventListeners();
        });
    }

    function setupFirebaseListener() {
        const warningsRef = window.fb.ref(window.db, 'warnings');

        window.fb.onValue(warningsRef, (snapshot) => {
            const data = snapshot.val();
            warnings = [];

            if (data) {
                for (let key in data) {
                    warnings.push({
                        id: key,
                        level: 5,
                        ...data[key]
                    });
                }
                // Sort by date (newest first)
                warnings.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            }
            renderWarnings();
        });
    }

    function renderWarnings() {
        if (!warningsList) return;
        warningsList.innerHTML = '';

        if (warnings.length === 0) {
            warningsList.innerHTML = `
                <div class="empty-warnings">
                    <p>🌸 No active warnings right now. All peace & love!</p>
                </div>
            `;
            return;
        }

        warnings.forEach(item => {
            const el = document.createElement('div');
            const lvl = parseInt(item.level, 10) || 1;
            el.className = `warning-item warning-level-${lvl}`;
            const dateStr = formatDateStr(item.timestamp);

            const levelMeta = getLevelMeta(lvl);

            el.innerHTML = `
                <div class="warning-item-header">
                    <span class="warning-level-badge level-${lvl}">${levelMeta.icon} Level ${lvl}: ${levelMeta.label}</span>
                    <span class="warning-date">${dateStr}</span>
                    <button class="delete-warning-btn" title="Dismiss Warning">🗑️</button>
                </div>
                <p class="warning-body">"${escapeHtml(item.text)}"</p>
                <div class="warning-author-tag">— From ${escapeHtml(item.author || 'Tanvir')}</div>
            `;

            // Delete warning
            el.querySelector('.delete-warning-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const itemRef = window.fb.ref(window.db, 'warnings/' + item.id);
                window.fb.remove(itemRef);
                if (window.SoundFX) window.SoundFX.playClickSound();
            });

            warningsList.appendChild(el);
        });
    }

    function getLevelMeta(lvl) {
        switch (lvl) {
            case 5: return { icon: '🚨', label: 'CRITICAL' };
            case 4: return { icon: '⚠️', label: 'HIGH' };
            case 3: return { icon: '⚡', label: 'MODERATE' };
            case 2: return { icon: '💛', label: 'MILD' };
            case 1:
            default: return { icon: '🌸', label: 'GENTLE' };
        }
    }

    function setupEventListeners() {
        if (toggleAddWarningBtn && warningFormContainer) {
            toggleAddWarningBtn.addEventListener('click', () => {
                warningFormContainer.classList.toggle('hidden');
                const isHidden = warningFormContainer.classList.contains('hidden');
                toggleAddWarningBtn.textContent = isHidden ? '➕ Add Warning' : '✖ Close';
                if (window.SoundFX) window.SoundFX.playClickSound();
            });
        }

        if (warningForm) {
            warningForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = warningTextInput.value.trim();
                const level = parseInt(warningLevelInput.value, 10) || 3;
                const author = warningAuthorInput.value.trim() || 'Tanvir';

                if (!text) return;

                const newWarning = {
                    text: text.slice(0, 500),
                    level: Math.min(5, Math.max(1, level)),
                    author: author.slice(0, 80),
                    timestamp: new Date().toISOString()
                };

                const warningsRef = window.fb.ref(window.db, 'warnings');
                window.fb.push(warningsRef, newWarning);

                warningTextInput.value = '';
                if (warningFormContainer) warningFormContainer.classList.add('hidden');
                if (toggleAddWarningBtn) toggleAddWarningBtn.textContent = '➕ Add Warning';

                if (window.SoundFX) window.SoundFX.playLockSound();
            });
        }
    }

    function formatDateStr(timestamp) {
        if (!timestamp) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) return timestamp;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g, '&#x60;');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        renderWarnings: renderWarnings
    };
})();
