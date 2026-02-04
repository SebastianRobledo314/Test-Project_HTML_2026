// Global audio variables
let purringSound = null;
let washingSound = null;
let celebrationSound = null;

function setup() {
  createCanvas(400, 400);
  
  // Load audio files
  // Load purring sound for Objective 2 (brushing)
  purringSound = loadSound('Audio/purring.wav', () => {
    console.log('Purring sound loaded');
    purringSound.setVolume(0.4);
  }, (err) => {
    console.log('Error loading purring sound:', err);
  });
  
  // Load squeaky washing sound for Objective 1 (washing)
  washingSound = loadSound('Audio/Squeaky.mp3', () => {
    console.log('Washing sound loaded');
    washingSound.setVolume(0.5);
  }, (err) => {
    console.log('Error loading washing sound:', err);
  });
  
  // Load celebration sound for completion
  celebrationSound = loadSound('Audio/Celebration.mp3', () => {
    console.log('Celebration sound loaded');
    celebrationSound.setVolume(0.6);
  }, (err) => {
    console.log('Error loading celebration sound:', err);
  });
  
  // Custom cursor setup 
  let img = new Image();
  img.onload = function() {
    let canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 72, 72);
    let cursorUrl = canvas.toDataURL();
    document.body.style.cursor = `url('${cursorUrl}') 36 36, auto`;
  };
  img.src = 'images/Paw.png';

  // Prepare soap cursor for use inside the image frame
  let soapCursorUrl = null;
  (function preloadSoapCursor(){
    const img = new Image();
    img.onload = function() {
      const c = document.createElement('canvas');
      c.width = 72; c.height = 72;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 72, 72);
      soapCursorUrl = c.toDataURL();
    };
    img.src = 'images/soap3.png';
  })();

  // Prepare cat brush cursor for Objective 2
  let catBrushCursorUrl = null;
  (function preloadCatBrushCursor(){
    const img = new Image();
    img.onload = function() {
      const c = document.createElement('canvas');
      c.width = 72; c.height = 72;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 72, 72);
      catBrushCursorUrl = c.toDataURL();
    };
    img.src = 'images/catbrush.png';
  })();

  // Shared helper: accumulate movement distance and invoke a callback
  function createMovementProgressTracker(pxPerStep, onStep) {
    let lastX = null;
    let lastY = null;
    let accum = 0;
    return {
      handleMove(clientX, clientY) {
        if (lastX != null && lastY != null) {
          const dx = clientX - lastX;
          const dy = clientY - lastY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          accum += dist;
          while (accum >= pxPerStep) {
            accum -= pxPerStep;
            onStep();
          }
        }
        lastX = clientX;
        lastY = clientY;
      },
      reset() {
        lastX = null;
        lastY = null;
        accum = 0;
      }
    };
  }

  function setupInteractiveSwap(imgId) {
    const imgElem = document.getElementById(imgId);
    if (imgElem) {
      const isObj1Flow = /Obj1B\.jpeg$/i.test(imgElem.getAttribute('src') || '');

      if (isObj1Flow) {
        // Scrub detection: total movement distance inside the image fills the bar.
        const movementTracker = createMovementProgressTracker(600, () => {
          if (clickCount < maxClicks) {
            flashProgressAndMaybeComplete();
          }
        });
        // Trail bubble throttle and movement tracking
        let lastBubbleTime = 0;
        let lastBubbleX = null, lastBubbleY = null;
        const trailIntervalMs = 130;
        const trailMinMovePx = 6;

        function triggerFlashIndicator() {
          const frame = imgElem.closest('.image-interactive');
          if (!frame) return;
          frame.classList.add('scrub-flash');
          setTimeout(() => frame.classList.remove('scrub-flash'), 250);
        }

        let completionCelebrated = false;

        function celebrateCompletionOnce() {
          if (completionCelebrated) return;
          completionCelebrated = true;
          // Play celebration sound
          if (celebrationSound) {
            celebrationSound.play();
          }
          const frame = imgElem.closest('.image-interactive');
          if (!frame) return;
          const rect = frame.getBoundingClientRect();
          const waves = 3; // three waves to fill the frame
          const perWave = 36; // bubbles per wave
          for (let w = 0; w < waves; w++) {
            setTimeout(() => {
              for (let i = 0; i < perWave; i++) {
                const x = rect.left + Math.random() * rect.width;
                const y = rect.top + Math.random() * rect.height;
                spawnBubbles(x, y, {
                  countMin: 3,
                  countMax: 5,
                  sizeMin: 12,
                  sizeMax: 28,
                  durMin: 1800,
                  durMax: 3200,
                  delayMax: 180
                });
              }
            }, w * 220);
          }
        }

        function flashProgressAndMaybeComplete() {
          // Each chunk of movement advances the bar; keep Obj1B as the
          // active image until completion, then switch straight to Obj1C
          // (handled in updateFill).
          clickCount++;
          if (clickCount > maxClicks) clickCount = maxClicks;
          updateFill(clickCount);
          triggerFlashIndicator();
          if (clickCount >= maxClicks) {
            celebrateCompletionOnce();
          }
        }

        imgElem.addEventListener('mousemove', (e) => {
          // Progress based on how far the cursor moves inside the image
          if (clickCount < maxClicks) {
            movementTracker.handleMove(e.clientX, e.clientY);
            // Play washing sound while scrubbing
            if (washingSound && !washingSound.isPlaying()) {
              washingSound.play();
            }
          }

          // Emit trailing bubbles following soap cursor while moving
          const now = performance.now();
          const dx = lastBubbleX == null ? Infinity : Math.abs(e.clientX - lastBubbleX);
          const dy = lastBubbleY == null ? Infinity : Math.abs(e.clientY - lastBubbleY);
          if (now - lastBubbleTime >= trailIntervalMs && (dx > trailMinMovePx || dy > trailMinMovePx)) {
            spawnBubbles(e.clientX, e.clientY, { countMin: 2, countMax: 4, sizeMin: 10, sizeMax: 18, durMin: 1700, durMax: 2800, delayMax: 120 });
            lastBubbleTime = now;
            lastBubbleX = e.clientX;
            lastBubbleY = e.clientY;
          }
        });

        imgElem.addEventListener('mouseenter', () => {
          movementTracker.reset();
          lastBubbleX = null;
          lastBubbleY = null;
        });

        imgElem.addEventListener('mouseleave', () => {
          movementTracker.reset();
          const frame = imgElem.closest('.image-interactive');
          if (frame) frame.style.cursor = '';
          // Stop washing sound when cursor leaves
          if (washingSound && washingSound.isPlaying()) {
            washingSound.stop();
          }
        });

        // Switch to soap cursor inside the image frame
        imgElem.addEventListener('mouseenter', () => {
          const frame = imgElem.closest('.image-interactive');
          if (frame && soapCursorUrl) {
            frame.style.cursor = `url('${soapCursorUrl}') 36 36, auto`;
          }
        });

        // Bubble spawner (supports various emission patterns)
        function spawnBubbles(clientX, clientY, opts = {}) {
          const frame = imgElem.closest('.image-interactive');
          if (!frame) return;
          const rect = frame.getBoundingClientRect();
          const localX = clientX - rect.left;
          const localY = clientY - rect.top;
          const countMin = opts.countMin ?? 6;
          const countMax = opts.countMax ?? 9;
          const sizeMin = opts.sizeMin ?? 12;
          const sizeMax = opts.sizeMax ?? 24;
          const durMin = opts.durMin ?? 1800;
          const durMax = opts.durMax ?? 3000;
          const delayMax = opts.delayMax ?? 240;
          const count = randInt(countMin, countMax);
          for (let i = 0; i < count; i++) {
            const b = document.createElement('div');
            b.className = 'bubble';
            const size = randInt(sizeMin, sizeMax);
            const offsetX = (Math.random() - 0.5) * 30; // +/-15px
            const offsetY = (Math.random() - 0.5) * 8;  // +/-4px
            const driftX = (Math.random() - 0.5) * 40;  // horizontal drift during rise
            const rise = 120 + Math.floor(Math.random() * 60); // variable rise height
            b.style.width = size + 'px';
            b.style.height = size + 'px';
            b.style.left = clamp(localX + offsetX, 0, rect.width - size) + 'px';
            b.style.top = clamp(localY + offsetY, 0, rect.height - size) + 'px';
            b.style.animationDuration = (durMin + randInt(0, durMax - durMin)) + 'ms';
            b.style.animationDelay = randInt(0, delayMax) + 'ms';
            b.style.setProperty('--driftX', driftX + 'px');
            b.style.setProperty('--rise', rise + 'px');
            frame.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
          }
        }

        // Touch scrubbing support
        imgElem.addEventListener('touchmove', (e) => {
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          // Progress based on how far the touch moves inside the image
          if (clickCount < maxClicks) {
            movementTracker.handleMove(t.clientX, t.clientY);
          }
          const now = performance.now();
          const dx = lastBubbleX == null ? Infinity : Math.abs(t.clientX - lastBubbleX);
          const dy = lastBubbleY == null ? Infinity : Math.abs(t.clientY - lastBubbleY);
          if (now - lastBubbleTime >= trailIntervalMs && (dx > trailMinMovePx || dy > trailMinMovePx)) {
            spawnBubbles(t.clientX, t.clientY, { countMin: 2, countMax: 4, sizeMin: 10, sizeMax: 18, durMin: 1700, durMax: 2800, delayMax: 120 });
            lastBubbleTime = now;
            lastBubbleX = t.clientX;
            lastBubbleY = t.clientY;
          }
        }, { passive: true });

        // Clear soap cursor on touch end
        imgElem.addEventListener('touchend', () => {
          movementTracker.reset();
          const frame = imgElem.closest('.image-interactive');
          if (frame) frame.style.cursor = '';
        });

        // Spawn bubbles on touch tap (visual only; progress via scrubbing)
        imgElem.addEventListener('touchstart', (e) => {
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          spawnBubbles(t.clientX, t.clientY, { countMin: 6, countMax: 9, sizeMin: 12, sizeMax: 24, durMin: 1800, durMax: 3000, delayMax: 240 });
        }, { passive: true });
      } else if (/objective-2\.html$/i.test(window.location.pathname)) {
        // Objective 2: moving the cursor inside the image raises the Purr Bar
        let lastFurTime = 0;
        const furIntervalMs = 120; // throttle fur emission

        const movementTracker = createMovementProgressTracker(650, () => {
          if (clickCount < maxClicks) {
            clickCount++;
            if (clickCount > maxClicks) clickCount = maxClicks;
            updateFill(clickCount);
          }
        });

        function spawnFur(clientX, clientY, burst = false) {
          const frame = imgElem.closest('.image-interactive');
          if (!frame) return;
          const rect = frame.getBoundingClientRect();
          const localX = clientX - rect.left;
          const localY = clientY - rect.top;
          const baseCount = burst ? 4 : 2;
          const variance = burst ? 3 : 1;
          const count = baseCount + randInt(0, variance - 1);
          for (let i = 0; i < count; i++) {
            const f = document.createElement('div');
            f.className = 'fur';
            const size = 26 + randInt(0, 20); // big, visible
            const offsetX = (Math.random() - 0.5) * 26;
            const offsetY = (Math.random() - 0.5) * 12;
            const driftStartX = (Math.random() - 0.5) * 22;
            const driftMidX = driftStartX + (Math.random() - 0.5) * 28;
            const driftEndX = driftMidX + (Math.random() - 0.5) * 36;
            const fallY = 90 + Math.floor(Math.random() * 80);
            const dur = 1600 + randInt(0, 1100);
            f.style.width = size + 'px';
            f.style.height = size + 'px';
            f.style.left = clamp(localX + offsetX, 0, rect.width - size) + 'px';
            f.style.top = clamp(localY + offsetY, 0, rect.height - size) + 'px';
            f.style.setProperty('--driftStartX', driftStartX + 'px');
            f.style.setProperty('--driftMidX', driftMidX + 'px');
            f.style.setProperty('--driftEndX', driftEndX + 'px');
            f.style.setProperty('--fallY', fallY + 'px');
            f.style.setProperty('--dur', dur + 'ms');
            frame.appendChild(f);
            f.addEventListener('animationend', () => f.remove());
          }
        }

        // Cursor change to cat brush inside image
        imgElem.addEventListener('mouseenter', () => {
          const frame = imgElem.closest('.image-interactive');
          if (frame && catBrushCursorUrl) {
            frame.style.cursor = `url('${catBrushCursorUrl}') 36 36, auto`;
          }
          movementTracker.reset();
        });
        imgElem.addEventListener('mouseleave', () => {
          const frame = imgElem.closest('.image-interactive');
          if (frame) frame.style.cursor = '';
          movementTracker.reset();
          // Stop purring sound when cursor leaves
          if (purringSound && purringSound.isPlaying()) {
            purringSound.stop();
          }
        });

        // Mouse movement inside image raises the bar
        imgElem.addEventListener('mousemove', (e) => {
          const now = performance.now();
          if (now - lastFurTime >= furIntervalMs) {
            spawnFur(e.clientX, e.clientY, false);
            lastFurTime = now;
          }
          if (clickCount < maxClicks) {
            movementTracker.handleMove(e.clientX, e.clientY);
            // Play purring sound while brushing
            if (purringSound && !purringSound.isPlaying()) {
              purringSound.play();
            }
          }
        });

        // Touch movement inside image also raises the bar
        imgElem.addEventListener('touchmove', (e) => {
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          const now = performance.now();
          if (now - lastFurTime >= furIntervalMs) {
            spawnFur(t.clientX, t.clientY, false);
            lastFurTime = now;
          }
          if (clickCount < maxClicks) {
            movementTracker.handleMove(t.clientX, t.clientY);
            // Play purring sound while brushing
            if (purringSound && !purringSound.isPlaying()) {
              purringSound.play();
            }
          }
        }, { passive: true });
      } else {
        // Fallback behavior for other pages/content
        imgElem.addEventListener('click', () => {
          clickCount++;
          if (clickCount > maxClicks) clickCount = maxClicks;
          updateFill(clickCount);
        });
      }
    }
  }

  setupInteractiveSwap('interactive-img');
  setupInteractiveSwap('center-img'); 

  // Initialize objective tab transitions
  initTabTransitions();
}
// Transition overlay logic for tab navigation
function initTabTransitions() {
  const tabs = document.querySelectorAll('.tabs .tab');
  if (!tabs.length) return;
  tabs.forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      // Animate for objective pages and Home
      const isObjective = /objective-\d+\.html$/i.test(href) || /objective-1\.html$/i.test(href);
      const isHome = /home\.html$/i.test(href);
      if (!isObjective && !isHome) return; // let default navigation occur
      e.preventDefault();

      const isObj1 = /objective-1\.html$/i.test(href);
      const isObj2 = /objective-2\.html$/i.test(href);

      const sourceFrame = document.querySelector('.image-interactive');
      if (!sourceFrame) { window.location.href = href; return; }
      const rect = sourceFrame.getBoundingClientRect();

      const frame = document.createElement('div');
      frame.className = 'transition-frame image-interactive';
      frame.style.left = rect.left + 'px';
      frame.style.top = rect.top + 'px';
      frame.style.width = rect.width + 'px';
      frame.style.height = rect.height + 'px';

      const img = document.createElement('img');
      img.className = 'transition-image';
      // Show specific default images per objective when navigating
      if (isObj1) {
        img.src = 'images/Obj1B.jpeg';
        img.alt = 'obj1B';
      } else if (isObj2) {
        img.src = 'images/happy1.jpeg';
        img.alt = 'happy1';
      } else {
        const currentImg = sourceFrame.querySelector('img');
        img.src = currentImg ? currentImg.src : 'images/IMG_3724.jpeg';
        img.alt = 'transition';
      }

      frame.appendChild(img);
      document.body.appendChild(frame);

      // Animate frame to fullscreen
      const animMs = 650;
      frame.style.transition = `left ${animMs}ms ease, top ${animMs}ms ease, width ${animMs}ms ease, height ${animMs}ms ease`;
      requestAnimationFrame(() => {
        frame.style.left = '0px';
        frame.style.top = '0px';
        frame.style.width = window.innerWidth + 'px';
        frame.style.height = window.innerHeight + 'px';
      });

      // Bubble flourish for Objective 1 while enlarged
      const startBubbles = () => {
        if (!isObj1) return;
        const waves = 2;
        const perWave = 28;
        for (let w = 0; w < waves; w++) {
          setTimeout(() => {
            for (let i = 0; i < perWave; i++) {
              const x = Math.random() * window.innerWidth;
              const y = Math.random() * window.innerHeight;
              spawnBubblesAt(frame, x, y, { countMin: 3, countMax: 5, sizeMin: 12, sizeMax: 26, durMin: 1800, durMax: 3000, delayMax: 180 });
            }
          }, w * 220);
        }
      };

      // Fur fall flourish for Objective 2 while enlarged
      const startFurFall = () => {
        if (!isObj2) return;
        const waves = 4;
        const perWave = 28;
        for (let w = 0; w < waves; w++) {
          setTimeout(() => {
            for (let i = 0; i < perWave; i++) {
              spawnFurAt(frame, 0, 0, { sizeMin: 22, sizeMax: 34, durMin: 1700, durMax: 2600, delayMax: 180 });
            }
          }, w * 200);
        }
      };

      setTimeout(startBubbles, 300);
      // For Objective 2, start fur after the grow so the frame is fully large
      if (isObj2) {
        setTimeout(startFurFall, animMs + 40);
      } else {
        setTimeout(startFurFall, 300);
      }

      // Navigate after animation + flourish
      if (isObj2 || isObj1 || isHome) {
        // For Wash/Brush the Belly and Home, grow, then shrink back into place, then navigate.
        setTimeout(() => {
          frame.style.left = rect.left + 'px';
          frame.style.top = rect.top + 'px';
          frame.style.width = rect.width + 'px';
          frame.style.height = rect.height + 'px';
        }, animMs + 200);

        setTimeout(() => {
          window.location.href = href;
        }, animMs * 2 + 350);
      } else {
        setTimeout(() => {
          window.location.href = href;
        }, animMs + 600);
      }
    });
  });
}

// Small utility helpers reused across particle effects
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function spawnBubblesAt(container, clientX, clientY, opts = {}) {
  const rect = container.getBoundingClientRect();
  const localX = clientX;
  const localY = clientY;
  const countMin = opts.countMin ?? 6;
  const countMax = opts.countMax ?? 9;
  const sizeMin = opts.sizeMin ?? 12;
  const sizeMax = opts.sizeMax ?? 24;
  const durMin = opts.durMin ?? 1800;
  const durMax = opts.durMax ?? 3000;
  const delayMax = opts.delayMax ?? 240;
  const count = randInt(countMin, countMax);
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = randInt(sizeMin, sizeMax);
    const offsetX = (Math.random() - 0.5) * 50; // +/-25px
    const offsetY = (Math.random() - 0.5) * 20; // +/-10px
    const driftX = (Math.random() - 0.5) * 50;  // horizontal drift during rise
    const rise = 120 + Math.floor(Math.random() * 60); // variable rise height
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = clamp(localX + offsetX, 0, rect.width - size) + 'px';
    b.style.top = clamp(localY + offsetY, 0, rect.height - size) + 'px';
    b.style.animationDuration = (durMin + randInt(0, durMax - durMin)) + 'ms';
    b.style.animationDelay = randInt(0, delayMax) + 'ms';
    b.style.setProperty('--driftX', driftX + 'px');
    b.style.setProperty('--rise', rise + 'px');
    container.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
}

// Fur particles for transitions (e.g., Brush the Belly tab)
function spawnFurAt(container, clientX, clientY, opts = {}) {
  const rect = container.getBoundingClientRect();
  const countMin = opts.countMin ?? 4;
  const countMax = opts.countMax ?? 7;
  const sizeMin = opts.sizeMin ?? 22;
  const sizeMax = opts.sizeMax ?? 34;
  const durMin = opts.durMin ?? 900;   // faster fall for transition
  const durMax = opts.durMax ?? 1300;
  const delayMax = opts.delayMax ?? 220;
  const count = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
  for (let i = 0; i < count; i++) {
    const f = document.createElement('div');
    f.className = 'fur';
    // Use straight-down fall animation for transition
    f.style.animationName = 'furFall';
    const size = sizeMin + Math.floor(Math.random() * (sizeMax - sizeMin + 1));
    // Spread across the full width, start very near the top of the enlarged frame
    const baseX = Math.random() * rect.width;
    const baseY = rect.height * (0.02 + Math.random() * 0.08); // ~2–10% height
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;
    const driftStartX = (Math.random() - 0.5) * 18;
    const driftMidX = driftStartX + (Math.random() - 0.5) * 26;
    const driftEndX = driftMidX + (Math.random() - 0.5) * 32;
    // Fall toward the lower part of the enlarged frame from this top band
    const fallY = rect.height * (0.7 + Math.random() * 0.25);
    const dur = durMin + Math.floor(Math.random() * (durMax - durMin + 1));
    f.style.width = size + 'px';
    f.style.height = size + 'px';
    f.style.left = Math.max(0, Math.min(rect.width - size, baseX + offsetX)) + 'px';
    f.style.top = Math.max(0, Math.min(rect.height - size, baseY + offsetY)) + 'px';
    f.style.setProperty('--driftStartX', driftStartX + 'px');
    f.style.setProperty('--driftMidX', driftMidX + 'px');
    f.style.setProperty('--driftEndX', driftEndX + 'px');
    f.style.setProperty('--fallY', fallY + 'px');
    f.style.setProperty('--dur', dur + 'ms');
    // Stagger start times so fur doesn't appear in straight lines
    f.style.animationDelay = Math.floor(Math.random() * delayMax) + 'ms';
    container.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
  }
}

// Fill control 
let clickCount = 0;
const maxClicks = 25;
let celebrationPlayed = false;

function updateFill(count) {
  const fillEl = document.querySelector('.meter-fill');
  if (!fillEl) return;
  const fraction = count / maxClicks;
  const heightPct = Math.round(fraction * 100);
  fillEl.style.height = heightPct + '%';

  // interpolate color from green (0,200,0) to red (255,0,0)
  const start = { r: 255, g: 0, b: 0 };
  const end = { r: 0, g: 180, b: 0 };
  const r = Math.round(start.r + (end.r - start.r) * fraction);
  const g = Math.round(start.g + (end.g - start.g) * fraction);
  const b = Math.round(start.b + (end.b - start.b) * fraction);
  fillEl.style.background = `rgb(${r}, ${g}, ${b})`;

  // When full, reveal final image and completion text without requiring a click
  if (fraction >= 1) {
    // Play celebration sound once for all objectives
    if (!celebrationPlayed && typeof celebrationSound !== 'undefined' && celebrationSound) {
      celebrationSound.play();
      celebrationPlayed = true;
    }
    const imgElem = document.getElementById('interactive-img');
    if (imgElem) {
      const src = imgElem.getAttribute('src') || '';
      const onObj2 = /objective-2\.html$/i.test(window.location.pathname);
      if (onObj2) {
        imgElem.src = 'images/happy2.jpeg';
        imgElem.alt = 'happy2';
        // Big fur fall burst inside the image area on completion
        const frame = imgElem.closest('.image-interactive');
        if (frame) {
          const rect = frame.getBoundingClientRect();
          const batches = 3;
          const perBatch = 12;
          for (let b = 0; b < batches; b++) {
            setTimeout(() => {
              for (let i = 0; i < perBatch; i++) {
                const fx = rect.left + Math.random() * rect.width;
                const fy = rect.top + Math.random() * (rect.height * 0.4);
                const f = document.createElement('div');
                f.className = 'fur';
                const size = 24 + Math.floor(Math.random() * 18);
                const localX = fx - rect.left;
                const localY = fy - rect.top;
                const driftStartX = (Math.random() - 0.5) * 10;
                const driftMidX = driftStartX + (Math.random() - 0.5) * 20;
                const driftEndX = driftMidX + (Math.random() - 0.5) * 30;
                const fallY = 120 + Math.floor(Math.random() * 100);
                const dur = 1700 + Math.floor(Math.random() * 1200);
                f.style.width = size + 'px';
                f.style.height = size + 'px';
                f.style.left = Math.max(0, Math.min(rect.width - size, localX)) + 'px';
                f.style.top = Math.max(0, Math.min(rect.height - size, localY)) + 'px';
                f.style.setProperty('--driftStartX', driftStartX + 'px');
                f.style.setProperty('--driftMidX', driftMidX + 'px');
                f.style.setProperty('--driftEndX', driftEndX + 'px');
                f.style.setProperty('--fallY', fallY + 'px');
                f.style.setProperty('--dur', dur + 'ms');
                frame.appendChild(f);
                f.addEventListener('animationend', () => f.remove());
              }
            }, b * 220);
          }
        }
      } else {
        const isObj1Stage = /Obj1B\.jpeg/i.test(src);
        const alreadyFinal = /obj1C\.jpeg/i.test(src);
        if (isObj1Stage && !alreadyFinal) {
          imgElem.src = 'images/obj1C.jpeg';
          imgElem.alt = 'obj1C';
        }
      }
    }
    const desc = document.querySelector('.description');
    if (desc) {
      const onObj2 = /objective-2\.html$/i.test(window.location.pathname);
      desc.textContent = onObj2
        ? 'complete! move on to the next objective'
        : 'complete! move on to the next task.';
    }
  }
}




