const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

/* ---------- AUDIO ---------- */
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

/* ---------- MALAYALAM MEME DEATH MESSAGES ---------- */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "കാക്ടസ് പറഞ്ഞത് കേട്ടില്ല അല്ലേ 🌵",
  "ഇതെന്താ slow motion കളി ആണോ 🤡",
  "ബ്രോ… jump ബട്ടൺ ഉണ്ടല്ലോ 😶",
  "പറന്ന പക്ഷിയെ നോക്കി നിന്നോ 😌",
  "കണ്ണ് തുറന്ന് കളിച്ചാൽ മതിയായിരുന്നു 👀",
  "ഇന്നും reflex vacation എടുത്തു 🏖️",
  "ഇത് skill issue അല്ല, life issue ആണ് 😔",
  "പറന്നത് പക്ഷി… വീണത് നീ 🐦",
  "കാക്ടസ്: 1  |  നീ: 0 💀",
  "ചാടാൻ മറന്നോ അതോ പേടിച്ചോ 😆",
  "ബ്രോ thought he was immortal 🫠",
  "ഇവിടെ jump ചെയ്യണം എന്ന് Google പറഞ്ഞില്ലേ 🤔",
  "അയ്യോ… നേരെ കയറി 🤡",
  "GG bro, next life try 😵"
];

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let isGameOver = false;

let score = 0;
let speed = 3;
let phase = "ground"; // ground | air

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

/* ---------- OBJECTS ---------- */
let obstacles = [];
let birds = [];

/* ---------- BIRD CONTROL ---------- */
let lastBirdTime = 0;
let birdCooldown = 2600;
let lastBirdHigh = false;

/* ---------- CHARACTER LOCK UI ---------- */
function updateCharacterLockUI() {
  players.forEach(p => {
    const card = document.getElementById("card-" + p.id);
    if (!card) return;

    if (p.code && !localStorage.getItem("unlock_" + p.id)) {
      card.classList.add("locked");
    } else {
      card.classList.remove("locked");
    }
  });
}

/* ---------- PLAYER SELECT ---------- */
function selectPlayer(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code && !localStorage.getItem("unlock_" + p.id)) {
    const input = prompt("Enter 4-digit code:");
    if (input !== p.code) return alert("Wrong code 😅");
    localStorage.setItem("unlock_" + p.id, "true");
  }

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = safeAudio(p.jump);
  endSound = safeAudio(p.end);

  updateCharacterLockUI();
}

/* ---------- SPAWN ---------- */
function spawnObstacle() {
  if (phase !== "ground") return;

  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40
  });
}

function spawnBird() {
  if (phase !== "air") return;

  const now = Date.now();
  if (now - lastBirdTime < birdCooldown) return;
  lastBirdTime = now;

  lastBirdHigh = !lastBirdHigh;
  const isFake = Math.random() < 0.2;

  birds = [{
    x: canvas.width,
    y: isFake ? 140 : (lastBirdHigh ? 160 : 200),
    w: 30,
    h: 12,
    fake: isFake
  }];
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

/* ---------- DRAW ---------- */
function drawCactus(o) {
  ctx.fillStyle = "#000";
  ctx.fillRect(o.x, o.y, 18, 40);
  ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
}

function drawBird(b) {
  ctx.fillStyle = b.fake ? "#777" : "#000";
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y - 4, 6, 4);
  ctx.fillRect(b.x + 12, b.y - 4, 6, 4);
}

/* ---------- GAME LOOP ---------- */
function gameLoop() {
  if (!gameRunning) return;

  // Phase logic
  if (score < 400) phase = "ground";
  else phase = "air";

  // Speed milestones
  if (score === 500 || score === 1000 || score === 1500) {
    speed += 0.8;
  }

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    if (isColliding(player, o)) endGame();
  });

  birds.forEach(b => {
    b.x -= speed + 1;
    drawBird(b);
    if (!b.fake && isColliding(player, b)) endGame();
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

  const msg =
    deathMessages[Math.floor(Math.random() * deathMessages.length)];

  endSound.currentTime = 0;
  endSound.play();

  setTimeout(() => {
    startScreen.style.display = "flex";
    startScreen.innerHTML = `
      <h1>💀 Game Over</h1>
      <p style="margin:8px 0;font-size:14px;">${msg}</p>
      <p>Score: ${score}</p>
      <button onclick="retry()">Retry</button>
      <button onclick="goHome()">Main Menu</button>
    `;
  }, 900);
}

function retry() {
  location.reload();
}

function goHome() {
  location.reload();
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

/* ---------- START ---------- */
startBtn.onclick = () => {
  startScreen.style.display = "none";

  obstacles = [];
  birds = [];
  score = 0;
  speed = 3;
  phase = "ground";
  isGameOver = false;
  lastBirdTime = 0;

  player.y = 220;
  player.vy = 0;
  player.jumping = false;

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  gameRunning = true;

  if (obstacleTimer) clearInterval(obstacleTimer);
  obstacleTimer = setInterval(spawnObstacle, 2200);

  gameLoop();
};

updateCharacterLockUI();
