/* ==========================================================================
   TANVIR & ANONNA'S DIARY - FIXED PASSWORD GATEWAY (SCREEN LOCK)
   Fixed passcode: "18-05-2018"
   ========================================================================== */

(function () {
    const HARDCODED_PASSCODE = "25-05-2018";

    const lockScreen = document.getElementById('lock-screen');
    const mainApp = document.getElementById('main-app');
    const lockForm = document.getElementById('lock-form');
    const passcodeInput = document.getElementById('passcode-input');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const errorMsg = document.getElementById('lock-error-msg');
    const hintToggleBtn = document.getElementById('hint-toggle-btn');
    const hintBox = document.getElementById('hint-box');
    const relockBtn = document.getElementById('relock-btn');

    // Quotes for lock screen ticker
    const lockQuotes = [
        '"Even when words are quiet, love speaks softly."',
        '"In your eyes, I found my quiet home."',
        '"Forever is not a distance, it\'s a promise with you."',
        '"You are my favorite thought in every quiet moment."'
    ];
    let quoteIndex = 0;

    function initLockScreen() {
        // Check if unlocked in current session
        if (sessionStorage.getItem('anonna_sanctuary_unlocked') === 'true') {
            unlockAppImmediately();
        }

        // Lock form submission
        if (lockForm) {
            lockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                attemptUnlock();
            });
        }

        // Toggle password visibility
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passcodeInput.type === 'password';
                passcodeInput.type = isPassword ? 'text' : 'password';
                togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
            });
        }

        // Hint button toggle
        if (hintToggleBtn) {
            hintToggleBtn.addEventListener('click', () => {
                hintBox.classList.toggle('hidden');
                SoundFX.playClickSound();
            });
        }

        // Relock application button
        if (relockBtn) {
            relockBtn.addEventListener('click', () => {
                relockApp();
            });
        }

        // Quote ticker rotation
        setInterval(() => {
            const quoteEl = document.getElementById('lock-quote');
            if (quoteEl) {
                quoteIndex = (quoteIndex + 1) % lockQuotes.length;
                quoteEl.style.opacity = '0';
                setTimeout(() => {
                    quoteEl.textContent = lockQuotes[quoteIndex];
                    quoteEl.style.opacity = '1';
                }, 400);
            }
        }, 5000);
    }

    function attemptUnlock() {
        const entered = passcodeInput.value.trim();

        if (entered === HARDCODED_PASSCODE) {
            // Success!
            errorMsg.classList.remove('visible');
            sessionStorage.setItem('anonna_sanctuary_unlocked', 'true');
            
            // Play harmonic chime
            SoundFX.playUnlockChime();

            // Animate lock screen fade out
            lockScreen.classList.add('unlocking');
            setTimeout(() => {
                lockScreen.classList.add('hidden');
                document.body.classList.remove('locked');
                mainApp.classList.remove('main-app-hidden');
                mainApp.classList.add('main-app-visible');
            }, 700);
        } else {
            // Failed
            errorMsg.classList.add('visible');
            SoundFX.playErrorSound();
            passcodeInput.classList.add('shake');
            setTimeout(() => passcodeInput.classList.remove('shake'), 500);
        }
    }

    function unlockAppImmediately() {
        if (lockScreen && mainApp) {
            lockScreen.classList.add('hidden');
            document.body.classList.remove('locked');
            mainApp.classList.remove('main-app-hidden');
            mainApp.classList.add('main-app-visible');
        }
    }

    function relockApp() {
        sessionStorage.removeItem('anonna_sanctuary_unlocked');
        SoundFX.playClickSound();
        if (passcodeInput) passcodeInput.value = '';
        if (mainApp && lockScreen) {
            mainApp.classList.remove('main-app-visible');
            mainApp.classList.add('main-app-hidden');
            lockScreen.classList.remove('hidden', 'unlocking');
            document.body.classList.add('locked');
        }
    }

    document.addEventListener('DOMContentLoaded', initLockScreen);
})();
