export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  const { prompt, tipoDinamica } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt não enviado.' });
  }

  const maxTokensMap = {
    'Pokémon ou Remédio':        1000,
    'Marvel ou DC':              1000,
    'Quebra-gelo':               1000,
    'Jogo das 3 pistas':         1800,
    'Quiz':                      2000,
    'Verdadeiro ou Falso':       1200,
    'Quem Sou Eu?':              1800,
    'Complete a Frase':          1000,
    'Emoji Game':                 800,
    'Criar uma dinâmica inédita':1200,
  };
  const maxTokens = maxTokensMap[tipoDinamica] || 1200;
  const MAX_TENTATIVAS = 4;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Você é especialista em criar dinâmicas para células cristãs. Responda SEMPRE em português do Brasil. Siga EXATAMENTE as instruções abaixo sem introduções ou conclusões.\n\n' + prompt
              }]
            }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.8
            }
          })
        }
      );

      const data = await response.json();

      if (response.status === 429 || response.status === 503) {
        if (tentativa < MAX_TENTATIVAS) {
          const espera = 15;
          await new Promise(r => setTimeout(r, espera * 1000));
          continue;
        }
        return res.status(response.status).json({ error: 'rate_limit', retryAfter: 15 });
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || 'Erro na requisição ao Gemini'
        });
      }

      let resultado = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      resultado = resultado.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return res.status(200).json({ resultado });

    } catch (error) {
      if (tentativa === MAX_TENTATIVAS) {
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}