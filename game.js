const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

/* ---------- PLAYERS ---------- */

const players = [
  {
    id: "p1",
    name: "OG Player",
    img: "assets/player.png",
    jump: "assets/jump.opus",
    end: "assets/end.opus",
    unlocked: true
  },
  {
    id: "p2",
    name: "Friend 😈",
    img: "assets/char_friend1.png",
    jump: "assets/char_friend1_jump.opus",
    end: "assets/char_friend1_end.opus",
    code: "4729"
  }
];

let currentPlayer = players[0];

const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = new Audio(currentPlayer.jump);
let endSound = new Audio(currentPlayer.end);

/* ---------- GAME STATE ---------- */

let gameRunning = false;
let score = 0;
let speed = 3.2;
let isNight = false;
let rageMode = false;

const gravity = 0.9;
let shakeFrames = 0;

/* Player physics */
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

/* Environment */
let obstacles = [];
let clouds = [];
let rocks = [];
let stars = [];
let groundOffset = 0;
let spawnTimer = null;

/* Malayalam death messages */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😂",
  "കാക്ടസ് നിന്നെ കളിയാക്കി 🌵",
  "കണ്ണ് തുറന്ന് കളിക്കു ബ്രോ 😭",
  "ചാടാൻ മറന്നോ 😆",
  "ഇന്നും കാക്ടസ് ജയിച്ചു 💀"
];

/* ---------- PLAYER SELECT ---------- */

function selectPlayer(id) {
  const found = players.find(p => p.id === id);
  if (!found) return;

  if (found.code) {
    const unlocked = localStorage.getItem("unlock_" + found.id);
    if (!unlocked) {
      const input = prompt("Enter 4-digit code:");
      if (input !== found.code) {
        alert("Wrong code 😅");
        return;
      }
      localStorage.setItem("unlock_" + found.id, "true");
      alert("Unlocked 🎉");
    }
  }

  currentPlayer = found;
  playerImg.src = found.img;
  jumpSound = new Audio(found.jump);
  endSound = new Audio(found.end);
}

/* ---------- SPAWN ---------- */

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40
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

/* ---------- RESET ---------- */

function resetGame() {
  obstacles = [];
  score = 0;
  speed = 3.2;
  isNight = false;
  rageMode = false;
  shakeFrames = 0;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
}

/* ---------- DRAW ---------- */

function drawCactus(o) {
  ctx.fillStyle = "#000";
  ctx.fillRect(o.x, o.y, 18, 40);
  ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
}

/* ---------- GAME LOOP ---------- */

function gameLoop() {
  if (!gameRunning) return;

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

  obstacles.forEach(o => {
    o.x -= speed;
    drawCactus(o);

    if (isColliding(player, o)) {
      gameRunning = false;
      endSound.currentTime = 0;
      endSound.play();

      const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
      startScreen.style.display = "flex";
      startBtn.textContent = "RETRY – " + msg;
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  score++;
  speed += 0.0005;

  ctx.fillStyle = "#000";
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
  resetGame();
  gameRunning = true;

  if (spawnTimer) clearInterval(spawnTimer);

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  spawnObstacle();
  spawnTimer = setInterval(spawnObstacle, 1700);
  gameLoop();
};
