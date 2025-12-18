window.onerror = (m, s, l) => {
  alert(`JS Error: ${m} (line ${l})`);
  return true;
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

/* ---------- AUDIO NORMALISER ---------- */
function safeAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  a.onerror = () => console.warn("Audio failed:", src);
  return a;
}

/* ---------- PLAYERS ---------- */
const players = [
  {
    id: "p1",
    img: "assets/player.png",
    jump: "assets/jump.opus",
    end: "assets/end.opus",
    unlocked: true
  },
  {
    id: "p2",
    img: "assets/char_friend1.jpg",
    jump: "assets/char_friend1_jump.mp3",
    end: "assets/char_friend1_end.mp3",
    code: "4729"
  }
];

let currentPlayer = players[0];

const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = safeAudio(currentPlayer.jump);
let endSound = safeAudio(currentPlayer.end);

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let score = 0;
let speed = 3;
let obstacleTimer = null;

let isNight = false;
let stars = [];

const gravity = 0.9;

const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

let obstacles = [];

/* ---------- PLAYER SELECT ---------- */
function clearSelection() {
  document.querySelectorAll(".player-card")
    .forEach(c => c.classList.remove("selected"));
}

function selectPlayer(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code) {
    const unlocked = localStorage.getItem("unlock_" + p.id);
    if (!unlocked) {
      const input = prompt("Enter 4-digit code:");
      if (input !== p.code) return alert("Wrong code 😅");
      localStorage.setItem("unlock_" + p.id, "true");
    }
  }

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = safeAudio(p.jump);
  endSound = safeAudio(p.end);

  clearSelection();
  document.getElementById("card-" + id).classList.add("selected");
}

/* ---------- NIGHT MODE HELPERS ---------- */
function generateStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 120,
      r: Math.random() * 1.5 + 0.5
    });
  }
}

/* ---------- GAME LOGIC ---------- */
function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40
  });
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawCactus(o, color) {
  ctx.fillStyle = color;
  ctx.fillRect(o.x, o.y, 18, 40);
  ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
}

function drawStars() {
  ctx.fillStyle = "#fff";
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMoon() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(720, 60, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- GAME LOOP ---------- */
function gameLoop() {
  if (!gameRunning) return;

  // Toggle night mode every 600 score
  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
    if (isNight) generateStars();
  }

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isNight) {
    drawStars();
    drawMoon();
  }

  // Player physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  obstacles.forEach(o => {
    o.x -= speed;
    drawCactus(o, fg);

    if (isColliding(player, o)) {
      gameRunning = false;
      endSound.currentTime = 0;
      endSound.play();
      startScreen.style.display = "flex";
      startBtn.textContent = "RETRY";
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  score++;
  speed += 0.0005;

  ctx.fillStyle = fg;
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

/* ---------- INPUT ---------- */
function jump() {
  if (!player.jumping && gameRunning) {
    player.vy = -22;
    player.jumping = true;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

/* ---------- START ---------- */
startBtn.onclick = () => {
  startScreen.style.display = "none";

  obstacles = [];
  score = 0;
  speed = 3;
  isNight = false;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;

  if (obstacleTimer) clearInterval(obstacleTimer);

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  gameRunning = true;
  spawnObstacle();
  obstacleTimer = setInterval(spawnObstacle, 1700);
  gameLoop();
};
