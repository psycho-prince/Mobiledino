/* ================= SETUP ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

const deathMessageEl = document.getElementById("deathMessage");
const scoreTextEl = document.getElementById("scoreText");

/* ================= AUDIO ================= */
function audio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

/* ================= PLAYERS ================= */
const players = [
  { id: "p1", img: "assets/player.png", jump: "assets/jump.opus", end: "assets/end.opus" },
  { id: "p2", img: "assets/char_friend1.jpg", jump: "assets/char_friend1_jump.mp3", end: "assets/char_friend1_end.mp3", code: "4729" }
];

let currentPlayer = players[0];
const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = audio(currentPlayer.jump);
let endSound = audio(currentPlayer.end);

/* ================= DEATH MESSAGES ================= */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "കണ്ണ് തുറന്ന് കളിച്ചാൽ മതിയായിരുന്നു 👀",
  "ഇന്നും reflex vacation എടുത്തു 🏖️",
  "കാക്ടസ്: 1 | നീ: 0 💀",
  "GG bro, next life try 😵"
];

/* ================= GAME STATE ================= */
let running = false;
let gameOver = false;
let score = 0;
let speed = 4;
let phase = "ground";
let groundOffset = 0;
let isNight = false;

const gravity = 1.1;

/* ================= PLAYER ================= */
const player = { x: 50, y: 220, w: 45, h: 45, vy: 0, jumping: false };

/* ================= OBJECTS ================= */
let cacti = [];
let birds = [];
let clouds = [];
let rocks = [];
let stars = [];

/* ================= CHARACTER SELECT ================= */
window.selectPlayer = function(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code && !localStorage.getItem("unlock_" + p.id)) {
    if (prompt("Enter 4-digit code") !== p.code) return;
    localStorage.setItem("unlock_" + p.id, "1");
  }

  document.querySelectorAll(".player-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("card-" + id).classList.add("selected");

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = audio(p.jump);
  endSound = audio(p.end);
};

/* ================= SPAWNERS ================= */
setInterval(() => { if(running) clouds.push({ x: 800, y: 40 + Math.random()*60, w: 40 }); }, 4000);
setInterval(() => { if(running) rocks.push({ x: 800, y: 255, w: 4 + Math.random()*4 }); }, 1500);

// Dynamic Spawner: Switches based on phase
setInterval(() => { 
    if(!running) return;
    if (phase === "ground") {
        cacti.push({ x: 800, y: 220, w: 20, h: 40 });
    } else {
        birds.push({ x: 800, y: 160 + Math.random()*40, w: 30, h: 15 });
    }
}, 1800);

/* ================= HELPERS ================= */
function isColliding(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({ x: Math.random()*800, y: Math.random()*120, r: Math.random()*1.5+0.5 });
  }
}

/* ================= GAME LOOP ================= */
function loop() {
  if (!running) return;

  // Day/Night Cycle Logic
  if (score > 0 && score % 500 === 0) {
    if (!isNight) { isNight = true; generateStars(); }
    else { isNight = false; }
    score++; // prevent rapid flickering
  }

  // Phase & Speed Difficulty
  if (score === 400) phase = "air";
  if (score > 0 && score % 800 === 0) speed += 0.5;

  const bg = isNight ? "#111" : "#fff";
  const fg = isNight ? "#fff" : "#333";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 300);

  // Draw Sun/Moon
  ctx.fillStyle = isNight ? "#eee" : "#ffeb3b";
  ctx.beginPath();
  ctx.arc(720, 50, 20, 0, Math.PI*2);
  ctx.fill();

  if (isNight) {
    ctx.fillStyle = "#fff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
  }

  // Clouds
  clouds.forEach(c => {
    ctx.fillStyle = isNight ? "#444" : "#ddd";
    ctx.fillRect(c.x, c.y, c.w, 8);
    c.x -= 0.5;
  });

  // Road
  ctx.fillStyle = fg;
  for (let i = 0; i < 840; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 12, 2);
  }
  groundOffset = (groundOffset + speed) % 20;

  // Player Physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Rocks
  rocks.forEach(r => { r.x -= speed; ctx.fillRect(r.x, r.y, r.w, 2); });

  // Cacti
  ctx.fillStyle = "#2ecc71"; // Green cacti
  cacti.forEach(o => {
    o.x -= speed;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    if (isColliding(player, o)) endGame();
  });

  // Birds
  ctx.fillStyle = isNight ? "#e74c3c" : "#333";
  birds.forEach(b => {
    b.x -= speed + 1.5;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (isColliding(player, b)) endGame();
  });

  // Cleanup
  cacti = cacti.filter(o => o.x + 50 > 0);
  birds = birds.filter(b => b.x + 50 > 0);
  clouds = clouds.filter(c => c.x + 50 > 0);
  rocks = rocks.filter(r => r.x + 10 > 0);

  score++;
  ctx.fillStyle = fg;
  ctx.font = "bold 16px Courier New";
  ctx.fillText("SCORE: " + score, 20, 30);

  requestAnimationFrame(loop);
}

/* ================= GAME OVER ================= */
function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;
  endSound.play();

  setTimeout(() => {
    deathMessageEl.textContent = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    scoreTextEl.textContent = "FINAL SCORE: " + score;
    deathMessageEl.style.display = "block";
    scoreTextEl.style.display = "block";
    startBtn.style.display = "none";
    retryBtn.style.display = homeBtn.style.display = "inline-block";
    startScreen.style.display = "flex";
  }, 400);
}

/* ================= INPUT ================= */
function handleInput() {
    if (!player.jumping && running) {
        player.vy = -18;
        player.jumping = true;
        jumpSound.play();
    }
}
document.addEventListener("keydown", (e) => { if(e.code === "Space") handleInput(); });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handleInput(); }, {passive: false});

/* ================= BUTTONS ================= */
startBtn.onclick = retryBtn.onclick = () => {
  startScreen.style.display = "none";
  cacti = []; birds = []; clouds = []; rocks = [];
  score = 0; speed = 4; phase = "ground"; isNight = false;
  running = true; gameOver = false;
  loop();
};

homeBtn.onclick = () => location.reload();

