export default async function handler(req, res) {

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt não enviado.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: 'Você é especialista em criar dinâmicas para células cristãs. Siga EXATAMENTE as instruções abaixo sem introduções ou conclusões.\n\n' + prompt
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro na requisição à Groq' });
    }

    const resultado = data.choices[0].message.content;
    return res.status(200).json({ resultado });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
}
