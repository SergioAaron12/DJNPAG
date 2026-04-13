// Modal para galería de fotos
// Este script crea un modal simple para mostrar la imagen completa al hacer click en la galería

document.addEventListener('DOMContentLoaded', function () {
  const galleryImages = Array.from(document.querySelectorAll('.vision-gallery__item img'));

  // Crear modal si no existe
  let modal = document.getElementById('galleryModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.style.position = 'fixed';
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 9999;
    modal.style.cursor = 'zoom-out';
    modal.style.visibility = 'hidden';
    modal.style.opacity = 0;
    modal.style.transition = 'opacity 0.3s';
    modal.innerHTML = `
      <button id="galleryModalPrev" style="position:absolute;left:32px;top:50%;transform:translateY(-50%);font-size:2.5rem;background:none;border:none;color:#fff;cursor:pointer;z-index:2;">&#8592;</button>
      <img id="galleryModalImg" src="" alt="Imagen ampliada" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 8px 32px #0008;z-index:1;" />
      <button id="galleryModalNext" style="position:absolute;right:32px;top:50%;transform:translateY(-50%);font-size:2.5rem;background:none;border:none;color:#fff;cursor:pointer;z-index:2;">&#8594;</button>
      <button id="galleryModalClose" style="position:absolute;top:32px;right:32px;font-size:2rem;background:none;border:none;color:#fff;cursor:pointer;z-index:3;">&times;</button>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('#galleryModalImg');
  const closeBtn = modal.querySelector('#galleryModalClose');
  const prevBtn = modal.querySelector('#galleryModalPrev');
  const nextBtn = modal.querySelector('#galleryModalNext');

  let currentIndex = 0;

  function openModal(index) {
    currentIndex = index;
    const img = galleryImages[currentIndex];
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modal.style.visibility = 'visible';
    modal.style.opacity = 1;
  }

  function closeModal() {
    modal.style.opacity = 0;
    setTimeout(() => {
      modal.style.visibility = 'hidden';
      modalImg.src = '';
    }, 300);
  }

  function showPrev() {
    openModal((currentIndex - 1 + galleryImages.length) % galleryImages.length);
  }

  function showNext() {
    openModal((currentIndex + 1) % galleryImages.length);
  }

  galleryImages.forEach((img, idx) => {
    img.addEventListener('click', () => {
      openModal(idx);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });

  document.addEventListener('keydown', (e) => {
    if (modal.style.visibility === 'visible') {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    }
  });

  // Soporte para swipe en móvil
  let touchStartX = 0;
  let touchEndX = 0;
  modalImg.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  modalImg.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
  });
  modalImg.addEventListener('touchend', () => {
    if (touchEndX === 0) return;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) showNext();
      else showPrev();
    }
    touchStartX = 0;
    touchEndX = 0;
  });
});
