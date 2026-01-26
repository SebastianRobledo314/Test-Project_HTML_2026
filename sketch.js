function setup() {
  createCanvas(400, 400);
  // Custom cursor setup (unchanged)
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

  // Interactive image logic for multiple images
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
      });
    }
  }

  setupInteractiveSwap('interactive-img');
  setupInteractiveSwap('center-img'); // If you add a center image with id="center-img"
}




