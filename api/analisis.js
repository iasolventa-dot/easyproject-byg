export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { texto_extraido, prompt, doc_type, file_name, es_imagen, file_base64, mime_type } = req.body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key no configurada' });
    }

    let messages;
    if (es_imagen && file_base64) {
      messages = [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime_type};base64,${file_base64}`, detail: 'high' } },
          { type: 'text', text: prompt }
        ]
      }];
    } else {
      const contenido = prompt + (texto_extraido ? '\n\nCONTENIDO DEL DOCUMENTO:\n' + texto_extraido.substring(0, 12000) : '');
      messages = [{ role: 'user', content: contenido }];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Error OpenAI' });
    }

    const resultado = data.choices?.[0]?.message?.content || 'Sin respuesta';
    return res.status(200).json({ resultado });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
