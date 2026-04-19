/* ── WINDOW MANAGEMENT ── */
var topZ = 10, windows = {}, preMaxState = {};
var dragTarget = null, dragOffX = 0, dragOffY = 0, resizeTarget = null;

function initWindow(name) {
  windows[name] = {
    el: document.getElementById('win-' + name),
    minimized: false,
    maximized: false
  };
}

initWindow('photos');
initWindow('apod');
initWindow('iss');
initWindow('weather');
initWindow('news');

function focusWindow(name) {
  topZ++;
  windows[name].el.style.zIndex = topZ;
}

function openWindow(name) {
  var w = windows[name];
  w.el.classList.add('open');
  w.minimized = false;
  focusWindow(name);
  var d = document.getElementById('dock-' + name);
  if (d) d.classList.add('active');
  if (name === 'apod' && !apodLoaded) fetchAPOD();
  if (name === 'iss') startISS();
  if (name === 'news' && !newsLoaded) fetchNews();
}

function closeWindow(name) {
  var w = windows[name];
  w.el.classList.remove('open', 'maximized');
  w.minimized = false;
  w.maximized = false;
  var d = document.getElementById('dock-' + name);
  if (d) d.classList.remove('active');
  if (name === 'iss') stopISS();
}

function minimizeWindow(name) {
  windows[name].el.classList.remove('open');
  windows[name].minimized = true;
  if (name === 'iss') stopISS();
}

function maximizeWindow(name) {
  var w = windows[name];
  if (w.maximized) {
    w.el.classList.remove('maximized');
    if (preMaxState[name]) {
      w.el.style.top = preMaxState[name].top;
      w.el.style.left = preMaxState[name].left;
      w.el.style.width = preMaxState[name].width;
      w.el.style.height = preMaxState[name].height;
    }
    w.maximized = false;
  } else {
    preMaxState[name] = {
      top: w.el.style.top,
      left: w.el.style.left,
      width: w.el.style.width,
      height: w.el.style.height
    };
    w.el.classList.add('maximized');
    w.maximized = true;
  }
  focusWindow(name);
}

function toggleWindow(name) {
  var w = windows[name];
  if (w.minimized) {
    openWindow(name);
  } else if (w.el.classList.contains('open')) {
    if (parseInt(w.el.style.zIndex) === topZ) minimizeWindow(name);
    else focusWindow(name);
  } else {
    openWindow(name);
  }
}

/* ── DRAGGING ── */
document.querySelectorAll('.window-titlebar').forEach(function(bar) {
  bar.addEventListener('mousedown', function(e) {
    if (e.target.closest('.window-btn')) return;
    var name = bar.dataset.window, w = windows[name];
    if (w.maximized) return;
    dragTarget = w.el;
    focusWindow(name);
    var rect = dragTarget.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    e.preventDefault();
  });
});

document.addEventListener('mousemove', function(e) {
  if (dragTarget) {
    var x = e.clientX - dragOffX, y = e.clientY - dragOffY;
    x = Math.max(-dragTarget.offsetWidth + 100, Math.min(x, window.innerWidth - 100));
    y = Math.max(0, Math.min(y, window.innerHeight - 32));
    dragTarget.style.left = x + 'px';
    dragTarget.style.top = y + 'px';
  }
  if (resizeTarget) {
    var rect = resizeTarget.getBoundingClientRect();
    resizeTarget.style.width = Math.max(400, e.clientX - rect.left) + 'px';
    resizeTarget.style.height = Math.max(300, e.clientY - rect.top) + 'px';
  }
});

document.addEventListener('mouseup', function() {
  dragTarget = null;
  resizeTarget = null;
});

/* ── RESIZING ── */
document.querySelectorAll('.window-resize').forEach(function(handle) {
  handle.addEventListener('mousedown', function(e) {
    var name = handle.dataset.window;
    resizeTarget = windows[name].el;
    focusWindow(name);
    e.preventDefault();
    e.stopPropagation();
  });
});

document.querySelectorAll('.window').forEach(function(win) {
  win.addEventListener('mousedown', function() {
    focusWindow(win.id.replace('win-', ''));
  });
});

/* ── GALLERY ── */
var gallery = document.getElementById('gallery');
var photosBody = document.getElementById('photos-body');
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
  if (!lightbox.classList.contains('open')) return;
  var all = items();
  if (e.key === 'ArrowLeft') lbOpen((current - 1 + all.length) % all.length);
  if (e.key === 'ArrowRight') lbOpen((current + 1) % all.length);
  if (e.key === 'Escape') lbClose();
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
  }, { root: photosBody, rootMargin: '0px', threshold: 0 });

  gallery.querySelectorAll('.gallery-item.pending').forEach(function(item) {
    itemObserver.observe(item);
  });
}

/* ── TAB BUTTONS ── */
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    photosBody.scrollTop = 0;
    shuffleGallery();
    staggerReveal(btn.dataset.tab);
  });
});

/* ── FIRST LOAD ── */
shuffleGallery();
Promise.all(Array.from(gallery.querySelectorAll('img')).map(function(img) {
  if (img.complete) return Promise.resolve();
  return new Promise(function(r) { img.onload = r; img.onerror = r; });
})).then(function() {
  gallery.style.visibility = 'visible';
  staggerReveal('scenery');
});

/* ── BACK TO TOP ── */
var winBtt = document.getElementById('win-btt');
var photosFooter = document.getElementById('photos-footer');

photosBody.addEventListener('scroll', function() {
  photosFooter.classList.toggle('visible', photosBody.scrollTop > 300);
});

winBtt.addEventListener('click', function() {
  photosBody.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── APOD ── */
var apodLoaded = false;
var APOD_URL = 'https://apod-proxy.eno-0b7.workers.dev';

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

/* ── ISS TRACKER ── */
var issMap = null, issMarker = null, issTrail = [], issTrailLines = [], issInterval = null;
var issFollowing = true, issPositions = [], issFirstLoad = true;
var ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

var issIcon = L.divIcon({
  className: 'iss-marker',
  html: '<div class="iss-marker-ping"></div><div class="iss-marker-dot"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function initISSMap() {
  if (issMap) return;
  issMap = L.map('iss-map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 8,
    worldCopyJump: true,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(issMap);

  issMarker = L.marker([0, 0], { icon: issIcon }).addTo(issMap);

  issMap.on('dragstart', function() {
    issFollowing = false;
    document.getElementById('iss-follow-btn').classList.add('visible');
  });

  document.getElementById('iss-follow-btn').addEventListener('click', function() {
    issFollowing = true;
    this.classList.remove('visible');
    if (issPositions.length > 0) {
      var last = issPositions[issPositions.length - 1];
      issMap.panTo([last[0], last[1]], { animate: true });
    }
  });

  new ResizeObserver(function() {
    if (issMap) issMap.invalidateSize();
  }).observe(document.getElementById('iss-map'));
}

function fetchISSPosition() {
  fetch(ISS_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var lat = data.latitude;
      var lon = data.longitude;
      var alt = data.altitude;
      var vel = data.velocity;
      var vis = data.visibility;

      issMarker.setLatLng([lat, lon]);

      if (issFollowing) {
        issMap.panTo([lat, lon], { animate: true, duration: 1 });
      }

      /* update trail */
      var prev = issPositions.length > 0 ? issPositions[issPositions.length - 1] : null;
      issPositions.push([lat, lon]);

      /* keep last 200 points (~16 min of trail) */
      if (issPositions.length > 200) issPositions.shift();

      /* rebuild trail polylines, splitting at antimeridian */
      issTrailLines.forEach(function(line) { issMap.removeLayer(line); });
      issTrailLines = [];
      var segment = [];
      for (var i = 0; i < issPositions.length; i++) {
        if (segment.length > 0) {
          var prevLon = segment[segment.length - 1][1];
          var curLon = issPositions[i][1];
          if (Math.abs(curLon - prevLon) > 180) {
            if (segment.length > 1) {
              issTrailLines.push(
                L.polyline(segment, { color: '#e8e4dc', weight: 1.5, opacity: 0.3, interactive: false }).addTo(issMap)
              );
            }
            segment = [];
          }
        }
        segment.push(issPositions[i]);
      }
      if (segment.length > 1) {
        issTrailLines.push(
          L.polyline(segment, { color: '#e8e4dc', weight: 1.5, opacity: 0.3, interactive: false }).addTo(issMap)
        );
      }

      /* update info panel */
      document.getElementById('iss-lat').textContent = lat.toFixed(4) + '\u00B0';
      document.getElementById('iss-lon').textContent = lon.toFixed(4) + '\u00B0';
      document.getElementById('iss-alt').textContent = alt.toFixed(1) + ' km';
      document.getElementById('iss-vel').textContent = vel.toFixed(0) + ' km/h';
      document.getElementById('iss-vis').textContent = vis || '--';

      /* hide loading overlay on first load */
      if (issFirstLoad) {
        issFirstLoad = false;
        var loader = document.getElementById('iss-loading');
        if (loader) {
          loader.classList.add('fade-out');
          setTimeout(function() { loader.remove(); }, 500);
        }
      }
    })
    .catch(function() {
      /* silently retry on next interval */
    });
}

function startISS() {
  initISSMap();
  setTimeout(function() { issMap.invalidateSize(); }, 100);
  fetchISSPosition();
  if (!issInterval) {
    issInterval = setInterval(fetchISSPosition, 5000);
  }
}

function stopISS() {
  if (issInterval) {
    clearInterval(issInterval);
    issInterval = null;
  }
}

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

/* ── MOBILE SUPPORT ── */
function isMobile() {
  return window.innerWidth <= 768;
}

/* Override openWindow on mobile to skip focus z-index issues */
var _originalOpen = openWindow;
openWindow = function(name) {
  _originalOpen(name);
  /* On mobile, windows are always fullscreen via CSS */
};

/* Disable dragging on mobile */
var _originalTitlebarHandler = true;
document.querySelectorAll('.window-titlebar').forEach(function(bar) {
  bar.addEventListener('touchstart', function(e) {
    /* prevent drag on mobile */
    e.stopPropagation();
  });
});

/* Add touch support for dock items */
document.querySelectorAll('.dock-item').forEach(function(item) {
  item.addEventListener('touchend', function(e) {
    e.preventDefault();
    item.click();
  });
});



/* Add touch support for lightbox */
lightbox.addEventListener('touchend', function(e) {
  if (e.target === lightbox) lbClose();
});

/* Swipe left/right in lightbox on mobile */
var touchStartX = 0;
lightbox.addEventListener('touchstart', function(e) {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', function(e) {
  if (!lightbox.classList.contains('open')) return;
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

/* ── WEATHER ── */
var weatherCodes = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Slight showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail'
};

document.getElementById('weather-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchWeather();
});

function searchWeather() {
  var city = document.getElementById('weather-input').value.trim();
  var result = document.getElementById('weather-result');
  if (!city) return;
  result.innerHTML = '<div class="weather-loading">searching...</div>';

  fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1')
    .then(function(res) { return res.json(); })
    .then(function(geo) {
      if (!geo.results || !geo.results.length) {
        result.innerHTML = '<div class="weather-loading">city not found.</div>';
        return;
      }
      var loc = geo.results[0];
      return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude
        + '&longitude=' + loc.longitude
        + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
        + '&daily=temperature_2m_max,temperature_2m_min,weather_code'
        + '&timezone=auto&forecast_days=5')
        .then(function(res) { return res.json(); })
        .then(function(w) {
          var c = w.current;
          var html = '<div class="weather-current">';
          html += '<div class="weather-city">' + loc.name;
          if (loc.admin1) html += ', ' + loc.admin1;
          if (loc.country) html += ', ' + loc.country;
          html += '</div>';
          html += '<div class="weather-temp">' + Math.round(c.temperature_2m) + '&deg;C</div>';
          html += '<div class="weather-condition">' + (weatherCodes[c.weather_code] || 'Unknown') + '</div>';
          html += '<div class="weather-details">';
          html += '<span>humidity: ' + c.relative_humidity_2m + '%</span>';
          html += '<span>wind: ' + c.wind_speed_10m + ' km/h</span>';
          html += '</div>';
          html += '</div>';
          html += '<div class="weather-forecast">';
          for (var i = 0; i < w.daily.time.length; i++) {
            var d = new Date(w.daily.time[i] + 'T00:00:00');
            var day = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });
            html += '<div class="weather-day">';
            html += '<div class="weather-day-name">' + day + '</div>';
            html += '<div class="weather-day-condition">' + (weatherCodes[w.daily.weather_code[i]] || '--') + '</div>';
            html += '<div class="weather-day-temps">' + Math.round(w.daily.temperature_2m_max[i]) + '&deg; / ' + Math.round(w.daily.temperature_2m_min[i]) + '&deg;</div>';
            html += '</div>';
          }
          html += '</div>';
          result.innerHTML = html;
        });
    })
    .catch(function() {
      result.innerHTML = '<div class="weather-loading">failed to load weather.</div>';
    });
}

/* ── NEWS ── */
var newsLoaded = false;
var NEWS_URL = 'https://news-proxy.eno-0b7.workers.dev';

function timeAgo(dateStr) {
  var now = new Date();
  var then = new Date(dateStr);
  var diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function fetchNews() {
  var content = document.getElementById('news-content');
  fetch(NEWS_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.articles || !data.articles.length || data.code) {
        content.innerHTML = '<div class="news-loading">no headlines available.</div>';
        return;
      }
      newsLoaded = true;
      var html = '<div class="news-header"><span>powered by <img src="https://assets.apnews.com/fa/ba/9258a7114f5ba5c7202aaa1bdd66/aplogo.svg" alt="AP News"></span><button class="news-refresh" onclick="newsLoaded=false;fetchNews()">refresh</button></div>';
      for (var i = 0; i < data.articles.length; i++) {
        var a = data.articles[i];
        html += '<a class="news-item" href="' + a.url + '" target="_blank">';
        html += '<div class="news-title">' + a.title + '</div>';
        if (a.date) html += '<div class="news-time">' + timeAgo(a.date) + '</div>';
        html += '</a>';
      }
      html += '<div class="news-footer"><a href="https://apnews.com" target="_blank">via AP News</a></div>';
      content.innerHTML = html;
    })
    .catch(function() {
      content.innerHTML = '<div class="news-loading">failed to load headlines.</div>';
    });
}
