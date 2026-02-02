function setup() {
  createCanvas(400, 400);
  // Custom cursor setup 
  let img = new Image();
  img.onload = function() {
    let canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 48, 48);
    let cursorUrl = canvas.toDataURL();
    document.body.style.cursor = `url('${cursorUrl}') 16 16, auto`;
  };
  img.src = 'images/Paw.png';

  // Prepare soap cursor for use inside the image frame
  let soapCursorUrl = null;
  (function preloadSoapCursor(){
    const img = new Image();
    img.onload = function() {
      const c = document.createElement('canvas');
      c.width = 48; c.height = 48;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 48, 48);
      soapCursorUrl = c.toDataURL();
    };
    img.src = 'images/soap3.png';
  })();

  function setupInteractiveSwap(imgId) {
    const imgElem = document.getElementById(imgId);
    if (imgElem) {
      const isObj1Flow = /Obj1B\.jpeg$/i.test(imgElem.getAttribute('src') || '');

      if (isObj1Flow) {
        // Scrub detection: count full horizontal passes inside the image.
        const edgeThresholdPct = 0.15; // 15% from each edge
        let leftSeen = false;
        let rightSeen = false;
        let lastSide = null; // 'left' or 'right'
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
          imgElem.src = 'images/obj1A.jpeg';
          imgElem.alt = 'obj1A';
          clickCount++;
          if (clickCount > maxClicks) clickCount = maxClicks;
          updateFill(clickCount);
          triggerFlashIndicator();
          if (clickCount >= maxClicks) {
            imgElem.src = 'images/obj1C.jpeg';
            imgElem.alt = 'obj1C';
            const desc = document.querySelector('.description');
            if (desc) desc.textContent = 'complete! move on to the next task.';
            celebrateCompletionOnce();
          } else {
            setTimeout(() => {
              imgElem.src = 'images/Obj1B.jpeg';
              imgElem.alt = 'obj1B';
            }, 200);
          }
        }

        function handlePoint(clientX) {
          const rect = imgElem.getBoundingClientRect();
          const width = rect.width;
          const x = clientX - rect.left;
          const leftEdge = x <= width * edgeThresholdPct;
          const rightEdge = x >= width * (1 - edgeThresholdPct);

          if (leftEdge) {
            leftSeen = true;
            lastSide = 'left';
          }
          if (rightEdge) {
            rightSeen = true;
            lastSide = 'right';
          }

          // Count a pass when both edges have been seen in the current sweep
          if (leftSeen && rightSeen && clickCount < maxClicks) {
            flashProgressAndMaybeComplete();
            // Reset for next sweep, bias toward the current edge so a full
            // opposite traversal is required again.
            leftSeen = lastSide === 'left';
            rightSeen = lastSide === 'right';
          }
        }

        imgElem.addEventListener('mousemove', (e) => {
          handlePoint(e.clientX);
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
          leftSeen = false;
          rightSeen = false;
          lastSide = null;
          lastBubbleX = null;
          lastBubbleY = null;
        });

        imgElem.addEventListener('mouseleave', () => {
          leftSeen = false;
          rightSeen = false;
          lastSide = null;
          const frame = imgElem.closest('.image-interactive');
          if (frame) frame.style.cursor = '';
        });

        // Switch to soap cursor inside the image frame
        imgElem.addEventListener('mouseenter', () => {
          const frame = imgElem.closest('.image-interactive');
          if (frame && soapCursorUrl) {
            frame.style.cursor = `url('${soapCursorUrl}') 16 16, auto`;
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
          const count = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
          for (let i = 0; i < count; i++) {
            const b = document.createElement('div');
            b.className = 'bubble';
            const size = sizeMin + Math.floor(Math.random() * (sizeMax - sizeMin + 1));
            const offsetX = (Math.random() - 0.5) * 30; // +/-15px
            const offsetY = (Math.random() - 0.5) * 8;  // +/-4px
            b.style.width = size + 'px';
            b.style.height = size + 'px';
            b.style.left = Math.max(0, Math.min(rect.width - size, localX + offsetX)) + 'px';
            b.style.top = Math.max(0, Math.min(rect.height - size, localY + offsetY)) + 'px';
            b.style.animationDuration = (durMin + Math.floor(Math.random() * (durMax - durMin + 1))) + 'ms';
            b.style.animationDelay = (Math.floor(Math.random() * delayMax)) + 'ms';
            frame.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
          }
        }

        // Touch scrubbing support
        imgElem.addEventListener('touchmove', (e) => {
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          handlePoint(t.clientX);
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
          const frame = imgElem.closest('.image-interactive');
          if (frame) frame.style.cursor = '';
        });

        // Also allow click-to-progress
        imgElem.addEventListener('click', (e) => {
          spawnBubbles(e.clientX, e.clientY, { countMin: 6, countMax: 9, sizeMin: 12, sizeMax: 24, durMin: 1800, durMax: 3000, delayMax: 240 });
          flashProgressAndMaybeComplete();
        });

        // Spawn bubbles on touch tap
        imgElem.addEventListener('touchstart', (e) => {
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          spawnBubbles(t.clientX, t.clientY, { countMin: 6, countMax: 9, sizeMin: 12, sizeMax: 24, durMin: 1800, durMax: 3000, delayMax: 240 });
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
}

// Fill control 
let clickCount = 0;
const maxClicks = 10;

function updateFill(count) {
  const fillEl = document.querySelector('.meter-fill');
  if (!fillEl) return;
  const fraction = count / maxClicks;
  const heightPct = Math.round(fraction * 100);
  fillEl.style.height = heightPct + '%';

  // interpolate color from green (0,200,0) to red (255,0,0)
  const start = { r: 0, g: 180, b: 0 };
  const end = { r: 255, g: 0, b: 0 };
  const r = Math.round(start.r + (end.r - start.r) * fraction);
  const g = Math.round(start.g + (end.g - start.g) * fraction);
  const b = Math.round(start.b + (end.b - start.b) * fraction);
  fillEl.style.background = `rgb(${r}, ${g}, ${b})`;

  // When full, reveal final image and completion text without requiring a click
  if (fraction >= 1) {
    const imgElem = document.getElementById('interactive-img');
    if (imgElem) {
      const src = imgElem.getAttribute('src') || '';
      const isObj1Stage = /Obj1B\.jpeg|obj1A\.jpeg/i.test(src);
      const alreadyFinal = /obj1C\.jpeg/i.test(src);
      if (isObj1Stage && !alreadyFinal) {
        imgElem.src = 'images/obj1C.jpeg';
        imgElem.alt = 'obj1C';
      }
    }
    const desc = document.querySelector('.description');
    if (desc) desc.textContent = 'complete! move on to the next task.';
  }
}




