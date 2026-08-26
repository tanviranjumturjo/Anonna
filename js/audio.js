/* ==========================================================================
   FOR ANONNA BRISTY - WEB AUDIO API SOUND SYNTHESIZER
   Harmonic unlock chimes, reaction sounds & soft UI audio feedback
   ========================================================================== */

const SoundFX = (function () {
    let audioCtx = null;
    let enabled = true;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Attach global button click sounds for any button in the app
    function attachGlobalClickSounds() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .btn, .nav-link, .tab-btn, .color-option');
            if (target && enabled) {
                // If it's a heart or break button, they trigger their own custom sounds
                if (target.classList.contains('love-btn') || target.classList.contains('break-btn')) {
                    return;
                }
                // Play general crisp click
                getAudioContext();
                SoundFX.playClickSound();
            }
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachGlobalClickSounds);
    } else {
        attachGlobalClickSounds();
    }

    return {
        toggleSound: function () {
            enabled = !enabled;
            return enabled;
        },

        isEnabled: function () {
            return enabled;
        },

        playUnlockChime: function () {
            if (!enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            // Celestial romantic chord progression: C5 -> E5 -> G5 -> B5 -> C6 -> E6 (Cmaj7/9)
            const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
            const now = ctx.currentTime;

            // Main harmonic bells
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + index * 0.09);

                gain.gain.setValueAtTime(0, now + index * 0.09);
                gain.gain.linearRampToValueAtTime(0.15, now + index * 0.09 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 1.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + index * 0.09);
                osc.stop(now + index * 0.09 + 1.6);
            });

            // Sparkling heavenly shimmer overtones
            [1567.98, 2093.00, 2637.02].forEach((freq, index) => {
                const shimmerOsc = ctx.createOscillator();
                const shimmerGain = ctx.createGain();

                shimmerOsc.type = 'triangle';
                shimmerOsc.frequency.setValueAtTime(freq, now + 0.35 + index * 0.08);

                shimmerGain.gain.setValueAtTime(0, now + 0.35 + index * 0.08);
                shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.35 + index * 0.08 + 0.04);
                shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + index * 0.08 + 1.2);

                shimmerOsc.connect(shimmerGain);
                shimmerGain.connect(ctx.destination);

                shimmerOsc.start(now + 0.35 + index * 0.08);
                shimmerOsc.stop(now + 0.35 + index * 0.08 + 1.2);
            });
        },

        playHeartSound: function () {
            if (!enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            // Sweet romantic ascending love chord: F5 -> A5 -> C6
            const notes = [698.46, 880.00, 1046.50];
            const now = ctx.currentTime;

            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + index * 0.05);

                gain.gain.setValueAtTime(0, now + index * 0.05);
                gain.gain.linearRampToValueAtTime(0.12, now + index * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.05 + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + index * 0.05);
                osc.stop(now + index * 0.05 + 0.6);
            });
        },

        playBreakSound: function () {
            if (!enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            // Gentle delicate descending glass chime: E5 -> C5 -> A4
            const notes = [659.25, 523.25, 440.00];
            const now = ctx.currentTime;

            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + index * 0.06);

                gain.gain.setValueAtTime(0, now + index * 0.06);
                gain.gain.linearRampToValueAtTime(0.09, now + index * 0.06 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.06 + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + index * 0.06);
                osc.stop(now + index * 0.06 + 0.5);
            });
        },

        playClickSound: function () {
            if (!enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.07);

            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.07);
        },

        playErrorSound: function () {
            if (!enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(196, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    };
})();
