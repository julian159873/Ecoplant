module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
 
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }
 
  const { system, messages } = req.body;
 
  const groqMessages = [];
  if (system) groqMessages.push({ role: 'system', content: system });
  for (const msg of messages) groqMessages.push(msg);
 
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: 1000
      })
    });
 
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error de Groq');
 
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });
 
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
