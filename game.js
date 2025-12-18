/* ================= SETUP & STATE ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const [startBtn, retryBtn, homeBtn] = [document.getElementById("startBtn"), document.getElementById("retryBtn"), document.getElementById("homeBtn")];
const [deathMsg, scoreMsg] = [document.getElementById("deathMessage"), document.getElementById("scoreText")];

let running = false, gameOver = false, score = 0, speed = 5, phase = "ground", isNight = false;
const gravity = 1.2;

/* ================= PLAYER OBJECT ================= */
const player = { 
    x: 50, y: 220, w: 44, h: 48, vy: 0, 
    jumping: false, 
    ducking: false,
    baseH: 48 // Original height to restore after ducking
};

/* ================= ASSETS ================= */
const players = [
    { id: "p1", img: "assets/player.png", jump: "assets/jump.opus", end: "assets/end.opus" },
    { id: "p2", img: "assets/char_friend1.jpg", jump: "assets/char_friend1_jump.mp3", end: "assets/char_friend1_end.mp3", code: "4729" }
];
let currentPlayer = players[0];
const pImg = new Image(); pImg.src = currentPlayer.img;
const audio = (s) => { let a = new Audio(s); a.preload = "auto"; return a; };
let jSound = audio(currentPlayer.jump), eSound = audio(currentPlayer.end);

const deathMessages = ["ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭", "reflex vacation എടുത്തു 🏖️", "കാക്ടസ്: 1 | നീ: 0 💀"];

/* ================= GAME OBJECTS ================= */
let obstacles = [], clouds = [], stars = [];

/* ================= CORE LOGIC ================= */
function spawnObstacle() {
    if (!running) return;
    const type = (score > 600 && Math.random() > 0.5) ? "bird" : "cactus";
    
    if (type === "cactus") {
        obstacles.push({ x: 850, y: 220, w: 25, h: 45, type: "cactus", color: "#2ecc71" });
    } else {
        // High bird (must duck) or Low bird (must jump)
        const isHigh = Math.random() > 0.5;
        obstacles.push({ x: 850, y: isHigh ? 175 : 210, w: 40, h: 20, type: "bird", color: "#e74c3c" });
    }
    // Randomize next spawn time
    setTimeout(spawnObstacle, 1500 + Math.random() * 1500);
}

function checkCollision(p, o) {
    // Tighten hitboxes by 5 pixels for fairness
    return p.x < o.x + o.w - 5 &&
           p.x + p.w - 5 > o.x &&
           p.y < o.y + o.h - 5 &&
           p.y + p.h - 5 > o.y;
}

/* ================= INPUT HANDLING (TOUCH ANYWHERE) ================= */
function handleJump() {
    if (!running || player.jumping || player.ducking) return;
    player.vy = -18;
    player.jumping = true;
    jSound.play();
}

// TOUCH ANYWHERE ON SCREEN
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName === "BUTTON") return; // Don't jump if clicking UI buttons
    handleJump();
}, { passive: false });

// KEYBOARD CONTROLS (Space to Jump, Down to Duck)
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") handleJump();
    if (e.code === "ArrowDown") { player.ducking = true; player.h = 25; player.y = 245; }
});
window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") { player.ducking = false; player.h = player.baseH; player.y = 220; }
});

/* ================= MAIN LOOP ================= */
function loop() {
    if (!running) return;

    // Environment Colors
    if (score > 0 && score % 1000 === 0) isNight = !isNight;
    ctx.fillStyle = isNight ? "#1a1a1a" : "#ffffff";
    ctx.fillRect(0, 0, 800, 300);

    // Update Player
    if (!player.ducking) {
        player.vy += gravity;
        player.y += player.vy;
        if (player.y > 220) { player.y = 220; player.vy = 0; player.jumping = false; }
    }
    ctx.drawImage(pImg, player.x, player.y, player.w, player.h);

    // Update Obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        if (checkCollision(player, o)) endGame();
        if (o.x < -50) obstacles.splice(i, 1);
    });

    // Scoring & Difficulty
    score++;
    if (score % 500 === 0) speed += 0.5;
    
    ctx.fillStyle = isNight ? "#fff" : "#333";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${Math.floor(score/10)}`, 20, 30);

    requestAnimationFrame(loop);
}

function endGame() {
    running = false; gameOver = true; eSound.play();
    setTimeout(() => {
        deathMsg.textContent = deathMessages[Math.floor(Math.random()*deathMessages.length)];
        scoreMsg.textContent = "Score: " + Math.floor(score/10);
        deathMsg.style.display = scoreMsg.style.display = "block";
        startBtn.style.display = "none";
        retryBtn.style.display = homeBtn.style.display = "inline-block";
        startScreen.style.display = "flex";
    }, 500);
}

/* ================= BUTTONS ================= */
startBtn.onclick = retryBtn.onclick = () => {
    startScreen.style.display = "none";
    obstacles = []; score = 0; speed = 5; running = true;
    spawnObstacle(); loop();
};
homeBtn.onclick = () => location.reload();

