/* ==========================================================================
   FOR ANONNA BRISTY - TIME CAPSULE & MESSAGE BOARD (CLOUD EDITION)
   Interactive glowing notes, auto-timestamps, Love/Broken counters & real-time sync
   ========================================================================== */

const MessagesModule = (function () {
    let notes = [];

    // DOM Elements
    const notesGrid = document.getElementById('notes-grid');
    const noteForm = document.getElementById('note-form');
    const noteAuthorInput = document.getElementById('note-author');
    const noteTextInput = document.getElementById('note-text');

    // Wait for the Firebase module to finish loading from index.html
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
        const notesRef = window.fb.ref(window.db, 'notes');
        
        // This listens to the cloud. Any time a note is added or deleted, it auto-updates!
        window.fb.onValue(notesRef, (snapshot) => {
            const data = snapshot.val();
            notes = [];
            
            if (data) {
                // Convert Firebase object into an array
                for (let key in data) {
                    notes.push({
                        id: key, 
                        likes: 0,
                        broken: 0,
                        ...data[key]
                    });
                }
                // Sort by time (newest at the top)
                notes.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            }
            renderNotes();
        });
    }

    function renderNotes() {
        if (!notesGrid) return;
        notesGrid.innerHTML = '';

        if (notes.length === 0) {
            notesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <p>No notes written yet. Be the first to leave a whisper in the time capsule! ✍️</p>
                </div>
            `;
            return;
        }

        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = `sticky-note-card glow-${note.color || 'rose'} glass-card`;
            const displayDate = formatNoteDate(note.timestamp);

            card.innerHTML = `
                <p class="note-text">"${escapeHtml(note.text)}"</p>
                <div class="note-footer">
                    <div class="note-meta">
                        <span class="note-author">— ${escapeHtml(note.author)}</span>
                        <span class="note-time">📅 ${displayDate}</span>
                    </div>
                    <div class="note-actions">
                        <button class="reaction-btn love-btn note-love-btn" title="Love">
                            ❤️ <span class="reaction-count">${note.likes || 0}</span>
                        </button>
                        <button class="reaction-btn break-btn note-break-btn" title="Heartbreak">
                            💔 <span class="reaction-count">${note.broken || 0}</span>
                        </button>
                        <button class="delete-note-btn" title="Delete Note">🗑️</button>
                    </div>
                </div>
            `;

            // Love reaction
            card.querySelector('.note-love-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newLikes = (note.likes || 0) + 1; 
                const likeRef = window.fb.ref(window.db, 'notes/' + note.id + '/likes');
                window.fb.set(likeRef, newLikes);
                if (window.SoundFX) window.SoundFX.playHeartSound();
            });

            // Broken love reaction
            card.querySelector('.note-break-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newBroken = (note.broken || 0) + 1; 
                const breakRef = window.fb.ref(window.db, 'notes/' + note.id + '/broken');
                window.fb.set(breakRef, newBroken);
                if (window.SoundFX) window.SoundFX.playBreakSound();
            });

            // Delete note (Deletes instantly from the cloud)
            card.querySelector('.delete-note-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const noteRef = window.fb.ref(window.db, 'notes/' + note.id);
                window.fb.remove(noteRef);
                if (window.SoundFX) window.SoundFX.playClickSound();
            });

            notesGrid.appendChild(card);
        });
    }

    function setupEventListeners() {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                colorOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        if (noteForm) {
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const author = noteAuthorInput.value.trim();
                const text = noteTextInput.value.trim();
                const selectedColor = document.querySelector('input[name="note-color"]:checked')?.value || 'rose';

                if (!author || !text) return;

                const newNote = {
                    author: author,
                    text: text,
                    color: selectedColor,
                    likes: 0,
                    broken: 0,
                    timestamp: new Date().toISOString()
                };

                // Push new note directly to Firebase
                const notesRef = window.fb.ref(window.db, 'notes');
                window.fb.push(notesRef, newNote);

                noteTextInput.value = '';
                if (window.SoundFX) window.SoundFX.playUnlockChime();
            });
        }
    }

    function formatNoteDate(isoString) {
        if (!isoString) return 'Just now';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 2) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', init);
})();