const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

const titleEl = document.getElementById("title");
const deathMessageEl = document.getElementById("deathMessage");
const scoreTextEl = document.getElementById("scoreText");

/* ---------- AUDIO ---------- */
function safeAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
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

/* ---------- MALAYALAM MEME DEATH MESSAGES ---------- */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "കണ്ണ് തുറന്ന് കളിച്ചാൽ മതിയായിരുന്നു 👀",
  "പറന്ന പക്ഷിയെ നോക്കി നിന്നോ 😌",
  "ഇന്നും reflex vacation എടുത്തു 🏖️",
  "കാക്ടസ്: 1  |  നീ: 0 💀",
  "GG bro, next life try 😵"
];

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let isGameOver = false;
let score = 0;
let speed = 3;
let phase = "ground";
let obstacleTimer = null;

const gravity = 0.9;

/* ---------- PLAYER ---------- */
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

let obstacles = [];
let birds = [];

/* ---------- SPAWN ---------- */
function spawnObstacle() {
  if (phase !== "ground") return;
  obstacles.push({ x: canvas.width, y: 230, w: 18, h: 40 });
}

function spawnBird() {
  if (phase !== "air") return;
  if (birds.length > 0) return;

  birds.push({
    x: canvas.width,
    y: Math.random() > 0.5 ? 160 : 200,
    w: 30,
    h: 12
  });
}

/* ---------- COLLISION ---------- */
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* ---------- GAME LOOP ---------- */
function gameLoop() {
  if (!gameRunning) return;

  if (score < 400) phase = "ground";
  else phase = "air";

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    ctx.fillRect(o.x, o.y, 18, 40);
    if (isColliding(player, o)) endGame();
  });

  birds.forEach(b => {
    b.x -= speed + 1;
    ctx.fillRect(b.x, b.y, 18, 6);
    if (isColliding(player, b)) endGame();
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);

  spawnBird();

  score++;
  ctx.fillStyle = "#000";
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

/* ---------- END GAME ---------- */
function endGame() {
  if (isGameOver) return;
  isGameOver = true;
  gameRunning = false;

  const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];

  endSound.currentTime = 0;
  endSound.play();

  setTimeout(() => {
    startScreen.style.display = "flex";

    titleEl.textContent = "💀 You Lost";
    deathMessageEl.textContent = msg;
    scoreTextEl.textContent = `Score: ${score}`;

    deathMessageEl.style.display = "block";
    scoreTextEl.style.display = "block";

    startBtn.style.display = "none";
    retryBtn.style.display = "inline-block";
    homeBtn.style.display = "inline-block";
  }, 900); // allow audio to hit
}

/* ---------- INPUT ---------- */
function jump() {
  if (!player.jumping && gameRunning && !isGameOver) {
    player.vy = -22;
    player.jumping = true;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

/* ---------- BUTTONS ---------- */
startBtn.onclick = startGame;
retryBtn.onclick = startGame;
homeBtn.onclick = () => location.reload();

function startGame() {
  startScreen.style.display = "none";

  obstacles = [];
  birds = [];
  score = 0;
  speed = 3;
  phase = "ground";
  isGameOver = false;

  player.y = 220;
  player.vy = 0;
  player.jumping = false;

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  if (obstacleTimer) clearInterval(obstacleTimer);
  obstacleTimer = setInterval(spawnObstacle, 2200);

  gameRunning = true;
  gameLoop();
    }
