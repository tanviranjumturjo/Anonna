/* ==========================================================================
   FOR ANONNA BRISTY - TIME CAPSULE & MESSAGE BOARD
   Interactive glowing notes, timestamps, heart counters & local storage
   ========================================================================== */

const MessagesModule = (function () {
    const STORAGE_KEY = 'anonna_time_capsule_notes';

    const defaultNotes = [
        {
            id: 'note-1',
            author: 'Always Yours',
            text: 'To Anonna — You are the quiet peace in my noisy world, the gentle rain after a long dry summer.',
            color: 'rose',
            likes: 12,
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: 'note-2',
            author: 'Forever & Always',
            text: 'I promise to stand by you in every quiet evening, holding your hand through all life’s seasons.',
            color: 'wine',
            likes: 8,
            timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'note-3',
            author: 'Your Sanctuary',
            text: 'No matter where life takes us, this digital space will always remain our private home of love.',
            color: 'blush',
            likes: 15,
            timestamp: new Date().toISOString()
        }
    ];

    let notes = [];

    // DOM Elements
    const notesGrid = document.getElementById('notes-grid');
    const noteForm = document.getElementById('note-form');
    const noteAuthorInput = document.getElementById('note-author');
    const noteTextInput = document.getElementById('note-text');

    function init() {
        loadNotes();
        renderNotes();
        setupEventListeners();
    }

    function loadNotes() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                notes = JSON.parse(stored);
            } catch (e) {
                notes = [...defaultNotes];
            }
        } else {
            notes = [...defaultNotes];
            saveNotes();
        }
    }

    function saveNotes() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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
            card.className = `sticky-note-card glow-${note.color} glass-card`;
            card.innerHTML = `
                <p class="note-text">"${escapeHtml(note.text)}"</p>
                <div class="note-footer">
                    <div class="note-meta">
                        <span class="note-author">— ${escapeHtml(note.author)}</span>
                        <span class="note-time">${formatTimeAgo(note.timestamp)}</span>
                    </div>
                    <div class="note-actions">
                        <button class="heart-btn-note ${note.liked ? 'liked' : ''}" data-id="${note.id}">
                            ❤️ <span class="like-count">${note.likes || 0}</span>
                        </button>
                        <button class="delete-note-btn" data-id="${note.id}" title="Delete Note">🗑️</button>
                    </div>
                </div>
            `;

            // Heart reaction
            const heartBtn = card.querySelector('.heart-btn-note');
            heartBtn.addEventListener('click', () => {
                note.likes = (note.likes || 0) + (note.liked ? -1 : 1);
                note.liked = !note.liked;
                saveNotes();
                renderNotes();
                SoundFX.playClickSound();
            });

            // Delete note
            const deleteBtn = card.querySelector('.delete-note-btn');
            deleteBtn.addEventListener('click', () => {
                notes = notes.filter(n => n.id !== note.id);
                saveNotes();
                renderNotes();
                SoundFX.playClickSound();
            });

            notesGrid.appendChild(card);
        });
    }

    function setupEventListeners() {
        // Color picker radio selection style update
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                colorOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // Form submit
        if (noteForm) {
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const author = noteAuthorInput.value.trim();
                const text = noteTextInput.value.trim();
                const selectedColor = document.querySelector('input[name="note-color"]:checked')?.value || 'rose';

                if (!author || !text) return;

                const newNote = {
                    id: 'note-' + Date.now(),
                    author: author,
                    text: text,
                    color: selectedColor,
                    likes: 1,
                    liked: true,
                    timestamp: new Date().toISOString()
                };

                notes.unshift(newNote);
                saveNotes();
                renderNotes();

                noteTextInput.value = '';
                SoundFX.playUnlockChime();
            });
        }
    }

    function formatTimeAgo(isoString) {
        if (!isoString) return 'Just now';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 2) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
