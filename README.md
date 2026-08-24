# Dashboard de Monitoramento de Vegetação — Motiva

Protótipo desenvolvido como resposta a um desafio proposto pela Motiva, empresa de infraestrutura de mobilidade, para alunos da faculdade.

## Sobre o projeto

Sistema de apoio à decisão para manutenção de vegetação em rodovias. Simula o recebimento de imagens capturadas por sensores instalados em pontos estratégicos da rodovia e utiliza Inteligência Artificial (Gemini) para analisar a vegetação e indicar se é necessário enviar uma equipe para corte/roçada.

## Problema resolvido

Hoje, o controle de vegetação em rodovias é feito por cronogramas fixos de manutenção, sem considerar se a vegetação realmente precisa de intervenção naquele momento — gerando custos desnecessários (corte antecipado) ou riscos de segurança (corte tardio, obstrução de placas).

## Como funciona

**Entrada:** imagem capturada por um sensor simulado na rodovia
**Processamento:** a imagem é enviada para um modelo de IA com visão computacional, que avalia critérios como altura da vegetação, obstrução de sinalização e invasão do acostamento
**Saída:** classificação de risco em três níveis (baixo, médio/atenção, alto/corte urgente), com alertas específicos e justificativa, além de um painel analítico com histórico e estatísticas das capturas

## Tecnologias utilizadas

- HTML, CSS e JavaScript puro
- API do Google Gemini (gemini-3.6-flash) para análise de imagem
- LocalStorage para persistência do histórico de análises

## Como rodar o projeto

1. Clone este repositório
2. Crie um arquivo `config.js` na raiz do projeto (use `config.example.js` como modelo)
3. Insira sua chave de API do Gemini (gerada em [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
4. Abra o `index.html` com a extensão Live Server do VS Code (ou qualquer servidor local)

## Ganhos para a Motiva

- Redução de custos com manutenções desnecessárias
- Priorização de trechos com maior risco à segurança viária
- Tomada de decisão baseada em dados, não em cronograma fixo