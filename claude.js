export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  const { system, messages } = req.body;

  // Convertir formato Claude → formato Gemini
  const geminiContents = [];

  // Agregar el system prompt como primer mensaje de usuario si existe
  if (system) {
    geminiContents.push({ role: "user", parts: [{ text: `[Instrucciones del sistema]: ${system}` }] });
    geminiContents.push({ role: "model", parts: [{ text: "Entendido, seguiré esas instrucciones." }] });
  }

  for (const msg of messages) {
    geminiContents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error de Gemini' });
    }

    // Convertir respuesta Gemini → formato que espera el frontend
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
