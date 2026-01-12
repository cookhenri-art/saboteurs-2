
// public/game-ui.js
// UI logic for phase actions (V9.2)

function renderAiExchangeButton(state, socket) {
  const container = document.getElementById("phase-actions");
  if (!container) return;

  container.innerHTML = "";

  if (state.phase !== "NIGHT_AI_EXCHANGE") return;

  const actorIds = state.phaseData?.actorIds || [];
  const me = state.you;
  if (!me || !actorIds.includes(me.playerId)) return;

  const btn = document.createElement("button");
  btn.textContent = "✅ Terminer l’échange IA";
  btn.className = "primary";

  btn.onclick = () => {
    socket.emit("phase_ack");
    btn.disabled = true;
    btn.textContent = "⏳ En attente de l’autre joueur…";
  };

  container.appendChild(btn);
}

// Hook to call when state updates
function onGameStateUpdated(state, socket) {
  renderAiExchangeButton(state, socket);
}

window.onGameStateUpdated = onGameStateUpdated;
