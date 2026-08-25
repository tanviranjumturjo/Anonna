/* ==========================================================================
   FOR ANONNA BRISTY - WEB AUDIO API SOUND SYNTHESIZER
   Harmonic unlock chimes & soft UI audio feedback
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

            // Soft romantic chord progression: F4 -> A4 -> C5 -> E5 (Fmaj7)
            const notes = [349.23, 440.00, 523.25, 659.25, 880.00];
            const now = ctx.currentTime;

            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + index * 0.08);

                gain.gain.setValueAtTime(0, now + index * 0.08);
                gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 1.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + index * 0.08);
                osc.stop(now + index * 0.08 + 1.2);
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
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.08);
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
