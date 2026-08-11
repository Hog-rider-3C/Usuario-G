function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function criarCard({ id, tipo, label, status, value, unidade, lastUpdate }) {
  const card = document.createElement("div");
  card.className = "device-card";

  const statusClass = status === "OK" ? "ok" : "warn";

  card.innerHTML = `
    <div class="device-top">
      <div class="device-title">
        <span class="device-type">${tipo}</span>
        <span class="device-label">${label}</span>
      </div>
      <div class="device-badge ${statusClass}">${status}</div>
    </div>

    <div class="device-value">
      <span class="device-value-num">${value}</span>
      <span class="device-value-unit">${unidade || ""}</span>
    </div>

    <div class="device-meta">
      <span>Última atualização:</span>
      <b>${lastUpdate}</b>
    </div>

    <div class="device-bar">
      <div class="device-bar-fill" style="width:${clamp(Number(value) || 0, 0, 100)}%"></div>
    </div>
  `;

  return card;
}

function nowBR() {
  const d = new Date();
  return d.toLocaleString("pt-BR", { hour12: false });
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  items.forEach((it) => container.appendChild(criarCard(it)));
}

function atualizarResumo(alertasCount, statusGeral, ultimaAtualizacao) {
  const elAlertas = document.getElementById("alertasAtivos");
  const elStatus = document.getElementById("statusGeral");
  const elUltima = document.getElementById("ultimaAtualizacao");

  if (elAlertas) elAlertas.textContent = `${alertasCount} alerta(s)`;
  if (elStatus) elStatus.textContent = statusGeral;
  if (elUltima) elUltima.textContent = ultimaAtualizacao;
}

/* ============================================================
   LEITURA DOS SENSORES VIA USB (Web Serial API)
   O ESP8266 deve enviar pela serial (115200 baud) linhas com
   prefixo para identificar o sensor:

   MQ2:valor|status      Ex.: MQ2:120|OK
   PIR:valor|status      Ex.: PIR:1|OK  ou  PIR:1|ALERTA
   ============================================================ */

let portConnected = false;
let serialReader = null;
let mq2Real = null;
let pirReal = null;
let serialLoopStarted = false;

// Controles do MQ-2
const conectarBtn = document.getElementById("conectarUSB");
const desconectarBtn = document.getElementById("desconectarUSB");
const serialStatusEl = document.getElementById("serialStatus");

// Controles do PIR
const conectarBtnPir = document.getElementById("conectarUSBPir");
const desconectarBtnPir = document.getElementById("desconectarUSBPir");
const serialStatusElPir = document.getElementById("serialStatusPir");

function setStatusMQ2(texto, conectado) {
  if (serialStatusEl) {
    serialStatusEl.textContent = texto;
    serialStatusEl.classList.toggle("conectado", conectado);
  }
  if (conectarBtn) conectarBtn.style.display = conectado ? "none" : "inline-block";
  if (desconectarBtn) desconectarBtn.style.display = conectado ? "inline-block" : "none";
}

function setStatusPIR(texto, conectado) {
  if (serialStatusElPir) {
    serialStatusElPir.textContent = texto;
    serialStatusElPir.classList.toggle("conectado", conectado);
  }
  if (conectarBtnPir) conectarBtnPir.style.display = conectado ? "none" : "inline-block";
  if (desconectarBtnPir) desconectarBtnPir.style.display = conectado ? "inline-block" : "none";
}

// Históricos das leituras
const historicoMQ2 = [];
const historicoPIR = [];

function emojiPIR(valor) {
  return valor === "1" || valor === "1.0" ? "🚶" : "⬜";
}

function atualizarPainelMQ2(valor, status, hora) {
  const elValor = document.getElementById("mq2Valor");
  const elUni = document.getElementById("mq2Unidade");
  const elBadge = document.getElementById("mq2StatusBadge");
  const elBarra = document.getElementById("mq2Barra");
  const elHora = document.getElementById("mq2Hora");

  if (elValor) elValor.textContent = valor;
  if (elUni) elUni.textContent = "ppm";
  if (elHora) elHora.textContent = hora;

  const ok = status === "OK";
  if (elBadge) {
    elBadge.textContent = ok ? "OK" : "ALERTA";
    elBadge.className = "live-badge " + (ok ? "ok" : "warn");
  }

  const num = Number(valor) || 0;
  if (elBarra) elBarra.style.width = clamp(num, 0, 100) + "%";

  // Histórico
  historicoMQ2.unshift({ valor, status, hora });
  if (historicoMQ2.length > 12) historicoMQ2.pop();
  renderHistorico("mq2Historico", historicoMQ2, "ppm");
}

function atualizarPainelPIR(valor, status, hora) {
  const elValor = document.getElementById("pirValor");
  const elUni = document.getElementById("pirUnidade");
  const elBadge = document.getElementById("pirStatusBadge");
  const elBarra = document.getElementById("pirBarra");
  const elHora = document.getElementById("pirHora");

  const detectado = valor === "1" || valor === "1.0";

  if (elValor) elValor.textContent = emojiPIR(valor) + " " + (detectado ? "DETECTOU" : "LIVRE");
  if (elUni) elUni.textContent = "";
  if (elHora) elHora.textContent = hora;

  const ok = status === "OK";
  if (elBadge) {
    elBadge.textContent = ok ? "OK" : "ALERTA";
    elBadge.className = "live-badge " + (ok ? "ok" : "warn");
  }

  if (elBarra) elBarra.style.width = (detectado ? 100 : 0) + "%";

  // Histórico
  historicoPIR.unshift({ valor: detectado ? "Detectado" : "Livre", status, hora });
  if (historicoPIR.length > 12) historicoPIR.pop();
  renderHistorico("pirHistorico", historicoPIR, "");
}

function renderHistorico(containerId, itens, unidade) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (itens.length === 0) {
    container.innerHTML = '<p class="history-empty">Conecte o sensor para ver o histórico.</p>';
    return;
  }

  container.innerHTML = itens
    .map(
      (it) => `
      <div class="history-item">
        <span class="history-value">${it.valor} ${unidade}</span>
        <span class="history-badge ${it.status === "OK" ? "ok" : "warn"}">${it.status}</span>
        <span class="history-time">${it.hora}</span>
      </div>`
    )
    .join("");
}

function atualizarCardMQ2(valor, status, hora) {
  mq2Real = {
    id: "mq2-1",
    tipo: "MQ-2",
    label: "MQ2-1",
    status: status === "OK" ? "OK" : "ALERTA",
    value: valor,
    unidade: "ppm",
    lastUpdate: hora
  };

  atualizarPainelMQ2(valor, status, hora);
  atualizarResumoContinuo();
}

function atualizarCardPIR(valor, status, hora) {
  pirReal = {
    id: "pir-1",
    tipo: "PIR",
    label: "PIR-1",
    status: status === "OK" ? "OK" : "ALERTA",
    value: valor,
    unidade: "",
    lastUpdate: hora
  };

  atualizarPainelPIR(valor, status, hora);
  atualizarResumoContinuo();
}

async function abrirPorta() {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  portConnected = true;
  serialReader = { port, reader, readableStreamClosed };

  return true;
}

async function conectarUSB() {
  if (!("serial" in navigator)) {
    alert(
      "Seu navegador não suporta Web Serial API.\n" +
      "Use Chrome ou Edge e acesse via HTTPS ou localhost."
    );
    return;
  }

  try {
    if (!portConnected) {
      await abrirPorta();
    }
    setStatusMQ2("Conectado", true);

    if (!serialLoopStarted) {
      serialLoopStarted = true;
      await lerSerial();
    }
  } catch (err) {
    console.error("Erro na conexão serial:", err);
    setStatusMQ2("Desconectado", false);
    setStatusPIR("Desconectado", false);
    portConnected = false;
  }
}

async function conectarUSBPir() {
  if (!("serial" in navigator)) {
    alert(
      "Seu navegador não suporta Web Serial API.\n" +
      "Use Chrome ou Edge e acesse via HTTPS ou localhost."
    );
    return;
  }

  try {
    if (!portConnected) {
      await abrirPorta();
    }
    setStatusPIR("Conectado", true);
    setStatusMQ2("Conectado", true);

    if (!serialLoopStarted) {
      serialLoopStarted = true;
      await lerSerial();
    }
  } catch (err) {
    console.error("Erro na conexão serial:", err);
    setStatusMQ2("Desconectado", false);
    setStatusPIR("Desconectado", false);
    portConnected = false;
  }
}

async function lerSerial() {
  if (!serialReader) return;

  let buffer = "";

  while (portConnected) {
    const { value, done } = await serialReader.reader.read();
    if (done) break;

    buffer += value;

    let linhaIndex;
    while ((linhaIndex = buffer.indexOf("\n")) >= 0) {
      let linha = buffer.slice(0, linhaIndex).trim();
      buffer = buffer.slice(linhaIndex + 1);

      if (linha) processarLinha(linha);
    }
  }
}

function processarLinha(linha) {
  // Reconhece prefixo: MQ2:... ou PIR:...
  let sensor = null;
  let rest = linha;

  if (linha.toUpperCase().startsWith("MQ2")) {
    sensor = "MQ2";
    rest = linha.slice(3);
  } else {
    const idx = linha.indexOf(":");
    if (idx > 0) {
      sensor = linha.slice(0, idx).trim().toUpperCase();
      rest = linha.slice(idx + 1);
    } else {
      // Sem prefixo: assume MQ-2 (comportamento antigo)
      sensor = "MQ2";
      rest = linha;
    }
  }

  const partes = rest.split("|");
  if (partes.length < 2) return;

  const valor = partes[0].trim();
  const status = partes[1].trim();
  const hora = new Date().toLocaleTimeString();

  if (sensor === "PIR") {
    atualizarCardPIR(valor, status, hora);
  } else {
    atualizarCardMQ2(valor, status, hora);
  }
}

async function desconectarUSB() {
  portConnected = false;
  serialLoopStarted = false;

  if (serialReader) {
    try {
      await serialReader.reader.cancel();
      await serialReader.readableStreamClosed.catch(() => {});
      await serialReader.port.close();
    } catch (err) {
      console.error("Erro ao fechar porta:", err);
    }
    serialReader = null;
  }

  setStatusMQ2("Desconectado", false);
  setStatusPIR("Desconectado", false);
}

// Se o navegador não suportar Web Serial, usa o fetch antigo como fallback
function buscarMQ2Fetch() {
  fetch("http://192.168.0.111/valor")
    .then((res) => res.text())
    .then((dados) => {
      const partes = dados.split("|");
      const valor = partes[0];
      const status = partes[1];
      processarLinha(`MQ2:${valor}|${status}`);
    })
    .catch(() => {});
}

function servirFallback() {
  if (!("serial" in navigator)) {
    buscarMQ2Fetch();
  }
}

function atualizarResumoContinuo() {
  const pir = pirReal
    ? [pirReal]
    : Array.from({ length: 2 }).map((_, i) => {
        const v = randBetween(0, 100);
        const status = v > 65 ? "ALERTA" : "OK";
        return {
          id: `pir-${i + 1}`,
          tipo: "PIR",
          label: `PIR-${i + 1}`,
          status: status === "OK" ? "OK" : "ALERTA",
          value: Math.round(v),
          unidade: "%",
          lastUpdate: nowBR()
        };
      });

  const cam = Array.from({ length: 3 }).map((_, i) => {
    const v = randBetween(0, 100);
    const status = v > 70 ? "ALERTA" : "OK";
    return {
      id: `cam-${i + 1}`,
      tipo: "CAM",
      label: `CANAL-${i + 1}`,
      status: status === "OK" ? "OK" : "ALERTA",
      value: Math.round(v),
      unidade: "%",
      lastUpdate: nowBR()
    };
  });

  const all = [...pir, ...(mq2Real ? [mq2Real] : []), ...cam];
  const alertasCount = all.filter((x) => x.status !== "OK").length;
  const statusGeral = alertasCount === 0 ? "Seguro" : "Atenção";

  renderList("pirCards", pir);
  renderList("camCards", cam);
  atualizarResumo(alertasCount, statusGeral, nowBR());
}

if (conectarBtn) conectarBtn.addEventListener("click", conectarUSB);
if (desconectarBtn) desconectarBtn.addEventListener("click", desconectarUSB);
if (conectarBtnPir) conectarBtnPir.addEventListener("click", conectarUSBPir);
if (desconectarBtnPir) desconectarBtnPir.addEventListener("click", desconectarUSB);

servirFallback();
atualizarResumoContinuo();
setInterval(atualizarResumoContinuo, 4000);
