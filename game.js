const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

let gameRunning = false;
let score = 0;

const playerImg = new Image();
playerImg.src = "assets/player.png";

const obstacleImg = new Image();
obstacleImg.src = "assets/obstacle.png";

const jumpSound = new Audio("assets/jump.mp3");

const player = {
  x: 50,
  y: 220,
  w: 40,
  h: 40,
  vy: 0,
  jumping: false
};

let obstacles = [];
const gravity = 1.2;
let speed = 4;

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 30,
    h: 30
  });
}

function collision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function resetGame() {
  obstacles = [];
  score = 0;
  speed = 4;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // player physics
  player.vy += gravity;
  player.y += player.vy;

  if (player.y > 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // obstacles
  obstacles.forEach(o => {
    o.x -= speed;
    ctx.drawImage(obstacleImg, o.x, o.y, o.w, o.h);

    if (collision(player, o)) {
      gameRunning = false;
      startScreen.style.display = "flex";
      startBtn.innerText = "RETRY";
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // score
  score++;
  speed += 0.0005;
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

// controls
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

// start game
startBtn.onclick = () => {
  startScreen.style.display = "none";
  resetGame();
  gameRunning = true;

  // unlock audio (browser rule)
  jumpSound.play();
  jumpSound.pause();

  spawnObstacle();
  setInterval(spawnObstacle, 2000);
  gameLoop();
};
