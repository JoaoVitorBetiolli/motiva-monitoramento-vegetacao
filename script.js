const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultDiv = document.getElementById('result');
const cameraFrame = document.getElementById('cameraFrame');
const sensorStatus = document.getElementById('sensorStatus');
const timestamp = document.getElementById('timestamp');

const statTotal = document.getElementById('statTotal');
const statCorte = document.getElementById('statCorte');
const statSemCorte = document.getElementById('statSemCorte');
const pieChart = document.getElementById('pieChart');
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');

let base64Image = null;
let historico = JSON.parse(localStorage.getItem('historicoAnalises') || '[]');

renderAnalytics();

imageInput.addEventListener('change', function () {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      cameraFrame.classList.add('active');
      base64Image = e.target.result.split(',')[1];
      analyzeBtn.style.display = 'inline-block';
      resultDiv.innerHTML = '';

      sensorStatus.textContent = 'Imagem recebida';
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR');
      timestamp.textContent = `Captura recebida em ${dataFormatada} às ${horaFormatada}`;
    };
    reader.readAsDataURL(file);
  }
});

analyzeBtn.addEventListener('click', async function () {
  if (!base64Image) return;

  resultDiv.innerHTML = '<p class="loading">Analisando imagem...</p>';

  try {
    const resposta = await analisarImagem(base64Image);
    exibirResultado(resposta);
    salvarNoHistorico(resposta);
  } catch (erro) {
    console.error(erro);
    resultDiv.innerHTML = '<p class="loading">Erro ao analisar a imagem. Veja o console (F12) para detalhes.</p>';
  }
});

async function analisarImagem(imagemBase64) {
  const prompt = `
Você é um sistema de análise de vegetação em rodovias.
Analise a imagem enviada e responda SOMENTE em JSON válido, sem texto adicional, seguindo exatamente este formato:

{
  "precisaCorte": true ou false,
  "alertas": ["alerta 1", "alerta 2"],
  "justificativa": "explicação curta do motivo da decisão"
}

Critérios para considerar que precisa de corte:
- Vegetação alta o suficiente para obstruir placas de sinalização
- Vegetação invadindo o acostamento ou reduzindo a visibilidade da pista
- Densidade de vegetação que representa risco à segurança viária

Se não houver nenhum desses problemas, retorne "precisaCorte": false e "alertas": [].
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imagemBase64
                }
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();
  const textoResposta = data.candidates[0].content.parts[0].text;

  const textoLimpo = textoResposta.replace(/```json|```/g, '').trim();
  return JSON.parse(textoLimpo);
}

function exibirResultado(resposta) {
  const { precisaCorte, alertas, justificativa } = resposta;

  let html = '';

  if (precisaCorte) {
    html += `<div class="verdict sim">🚨 Precisa de corte</div>`;
  } else {
    html += `<div class="verdict nao">✅ Não precisa de corte</div>`;
  }

  if (alertas && alertas.length > 0) {
    alertas.forEach(alerta => {
      html += `<div class="alert-item">⚠️ ${alerta}</div>`;
    });
  }

  if (justificativa) {
    html += `<div class="justificativa"><strong>Justificativa:</strong> ${justificativa}</div>`;
  }

  resultDiv.innerHTML = html;
}

function salvarNoHistorico(resposta) {
  const agora = new Date();
  const registro = {
    thumbnail: preview.src,
    precisaCorte: resposta.precisaCorte,
    horario: `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`
  };

  historico.unshift(registro); // adiciona no início (mais recente primeiro)
  localStorage.setItem('historicoAnalises', JSON.stringify(historico));

  renderAnalytics();
}

function renderAnalytics() {
  const total = historico.length;
  const comCorte = historico.filter(h => h.precisaCorte).length;
  const semCorte = total - comCorte;

  statTotal.textContent = total;
  statCorte.textContent = comCorte;
  statSemCorte.textContent = semCorte;

  // Gráfico de pizza (conic-gradient)
  if (total > 0) {
    const percentualCorte = (comCorte / total) * 360;
    pieChart.style.background = `conic-gradient(#FF6B6B 0deg ${percentualCorte}deg, #6FE0A8 ${percentualCorte}deg 360deg)`;
  } else {
    pieChart.style.background = `conic-gradient(#524A6B 0deg 360deg)`;
  }

  // Lista de histórico
  if (total === 0) {
    historyList.innerHTML = '<p class="empty-history">Nenhuma captura registrada ainda.</p>';
    return;
  }

  historyList.innerHTML = historico.map(item => `
    <div class="history-item">
      <img class="history-thumb" src="${item.thumbnail}" alt="Miniatura">
      <div class="history-info">
        <div class="history-verdict ${item.precisaCorte ? 'sim' : 'nao'}">
          ${item.precisaCorte ? '🚨 Precisa de corte' : '✅ Não precisa de corte'}
        </div>
        <div class="history-time">${item.horario}</div>
      </div>
    </div>
  `).join('');
}