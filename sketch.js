function setup() {
  createCanvas(window.innerWidth, 400);
}

function draw() {
  background(220);
  drawCat(200, 150);
}

function drawCat(x, y) {
  // Body
  fill(100, 50, 20);  // brown
  rect(x - 40, y + 40, 80, 60);
  
  // Head
  circle(x, y, 50);
  
  // Left ear
  fill(100, 50, 20);
  triangle(x - 20, y - 25, x - 15, y - 50, x - 10, y - 25);
  
  // Right ear
  triangle(x + 20, y - 25, x + 15, y - 50, x + 10, y - 25);
  
  // Left eye
  noStroke();
  fill(255);
  circle(x - 12, y - 5, 8);
  fill(0);
  circle(x - 12, y - 5, 4);
  
  // Right eye
  fill(255);
  circle(x + 12, y - 5, 8);
  fill(0);
  circle(x + 12, y - 5, 4);
  
  // Nose
  fill(255, 100, 150);
  triangle(x - 3, y + 5, x + 3, y + 5, x, y + 10);
  
  // Mouth
  stroke(0);
  strokeWeight(2);
  line(x, y + 10, x - 5, y + 15);
  line(x, y + 10, x + 5, y + 15);
  
  // Tail
  stroke(100, 50, 20);
  strokeWeight(8);
  curve(x + 40, y + 60, x + 50, y + 40, x + 60, y - 20, x + 50, y - 40);
}