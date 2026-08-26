/* ==========================================================================
   FOR ANONNA BRISTY - SHARED PHOTO GALLERY (CLOUD EDITION)
   Masonry grid, auto-date, Love/Broken reactions & real-time Firebase sync
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
                        likes: 0,
                        broken: 0,
                        ...data[key]
                    });
                }
                // Sort by date added (newest first)
                memories.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
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
            const displayDate = formatDate(mem.timestamp || mem.date);

            item.innerHTML = `
                <img src="${mem.src}" alt="${escapeHtml(mem.title)}" loading="lazy">
                <div class="gallery-overlay">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <h3 class="gallery-title">${escapeHtml(mem.title)}</h3>
                        <button class="delete-memory-btn" style="background: rgba(225,29,72,0.3); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;" title="Delete Photo">🗑️</button>
                    </div>
                    <span class="gallery-date">${displayDate}</span>
                    <p class="gallery-caption">${escapeHtml(mem.caption)}</p>
                    <div class="gallery-reaction-bar" style="margin-top: 10px; display: flex; gap: 8px; align-items: center;">
                        <button class="reaction-btn love-btn mem-love-btn" title="Love">
                            ❤️ <span class="reaction-count">${mem.likes || 0}</span>
                        </button>
                        <button class="reaction-btn break-btn mem-break-btn" title="Heartbreak">
                            💔 <span class="reaction-count">${mem.broken || 0}</span>
                        </button>
                    </div>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.reaction-btn') || e.target.closest('.delete-memory-btn')) return;
                openLightbox(mem);
            });

            // Love reaction
            item.querySelector('.mem-love-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newLikes = (mem.likes || 0) + 1;
                const ref = window.fb.ref(window.db, 'memories/' + mem.id + '/likes');
                window.fb.set(ref, newLikes);
                if (window.SoundFX) window.SoundFX.playHeartSound();
            });

            // Broken love reaction
            item.querySelector('.mem-break-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newBroken = (mem.broken || 0) + 1;
                const ref = window.fb.ref(window.db, 'memories/' + mem.id + '/broken');
                window.fb.set(ref, newBroken);
                if (window.SoundFX) window.SoundFX.playBreakSound();
            });

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
        const displayDate = formatDate(mem.timestamp || mem.date);

        lightboxImg.src = mem.src;
        lightboxTitle.textContent = mem.title;
        lightboxDate.textContent = displayDate;
        lightboxCaption.textContent = mem.caption;
        lightboxDownloadBtn.href = mem.src;
        lightboxDownloadBtn.download = `${mem.title.replace(/\s+/g, '_')}.jpg`;

        // Update reactions inside lightbox
        let lightboxReactions = document.getElementById('lightbox-reactions');
        if (!lightboxReactions) {
            lightboxReactions = document.createElement('div');
            lightboxReactions.id = 'lightbox-reactions';
            lightboxReactions.className = 'lightbox-reactions-bar';
            const details = document.querySelector('.lightbox-details');
            if (details) details.insertBefore(lightboxReactions, document.querySelector('.lightbox-actions'));
        }

        lightboxReactions.innerHTML = `
            <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                <button class="reaction-btn love-btn lb-love-btn">
                    ❤️ Love <span class="reaction-count">${mem.likes || 0}</span>
                </button>
                <button class="reaction-btn break-btn lb-break-btn">
                    💔 Heartbreak <span class="reaction-count">${mem.broken || 0}</span>
                </button>
            </div>
        `;

        const lbLove = lightboxReactions.querySelector('.lb-love-btn');
        if (lbLove) {
            lbLove.addEventListener('click', () => {
                const newLikes = (mem.likes || 0) + 1;
                const ref = window.fb.ref(window.db, 'memories/' + mem.id + '/likes');
                window.fb.set(ref, newLikes);
                mem.likes = newLikes;
                lbLove.querySelector('.reaction-count').textContent = newLikes;
                if (window.SoundFX) window.SoundFX.playHeartSound();
            });
        }

        const lbBreak = lightboxReactions.querySelector('.lb-break-btn');
        if (lbBreak) {
            lbBreak.addEventListener('click', () => {
                const newBroken = (mem.broken || 0) + 1;
                const ref = window.fb.ref(window.db, 'memories/' + mem.id + '/broken');
                window.fb.set(ref, newBroken);
                mem.broken = newBroken;
                lbBreak.querySelector('.reaction-count').textContent = newBroken;
                if (window.SoundFX) window.SoundFX.playBreakSound();
            });
        }

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
                const caption = document.getElementById('memory-caption').value.trim();

                if (!file || !title || !caption) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64Src = event.target.result;
                    const newMem = {
                        title: title,
                        caption: caption,
                        src: base64Src,
                        likes: 0,
                        broken: 0,
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
        if (!dateStr) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
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