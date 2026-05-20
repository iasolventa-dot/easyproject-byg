export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { base64, mediaType, isPdf, texto, prompt } = req.body;

    let messages;

    if (texto) {
      // PDF con texto extraído — enviar como texto a GPT-4o
      messages = [{ role: 'user', content: prompt || texto }];
    } else if (base64) {
      // Imagen — enviar como image_url
      messages = [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
          { type: 'text', text: `Analiza este documento (albarán, factura o ticket) y extrae los siguientes datos en formato JSON. Responde SOLO con el JSON, sin explicaciones ni texto adicional:
{
  "tipo": "albaran" o "factura" o "ticket",
  "importe": numero con decimales (solo el total, sin símbolo de moneda),
  "proveedor": "nombre del proveedor emisor",
  "concepto": "descripcion breve del concepto o servicio",
  "fecha": "YYYY-MM-DD",
  "confianza": "alta", "media" o "baja"
}
Si no puedes extraer algún campo con seguridad, ponlo como null.` }
        ]
      }];
    } else {
      return res.status(400).json({ error: 'No se recibió archivo ni texto' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 500, temperature: 0.1, messages })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message, resultado: { confianza: 'baja' } });
    }

    const text = data.choices?.[0]?.message?.content || '';
    let resultado;
    try {
      resultado = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      resultado = { raw: text, confianza: 'baja' };
    }

    return res.status(200).json({ status: 'ok', resultado });

  } catch (e) {
    console.error('Error gastos-ia:', e);
    return res.status(500).json({ error: e.message, resultado: { confianza: 'baja' } });
  }
}
