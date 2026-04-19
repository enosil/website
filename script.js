/* ── GALLERY ── */
var gallery = document.getElementById('gallery');
var lightbox = document.getElementById('lightbox');
var lbImg = document.getElementById('lb-img');
var lbCount = document.getElementById('lb-counter');
var lbCap = document.getElementById('lb-caption');
var current = 0;

function items() {
  return Array.from(gallery.querySelectorAll('.gallery-item:not(.hidden):not(.pending)'));
}

function lbOpen(index) {
  current = index;
  var all = items(), item = all[index];
  lbImg.classList.remove('loaded');
  lbImg.src = item.querySelector('img').src;
  lbImg.onload = function() { lbImg.classList.add('loaded'); };
  lbCount.textContent = (index + 1) + ' / ' + all.length;
  lbCap.textContent = item.dataset.caption || '';
  lightbox.classList.add('open');
}

function lbClose() {
  lightbox.classList.remove('open');
  document.getElementById('lb-prev').style.display = '';
  document.getElementById('lb-next').style.display = '';
}

gallery.addEventListener('click', function(e) {
  var item = e.target.closest('.gallery-item');
  if (item && !item.classList.contains('hidden') && !item.classList.contains('pending'))
    lbOpen(items().indexOf(item));
});

document.getElementById('lb-close').addEventListener('click', lbClose);
lightbox.addEventListener('click', function(e) { if (e.target === lightbox) lbClose(); });

document.getElementById('lb-prev').addEventListener('click', function(e) {
  e.stopPropagation();
  var all = items();
  lbOpen((current - 1 + all.length) % all.length);
});

document.getElementById('lb-next').addEventListener('click', function(e) {
  e.stopPropagation();
  lbOpen((current + 1) % items().length);
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (lightbox.classList.contains('open')) { lbClose(); return; }
    if (apodModal.classList.contains('open')) { closeApodModal(); return; }
  }
  if (!lightbox.classList.contains('open')) return;
  var all = items();
  if (e.key === 'ArrowLeft') lbOpen((current - 1 + all.length) % all.length);
  if (e.key === 'ArrowRight') lbOpen((current + 1) % all.length);
});

/* ── SHUFFLE ── */
function shuffleGallery() {
  var all = Array.from(gallery.querySelectorAll('.gallery-item'));
  for (var i = all.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    gallery.appendChild(all[j]);
    all.splice(j, 1, all[i]);
  }
}

/* ── STAGGER REVEAL ── */
var itemObserver = null, staggerTimers = [], batch = [], batchFrame = null;

function flushBatch() {
  var toReveal = batch.splice(0);
  toReveal.forEach(function(item, i) {
    staggerTimers.push(setTimeout(function() {
      item.classList.remove('pending');
      void item.offsetWidth;
      item.classList.add('popin');
    }, i * 120));
  });
  batchFrame = null;
}

function staggerReveal(tab) {
  if (itemObserver) itemObserver.disconnect();
  staggerTimers.forEach(function(t) { clearTimeout(t); });
  staggerTimers = [];
  batch = [];
  if (batchFrame) { cancelAnimationFrame(batchFrame); batchFrame = null; }

  Array.from(gallery.querySelectorAll('.gallery-item')).forEach(function(item) {
    item.classList.remove('popin', 'pending', 'hidden');
    if (item.dataset.category !== tab) item.classList.add('hidden');
    else item.classList.add('pending');
  });

  itemObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && entry.target.classList.contains('pending')) {
        itemObserver.unobserve(entry.target);
        batch.push(entry.target);
        if (!batchFrame) batchFrame = requestAnimationFrame(flushBatch);
      }
    });
  }, { rootMargin: '0px', threshold: 0 });

  gallery.querySelectorAll('.gallery-item.pending').forEach(function(item) {
    itemObserver.observe(item);
  });
}

/* ── TAB BUTTONS ── */
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    shuffleGallery();
    staggerReveal(btn.dataset.tab);
  });
});

/* ── FIRST LOAD ── */
shuffleGallery();
gallery.style.visibility = 'visible';
staggerReveal('scenery');

/* ── BACK TO TOP ── */
var btt = document.getElementById('back-to-top');

window.addEventListener('scroll', function() {
  btt.classList.toggle('visible', window.scrollY > window.innerHeight * 0.8);
});

btt.addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── APOD ── */
var APOD_URL = 'https://apod-proxy.eno-0b7.workers.dev';
var apodLoaded = false;
var apodModal = document.getElementById('apod-modal');
var apodPanel = document.getElementById('apod-modal-panel');

function fetchAPOD() {
  var content = document.getElementById('apod-content');
  fetch(APOD_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.title || data.code) {
        content.innerHTML = '<div class="apod-loading">NASA API is temporarily unavailable. try again later.</div>';
        return;
      }
      apodLoaded = true;
      var html = '';
      if (data.media_type === 'video') {
        html += '<div class="apod-image-wrap"><iframe src="' + data.url + '" allowfullscreen></iframe></div>';
      } else {
        html += '<div class="apod-image-wrap"><img src="' + (data.url || data.hdurl) + '" alt="' + data.title + '" onclick="openApodLightbox(this.src)"></div>';
      }
      html += '<div class="apod-title">' + data.title + '</div>';
      html += '<div class="apod-date">' + data.date + '</div>';
      html += '<div class="apod-desc">' + data.explanation + '</div>';
      if (data.copyright) html += '<div class="apod-credit">Image credit: ' + data.copyright + '</div>';
      html += '<div class="apod-credit" style="margin-top:0.6rem"><a href="https://apod.nasa.gov/apod/astropix.html" target="_blank">via NASA APOD</a></div>';
      content.innerHTML = html;
    })
    .catch(function() {
      content.innerHTML = '<div class="apod-loading">failed to load. try again later.</div>';
    });
}

function openApodModal() {
  apodModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!apodLoaded) fetchAPOD();
}

function closeApodModal() {
  apodModal.classList.remove('open');
  document.body.style.overflow = '';
  apodPanel.scrollTop = 0;
}

function openApodLightbox(src) {
  lbImg.classList.remove('loaded');
  lbImg.src = src;
  lbImg.onload = function() { lbImg.classList.add('loaded'); };
  lbCount.textContent = '';
  lbCap.textContent = 'NASA Astronomy Picture of the Day';
  lightbox.classList.add('open');
  document.getElementById('lb-prev').style.display = 'none';
  document.getElementById('lb-next').style.display = 'none';
}

document.getElementById('hero-apod-btn').addEventListener('click', openApodModal);
document.getElementById('apod-close').addEventListener('click', closeApodModal);
apodModal.addEventListener('click', function(e) {
  if (e.target === apodModal) closeApodModal();
});

/* ── CUSTOM RIGHT-CLICK ── */
var ctxMenu = document.createElement('div');
ctxMenu.style.cssText = 'position:fixed;background:#000;color:#e8e4dc;font-family:"Share Tech Mono",monospace;font-size:0.75rem;letter-spacing:0.12em;padding:0.6rem 1rem;pointer-events:none;display:none;z-index:9999;border:1px solid #333;';
ctxMenu.textContent = "eno's pics";
document.body.appendChild(ctxMenu);

document.querySelectorAll('.gallery-item img').forEach(function(img) {
  img.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top = e.clientY + 'px';
    ctxMenu.style.display = 'block';
  });
  img.addEventListener('dragstart', function(e) { e.preventDefault(); });
});

document.addEventListener('click', function() { ctxMenu.style.display = 'none'; });

/* ── LIGHTBOX TOUCH ── */
var touchStartX = 0;
lightbox.addEventListener('touchstart', function(e) {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', function(e) {
  if (!lightbox.classList.contains('open')) return;
  if (e.target === lightbox) { lbClose(); return; }
  var touchEndX = e.changedTouches[0].screenX;
  var diff = touchEndX - touchStartX;
  if (Math.abs(diff) > 50) {
    var all = items();
    if (diff > 0) {
      lbOpen((current - 1 + all.length) % all.length);
    } else {
      lbOpen((current + 1) % all.length);
    }
  }
});
