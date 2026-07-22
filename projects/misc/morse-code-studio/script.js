const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const decodeBtn = document.getElementById("decodeBtn");
const encodeBtn = document.getElementById("encodeBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const playBtn = document.getElementById("playBtn");

const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");

const MORSE = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",

  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",

  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  ":": "---...",
  ";": "-.-.-.",
  "-": "-....-",
  "/": "-..-.",
  "@": ".--.-.",
  "(": "-.--.",
  ")": "-.--.-",

  " ": "/",
};

const REVERSE = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k]),
);

speedSlider.addEventListener("input", () => {
  speedValue.textContent = `${speedSlider.value} ms`;
});

encodeBtn.addEventListener("click", encodeText);
decodeBtn.addEventListener("click", decodeText);

clearBtn.addEventListener("click", clearFields);
copyBtn.addEventListener("click", copyOutput);
playBtn.addEventListener("click", playMorse);

function encodeText() {
  const text = inputText.value.toUpperCase();

  const morse = [];

  for (const char of text) {
    if (MORSE[char]) {
      morse.push(MORSE[char]);
    }
  }

  outputText.value = morse.join(" ");
}

function decodeText() {
  const morse = inputText.value.trim();

  if (!morse) {
    outputText.value = "";
    return;
  }

  const words = morse.split(" / ");

  const decoded = words.map((word) => {
    return word
      .split(" ")
      .map((code) => REVERSE[code] || "?")
      .join("");
  });

  outputText.value = decoded.join(" ");
}

function clearFields() {
  inputText.value = "";
  outputText.value = "";
}

function copyOutput() {
  if (!outputText.value) return;

  navigator.clipboard.writeText(outputText.value);

  copyBtn.textContent = "Copied!";

  setTimeout(() => {
    copyBtn.textContent = "📋 Copy";
  }, 1000);
}

async function playMorse() {
  const morse = outputText.value.trim();

  if (!morse) return;

  const unit = Number(speedSlider.value);

  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  for (const symbol of morse) {
    if (symbol === ".") {
      await beep(ctx, unit);

      await wait(unit);
    } else if (symbol === "-") {
      await beep(ctx, unit * 3);

      await wait(unit);
    } else if (symbol === " ") {
      await wait(unit * 2);
    } else if (symbol === "/") {
      await wait(unit * 6);
    }
  }
}

function beep(ctx, duration) {
  return new Promise((resolve) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = 650;
    oscillator.type = "sine";

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();

      resolve();
    }, duration);
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
