const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

// Player image
const playerImg = new Image();
playerImg.src = "assets/player.png";

// Sounds
const jumpSound = new Audio("assets/jump.opus");
const endSound = new Audio("assets/end.opus");

let gameRunning = false;
let score = 0;
let speed = 5;

const gravity = 1.2;

// Player
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

// Obstacles (cactus)
let obstacles = [];

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 220,
    w: 20,
    h: 40
  });
}

// Collision detection
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Reset
function resetGame() {
  obstacles = [];
  score = 0;
  speed = 5;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
}

// Draw cactus (Dino-style)
function drawCactus(o) {
  ctx.fillStyle = "#000";

  // main stem
  ctx.fillRect(o.x, o.y, o.w, o.h);

  // left arm
  ctx.fillRect(o.x - 8, o.y + 10, 8, 15);

  // right arm
  ctx.fillRect(o.x + o.w, o.y + 15, 8, 12);
}

// Game loop
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player physics
  player.vy += gravity;
  player.y += player.vy;

  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Obstacles
  obstacles.forEach(o => {
    o.x -= speed;
    drawCactus(o);

    if (isColliding(player, o)) {
      gameRunning = false;
      endSound.currentTime = 0;
      endSound.play();

      startScreen.style.display = "flex";
      startBtn.textContent = "RETRY";
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // Score
  score++;
  speed += 0.001;

  ctx.fillStyle = "#000";
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

// Jump
function jump() {
  if (!player.jumping && gameRunning) {
    player.vy = -18;
    player.jumping = true;

    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

// Start
startBtn.onclick = () => {
  startScreen.style.display = "none";
  resetGame();
  gameRunning = true;

  // unlock audio (mobile)
  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  spawnObstacle();
  setInterval(spawnObstacle, 1800);

  gameLoop();
};
