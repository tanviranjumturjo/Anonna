/* ==========================================================================
   FOR ANONNA BRISTY - SHARED PHOTO GALLERY (CLOUD EDITION)
   Masonry grid, memory image uploader, Real-time Firebase sync
   ========================================================================== */

const GalleryModule = (function () {
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
        const memoriesRef = window.fb.ref(window.db, 'memories');
        
        // Listens to the cloud and updates the gallery instantly
        window.fb.onValue(memoriesRef, (snapshot) => {
            const data = snapshot.val();
            memories = [];
            
            if (data) {
                for (let key in data) {
                    memories.push({
                        id: key, 
                        ...data[key]
                    });
                }
                // Sort by date added (newest first)
                memories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            renderGallery();
        });
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

            // Instant cloud delete from grid
            item.querySelector('.delete-memory-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const memRef = window.fb.ref(window.db, 'memories/' + mem.id);
                window.fb.remove(memRef);
                if (window.SoundFX) window.SoundFX.playClickSound();
            });

            galleryGrid.appendChild(item);
        });
    }

    function openLightbox(mem) {
        activeMemory = mem;
        if (window.SoundFX) window.SoundFX.playClickSound();
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
        if (openUploadModalBtn) {
            openUploadModalBtn.addEventListener('click', () => {
                if (window.SoundFX) window.SoundFX.playClickSound();
                uploadModal.classList.remove('hidden');
            });
        }

        if (closeUploadBtn) closeUploadBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
        if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));

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
                        title: title,
                        date: date,
                        caption: caption,
                        src: base64Src,
                        timestamp: new Date().toISOString()
                    };

                    // Send directly to Firebase
                    const memoriesRef = window.fb.ref(window.db, 'memories');
                    window.fb.push(memoriesRef, newMem);

                    uploadForm.reset();
                    if (dropzonePreview) {
                        dropzonePreview.innerHTML = `
                            <span class="upload-icon">☁️</span>
                            <p>Click or drag & drop a photo here</p>
                            <span class="upload-hint">Supports JPG, PNG, WEBP</span>
                        `;
                    }
                    uploadModal.classList.add('hidden');
                    if (window.SoundFX) window.SoundFX.playUnlockChime();
                };
                reader.readAsDataURL(file);
            });
        }

        if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
        
        // Instant cloud delete from lightbox
        if (lightboxDeleteBtn) {
            lightboxDeleteBtn.addEventListener('click', () => {
                if (!activeMemory) return;
                const memRef = window.fb.ref(window.db, 'memories/' + activeMemory.id);
                window.fb.remove(memRef);
                closeLightbox();
                if (window.SoundFX) window.SoundFX.playClickSound();
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