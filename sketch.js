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

  
  function setupInteractiveSwap(imgId) {
    const imgElem = document.getElementById(imgId);
    if (imgElem) {
      imgElem.addEventListener('mousedown', () => {
        imgElem.src = 'images/IMG_6809.jpeg';
        imgElem.alt = '6809';
      });
      imgElem.addEventListener('mouseup', () => {
        imgElem.src = 'images/IMG_3724.jpeg';
        imgElem.alt = '3724';
      });
      imgElem.addEventListener('mouseleave', () => {
        imgElem.src = 'images/IMG_3724.jpeg';
        imgElem.alt = '3724';
      });
      imgElem.addEventListener('touchstart', () => {
        imgElem.src = 'images/IMG_6809.jpeg';
        imgElem.alt = '6809';
      });
      imgElem.addEventListener('touchend', () => {
        imgElem.src = 'images/IMG_3724.jpeg';
        imgElem.alt = '3724';
        clickCount++;
        if (clickCount > maxClicks) clickCount = 0;
        updateFill(clickCount);
      });

      imgElem.addEventListener('click', () => {
        clickCount++;
        if (clickCount > maxClicks) clickCount = 0;
        updateFill(clickCount);
      });
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
}




