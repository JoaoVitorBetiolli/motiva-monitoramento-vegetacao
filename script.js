const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultDiv = document.getElementById('result');
const cameraFrame = document.getElementById('cameraFrame');
const sensorStatus = document.getElementById('sensorStatus');
const timestamp = document.getElementById('timestamp');

const statTotal = document.getElementById('statTotal');
const statCorte = document.getElementById('statCorte');
const statAtencao = document.getElementById('statAtencao');
const statSemCorte = document.getElementById('statSemCorte');
const pieChart = document.getElementById('pieChart');
const historyList = document.getElementById('historyList');

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
Você é um sistema de análise preventiva de vegetação em rodovias.
Analise a imagem enviada e responda SOMENTE em JSON válido, sem texto adicional, seguindo exatamente este formato:

{
  "nivelRisco": "baixo" ou "medio" ou "alto",
  "precisaCorte": true ou false,
  "alertas": ["alerta 1", "alerta 2"],
  "justificativa": "explicação curta do motivo da decisão"
}

Critérios de classificação:
- "alto": vegetação já obstrui placas de sinalização, invade o acostamento/pista, ou representa risco imediato à segurança viária. Nesse caso, "precisaCorte" deve ser true.
- "medio": vegetação está crescendo e se aproximando de um ponto crítico (ex: perto de tampar uma placa, mas ainda não tampa), mas ainda não representa risco imediato. Recomenda-se monitorar o trecho com mais frequência. "precisaCorte" deve ser false, mas o alerta deve indicar que o trecho precisa de acompanhamento.
- "baixo": vegetação está baixa, bem aparada, sem nenhum risco visível. "precisaCorte" deve ser false e não é necessário nenhum alerta.

Se não houver problemas, retorne "alertas": [].
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
  const { nivelRisco, alertas, justificativa } = resposta;

  let html = '';

  if (nivelRisco === 'alto') {
    html += `<div class="verdict sim">🚨 Precisa de corte</div>`;
  } else if (nivelRisco === 'medio') {
    html += `<div class="verdict atencao">⚠️ Em atenção — monitorar</div>`;
  } else {
    html += `<div class="verdict nao">✅ Sem risco</div>`;
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
  gerarThumbnail(preview.src, function (thumbnailPequena) {
    const agora = new Date();
    const registro = {
      thumbnail: thumbnailPequena,
      nivelRisco: resposta.nivelRisco,
      horario: `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`
    };

    historico.unshift(registro);

    // Mantém no máximo 20 registros no histórico, pra não estourar o localStorage
    if (historico.length > 20) {
      historico = historico.slice(0, 20);
    }

    try {
      localStorage.setItem('historicoAnalises', JSON.stringify(historico));
    } catch (erro) {
      console.error('Erro ao salvar histórico:', erro);
    }

    renderAnalytics();
  });
}

function gerarThumbnail(base64Original, callback) {
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const tamanho = 80; // thumbnail de 80x80 pixels
    canvas.width = tamanho;
    canvas.height = tamanho;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, tamanho, tamanho);

    const thumbnailComprimido = canvas.toDataURL('image/jpeg', 0.6); // qualidade 60%
    callback(thumbnailComprimido);
  };
  img.src = base64Original;
}

function renderAnalytics() {
  const total = historico.length;
  const alto = historico.filter(h => h.nivelRisco === 'alto').length;
  const medio = historico.filter(h => h.nivelRisco === 'medio').length;
  const baixo = total - alto - medio;

  statTotal.textContent = total;
  statCorte.textContent = alto;
  statAtencao.textContent = medio;
  statSemCorte.textContent = baixo;

  if (total > 0) {
    const fatiaAlto = (alto / total) * 360;
    const fatiaMedio = (medio / total) * 360;
    pieChart.style.background = `conic-gradient(
      #FF6B6B 0deg ${fatiaAlto}deg,
      #F2C94C ${fatiaAlto}deg ${fatiaAlto + fatiaMedio}deg,
      #6FE0A8 ${fatiaAlto + fatiaMedio}deg 360deg
    )`;
  } else {
    pieChart.style.background = `conic-gradient(#524A6B 0deg 360deg)`;
  }

  if (total === 0) {
    historyList.innerHTML = '<p class="empty-history">Nenhuma captura registrada ainda.</p>';
    return;
  }

  const labels = {
    alto: { texto: '🚨 Precisa de corte', classe: 'sim' },
    medio: { texto: '⚠️ Em atenção', classe: 'atencao' },
    baixo: { texto: '✅ Sem risco', classe: 'nao' }
  };

  historyList.innerHTML = historico.map(item => {
    const label = labels[item.nivelRisco] || labels.baixo;
    return `
      <div class="history-item">
        <img class="history-thumb" src="${item.thumbnail}" alt="Miniatura">
        <div class="history-info">
          <div class="history-verdict ${label.classe}">${label.texto}</div>
          <div class="history-time">${item.horario}</div>
        </div>
      </div>
    `;
  }).join('');
}