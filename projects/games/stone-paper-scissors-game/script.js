const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
const choicesList = ["rock", "paper", "scissors"];

let playerScore = 0;
let computerScore = 0;
let streak = 0;

const choiceBtns = document.querySelectorAll(".choice-btn");
const playerPickEl = document.getElementById("playerPick");
const computerPickEl = document.getElementById("computerPick");
const resultText = document.getElementById("resultText");
const playerScoreEl = document.getElementById("playerScore");
const computerScoreEl = document.getElementById("computerScore");
const streakEl = document.getElementById("streakCount");
const resetBtn = document.getElementById("resetBtn");
const battleArena = document.getElementById("battleArena");
const confettiContainer = document.getElementById("confettiContainer");

choiceBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const playerChoice = btn.getAttribute("data-choice");
    startCountdown(playerChoice);
  });
});

function startCountdown(playerChoice) {
  toggleButtons(true);
  battleArena.classList.remove("win-glow", "lose-glow");
  playerPickEl.textContent = "🤔";
  computerPickEl.textContent = "🤔";

  const steps = ["ROCK...", "PAPER...", "SCISSORS...", "SHOOT!"];
  let i = 0;

  resultText.textContent = steps[i];
  playerPickEl.classList.add("shake");
  computerPickEl.classList.add("shake");

  const interval = setInterval(() => {
    i++;
    if (i < steps.length) {
      resultText.textContent = steps[i];
    } else {
      clearInterval(interval);
      playerPickEl.classList.remove("shake");
      computerPickEl.classList.remove("shake");
      const computerChoice = choicesList[Math.floor(Math.random() * 3)];
      playGame(playerChoice, computerChoice);
    }
  }, 400);
}

function playGame(player, computer) {
  playerPickEl.textContent = emojis[player];
  computerPickEl.textContent = emojis[computer];
  playerPickEl.classList.add("pop");
  computerPickEl.classList.add("pop");
  setTimeout(() => {
    playerPickEl.classList.remove("pop");
    computerPickEl.classList.remove("pop");
  }, 400);

  if (player === computer) {
    resultText.textContent = "🤝 It's a Tie!";
    streak = 0;
  } else if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    resultText.textContent = "🎉 You Win!";
    playerScore++;
    streak++;
    playerScoreEl.textContent = playerScore;
    battleArena.classList.add("win-glow");
    launchConfetti();
  } else {
    resultText.textContent = "💥 Computer Wins!";
    computerScore++;
    streak = 0;
    computerScoreEl.textContent = computerScore;
    battleArena.classList.add("lose-glow");
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 400);
  }

  streakEl.textContent = streak;
  toggleButtons(false);
}

function toggleButtons(disabled) {
  choiceBtns.forEach(btn => (btn.disabled = disabled));
}

resetBtn.addEventListener("click", () => {
  playerScore = 0;
  computerScore = 0;
  streak = 0;
  playerScoreEl.textContent = 0;
  computerScoreEl.textContent = 0;
  streakEl.textContent = 0;
  playerPickEl.textContent = "❓";
  computerPickEl.textContent = "❓";
  resultText.textContent = "Choose your weapon!";
  battleArena.classList.remove("win-glow", "lose-glow");
});

function launchConfetti() {
  const colors = ["#00f5ff", "#ff2e88", "#ffd23f"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.classList.add("confetti-piece");
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.width = piece.style.height = Math.random() * 6 + 6 + "px";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = Math.random() * 1.5 + 1.5 + "s";
    confettiContainer.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}