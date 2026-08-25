/* ==========================================================================
   FOR ANONNA BRISTY - SHARED PHOTO GALLERY & LIGHTBOX
   Masonry grid, memory image uploader, Base64 local storage persistence
   ========================================================================== */

const GalleryModule = (function () {
    const STORAGE_KEY = 'anonna_gallery_memories';

    // Initial memories (empty by default, user inputs manually)
    const defaultMemories = [];

    let memories = [];
    let activeMemory = null;

    // DOM Elements
    const galleryGrid = document.getElementById('gallery-grid');
    const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeUploadBtn = document.getElementById('close-upload-btn');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    const uploadForm = document.getElementById('upload-form');
    const imageFileInput = document.getElementById('image-file-input');
    const dropzonePreview = document.getElementById('dropzone-preview');

    // Lightbox DOM Elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDate = document.getElementById('lightbox-date');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
    const lightboxDeleteBtn = document.getElementById('lightbox-delete-btn');

    function init() {
        loadMemories();
        renderGallery();
        setupEventListeners();
    }

    function loadMemories() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out any leftover pre-given memory IDs
                memories = parsed.filter(m => !['mem-1', 'mem-2', 'mem-3'].includes(m.id));
            } catch (e) {
                memories = [];
            }
        } else {
            memories = [];
            saveMemories();
        }
    }

    function saveMemories() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    }

    function renderGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        if (memories.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 1.2rem;">No memories uploaded yet 📸</p>
                    <p style="font-size: 0.9rem;">Click "Upload New Memory" above to add your first photo!</p>
                </div>
            `;
            return;
        }

        memories.forEach(mem => {
            const item = document.createElement('div');
            item.className = 'gallery-item glass-card';
            item.innerHTML = `
                <img src="${mem.src}" alt="${escapeHtml(mem.title)}" loading="lazy">
                <div class="gallery-overlay">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 class="gallery-title">${escapeHtml(mem.title)}</h3>
                        <button class="delete-memory-btn" style="background: rgba(225,29,72,0.3); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;" title="Delete Photo">🗑️</button>
                    </div>
                    <span class="gallery-date">📅 ${formatDate(mem.date)}</span>
                    <p class="gallery-caption">${escapeHtml(mem.caption)}</p>
                </div>
            `;

            item.addEventListener('click', () => openLightbox(mem));

            item.querySelector('.delete-memory-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                memories = memories.filter(m => m.id !== mem.id);
                saveMemories();
                renderGallery();
                SoundFX.playClickSound();
            });

            galleryGrid.appendChild(item);
        });
    }

    function openLightbox(mem) {
        activeMemory = mem;
        SoundFX.playClickSound();
        lightboxImg.src = mem.src;
        lightboxTitle.textContent = mem.title;
        lightboxDate.textContent = '📅 ' + formatDate(mem.date);
        lightboxCaption.textContent = mem.caption;
        lightboxDownloadBtn.href = mem.src;
        lightboxDownloadBtn.download = `${mem.title.replace(/\s+/g, '_')}.jpg`;

        lightboxModal.classList.remove('hidden');
    }

    function closeLightbox() {
        lightboxModal.classList.add('hidden');
        activeMemory = null;
    }

    function setupEventListeners() {
        // Upload modal buttons
        if (openUploadModalBtn) {
            openUploadModalBtn.addEventListener('click', () => {
                SoundFX.playClickSound();
                uploadModal.classList.remove('hidden');
            });
        }

        if (closeUploadBtn) closeUploadBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
        if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));

        // File input preview change
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && dropzonePreview) {
                    dropzonePreview.innerHTML = `
                        <span class="upload-icon">✅</span>
                        <p style="color: var(--accent-blush); font-weight: 600;">Selected: ${escapeHtml(file.name)}</p>
                        <span class="upload-hint">Ready to upload!</span>
                    `;
                }
            });
        }

        // Upload form submit
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const file = imageFileInput.files[0];
                const title = document.getElementById('memory-title').value.trim();
                const date = document.getElementById('memory-date').value;
                const caption = document.getElementById('memory-caption').value.trim();

                if (!file || !title || !date || !caption) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64Src = event.target.result;
                    const newMem = {
                        id: 'mem-' + Date.now(),
                        title: title,
                        date: date,
                        caption: caption,
                        src: base64Src
                    };

                    memories.unshift(newMem);
                    saveMemories();
                    renderGallery();
                    uploadForm.reset();
                    if (dropzonePreview) {
                        dropzonePreview.innerHTML = `
                            <span class="upload-icon">☁️</span>
                            <p>Click or drag & drop a photo here</p>
                            <span class="upload-hint">Supports JPG, PNG, WEBP</span>
                        `;
                    }
                    uploadModal.classList.add('hidden');
                    SoundFX.playUnlockChime();
                };
                reader.readAsDataURL(file);
            });
        }

        // Lightbox close & delete
        if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
        if (lightboxDeleteBtn) {
            lightboxDeleteBtn.addEventListener('click', () => {
                if (!activeMemory) return;
                memories = memories.filter(m => m.id !== activeMemory.id);
                saveMemories();
                renderGallery();
                closeLightbox();
                SoundFX.playClickSound();
            });
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        renderGallery: renderGallery
    };
})();
