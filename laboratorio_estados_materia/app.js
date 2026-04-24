const canvas = document.getElementById("matterCanvas");
const ctx = canvas.getContext("2d");
const slider = document.getElementById("temperatureSlider");
const thermoFill = document.getElementById("thermoFill");
const tempBubble = document.getElementById("tempBubble");
const materialTag = document.getElementById("materialTag");
const stateRibbon = document.getElementById("stateRibbon");
const materialList = document.getElementById("materialList");
const infoMaterial = document.getElementById("infoMaterial");
const infoState = document.getElementById("infoState");
const infoTemp = document.getElementById("infoTemp");
const kidNote = document.getElementById("kidNote");
const toggleButton = document.getElementById("toggleButton");
const resetButton = document.getElementById("resetButton");
const stateButtons = [...document.querySelectorAll(".state-buttons button")];

const materials = [
  {
    id: "agua",
    name: "Agua",
    icon: "💧",
    color: "#4cc9f0",
    glow: "#b9f4ff",
    startTemp: 45,
    viscosity: 1,
    example: "El agua puede quedarse quieta como hielo, correr como liquido o subir como vapor."
  },
  {
    id: "jugo",
    name: "Jugo",
    icon: "🧃",
    color: "#ff9f1c",
    glow: "#ffe29a",
    startTemp: 48,
    viscosity: 0.86,
    example: "El jugo normalmente se ve liquido: se mueve y toma la forma del vaso."
  },
  {
    id: "gelatina",
    name: "Gelatina",
    icon: "🍮",
    color: "#ff5da2",
    glow: "#ffc2df",
    startTemp: 26,
    viscosity: 1.8,
    example: "La gelatina es blandita: sus particulas se mueven poco y parecen pegaditas."
  },
  {
    id: "helado",
    name: "Helado",
    icon: "🍦",
    color: "#a7f3d0",
    glow: "#effff7",
    startTemp: 12,
    viscosity: 2.1,
    example: "El helado frio se queda solido; con calor se derrite y cambia a liquido."
  },
  {
    id: "chocolate",
    name: "Chocolate",
    icon: "🍫",
    color: "#b77945",
    glow: "#ffd9b1",
    startTemp: 22,
    viscosity: 1.55,
    example: "El chocolate puede estar duro, pero si recibe calor se derrite."
  },
  {
    id: "gaseosa",
    name: "Gaseosa",
    icon: "🥤",
    color: "#7dd3fc",
    glow: "#ffffff",
    startTemp: 52,
    viscosity: 0.74,
    example: "La gaseosa es liquida y tiene burbujas de gas que suben rapido."
  },
  {
    id: "aire",
    name: "Aire",
    icon: "💨",
    color: "#dbeafe",
    glow: "#ffffff",
    startTemp: 82,
    viscosity: 0.45,
    example: "El aire es gas: se separa y ocupa todo el espacio disponible."
  }
];

const stateLabels = {
  solid: "Solido",
  liquid: "Liquido",
  gas: "Gas"
};

const stateTemperature = {
  solid: 14,
  liquid: 48,
  gas: 84
};

let currentMaterial = materials[0];
let currentState = "liquid";
let targetState = "liquid";
let particles = [];
let running = true;
let animationFrame = 0;
let lastTime = 0;

class Particle {
  constructor(index) {
    this.index = index;
    this.radius = 8 + Math.random() * 2.8;
    this.x = 80 + Math.random() * (canvas.width - 160);
    this.y = 80 + Math.random() * (canvas.height - 160);
    this.vx = 0;
    this.vy = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.phase = Math.random() * Math.PI * 2;
    this.resetVelocity();
  }

  resetVelocity() {
    const speed = getSpeedForState(currentState) / currentMaterial.viscosity;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  setSolidTarget(cols, spacing, startX, startY) {
    const row = Math.floor(this.index / cols);
    const col = this.index % cols;
    this.targetX = startX + col * spacing;
    this.targetY = startY + row * spacing;
  }

  update(delta) {
    const temp = Number(slider.value);
    const heatBoost = 0.55 + temp / 100;

    if (currentState === "solid") {
      const wobble = 1.8 + temp * 0.025;
      this.phase += delta * (0.006 + temp * 0.00008);
      this.x += (this.targetX + Math.cos(this.phase) * wobble - this.x) * 0.08;
      this.y += (this.targetY + Math.sin(this.phase * 1.25) * wobble - this.y) * 0.08;
      return;
    }

    if (currentState === "liquid") {
      this.vx += Math.sin((this.y + this.phase) * 0.018) * 0.018;
      this.vy += Math.cos((this.x + this.phase) * 0.014) * 0.012;
      this.vy += 0.012;
      this.limitSpeed((1.2 + temp * 0.028) / currentMaterial.viscosity);
    }

    if (currentState === "gas") {
      this.vx += (Math.random() - 0.5) * 0.1 * heatBoost;
      this.vy += (Math.random() - 0.5) * 0.1 * heatBoost;
      this.limitSpeed((2.6 + temp * 0.05) / currentMaterial.viscosity);
    }

    this.x += this.vx * delta * 0.06;
    this.y += this.vy * delta * 0.06;
    this.bounce();
  }

  limitSpeed(max) {
    const speed = Math.hypot(this.vx, this.vy) || 1;
    if (speed > max) {
      this.vx = (this.vx / speed) * max;
      this.vy = (this.vy / speed) * max;
    }
    if (speed < max * 0.45) {
      this.vx *= 1.05;
      this.vy *= 1.05;
    }
  }

  bounce() {
    const margin = this.radius + 16;
    const bottomLimit = currentState === "liquid" ? canvas.height - 40 : canvas.height - margin;
    const topLimit = currentState === "liquid" ? canvas.height * 0.38 : margin;

    if (this.x < margin || this.x > canvas.width - margin) {
      this.vx *= -1;
      this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
    }

    if (this.y < topLimit || this.y > bottomLimit) {
      this.vy *= -1;
      this.y = Math.max(topLimit, Math.min(bottomLimit, this.y));
    }
  }

  draw() {
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      1,
      this.x,
      this.y,
      this.radius * 1.8
    );
    gradient.addColorStop(0, currentMaterial.glow);
    gradient.addColorStop(0.45, currentMaterial.color);
    gradient.addColorStop(1, "rgba(255,255,255,0.08)");

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

function getSpeedForState(state) {
  if (state === "solid") return 0.35;
  if (state === "liquid") return 1.55;
  return 3.9;
}

function stateFromTemperature(temp) {
  if (temp < 32) return "solid";
  if (temp > 68) return "gas";
  return "liquid";
}

function createParticles() {
  particles = Array.from({ length: 72 }, (_, index) => new Particle(index));
  arrangeParticles(true);
}

function arrangeParticles(force = false) {
  const cols = 9;
  const spacing = Math.min(45, canvas.width / 13);
  const gridWidth = (cols - 1) * spacing;
  const startX = canvas.width / 2 - gridWidth / 2;
  const startY = canvas.height * 0.5 - 150;

  particles.forEach((particle) => {
    if (currentState === "solid") {
      particle.setSolidTarget(cols, spacing, startX, startY);
      if (force) {
        particle.x = particle.targetX + (Math.random() - 0.5) * 4;
        particle.y = particle.targetY + (Math.random() - 0.5) * 4;
      }
      return;
    }

    if (currentState === "liquid") {
      particle.targetX = 58 + Math.random() * (canvas.width - 116);
      particle.targetY = canvas.height * 0.56 + Math.random() * (canvas.height * 0.31);
      if (force) {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
      }
    }

    if (currentState === "gas") {
      particle.targetX = 40 + Math.random() * (canvas.width - 80);
      particle.targetY = 44 + Math.random() * (canvas.height - 110);
      if (force) {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
      }
    }

    particle.resetVelocity();
  });
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";

  for (let y = 92; y < canvas.height - 42; y += 72) {
    ctx.fillRect(22, y, 20, 2);
  }

  if (currentState === "liquid") {
    const level = canvas.height * 0.5;
    ctx.fillStyle = hexToRgba(currentMaterial.color, 0.12);
    ctx.beginPath();
    ctx.moveTo(0, level + 18);
    for (let x = 0; x <= canvas.width; x += 24) {
      ctx.lineTo(x, level + Math.sin((x + performance.now() * 0.002) * 0.035) * 8);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  if (currentState === "gas") {
    ctx.fillStyle = hexToRgba(currentMaterial.color, 0.08);
    for (let i = 0; i < 8; i += 1) {
      const x = ((performance.now() * 0.018 + i * 91) % canvas.width);
      const y = 60 + ((i * 47) % (canvas.height - 150));
      ctx.beginPath();
      ctx.arc(x, y, 32 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function animate(time = 0) {
  const delta = Math.min(32, time - lastTime || 16);
  lastTime = time;

  drawBackground();
  particles.forEach((particle) => {
    if (running) particle.update(delta);
    particle.draw();
  });

  animationFrame = requestAnimationFrame(animate);
}

function renderMaterials() {
  materialList.innerHTML = "";
  materials.forEach((material) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material-button";
    button.dataset.material = material.id;
    button.innerHTML = `
      <span>${material.icon}</span>
      <strong>${material.name}</strong>
      <small>${stateLabels[stateFromTemperature(material.startTemp)]}</small>
    `;
    button.addEventListener("click", () => selectMaterial(material.id));
    materialList.appendChild(button);
  });
}

function selectMaterial(id) {
  currentMaterial = materials.find((material) => material.id === id) || materials[0];
  slider.value = currentMaterial.startTemp;
  syncStateFromTemperature(true);
  updateUI();
}

function syncStateFromTemperature(force = false) {
  const nextState = stateFromTemperature(Number(slider.value));
  if (force || nextState !== targetState) {
    targetState = nextState;
    currentState = nextState;
    arrangeParticles(false);
  }
}

function setState(state) {
  slider.value = stateTemperature[state];
  currentState = state;
  targetState = state;
  arrangeParticles(false);
  updateUI();
}

function updateUI() {
  const temp = Number(slider.value);
  const tempC = Math.round(-10 + temp * 1.35);
  const stateName = stateLabels[currentState];

  materialTag.textContent = `${currentMaterial.icon} ${currentMaterial.name}`;
  stateRibbon.textContent = stateName;
  tempBubble.textContent = `${tempC}°C`;
  infoMaterial.textContent = currentMaterial.name;
  infoState.textContent = stateName;
  infoTemp.textContent = `${tempC}°C`;
  kidNote.textContent = currentMaterial.example;

  thermoFill.style.setProperty("--thermo-level", `${Math.max(8, temp)}%`);
  thermoFill.style.background = temp < 32
    ? "linear-gradient(180deg, #8ecae6, #4cc9f0)"
    : temp > 68
      ? "linear-gradient(180deg, #ffd166, #ff3d71)"
      : "linear-gradient(180deg, #ffd166, #ff9f1c)";

  document.querySelectorAll(".material-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.material === currentMaterial.id);
  });

  stateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.state === currentState);
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  arrangeParticles(true);
}

slider.addEventListener("input", () => {
  syncStateFromTemperature(false);
  updateUI();
});

toggleButton.addEventListener("click", () => {
  running = !running;
  toggleButton.textContent = running ? "⏸️ Pausar" : "▶️ Iniciar";
});

resetButton.addEventListener("click", () => {
  slider.value = currentMaterial.startTemp;
  running = true;
  toggleButton.textContent = "⏸️ Pausar";
  syncStateFromTemperature(true);
  arrangeParticles(true);
  updateUI();
});

stateButtons.forEach((button) => {
  button.addEventListener("click", () => setState(button.dataset.state));
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

renderMaterials();
resizeCanvas();
createParticles();
updateUI();
cancelAnimationFrame(animationFrame);
animate();
