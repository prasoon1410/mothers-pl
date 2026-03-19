export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are an expert restaurant financial consultant specialising in UAE/Dubai restaurants. Be concise, practical and specific with AED amounts.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      console.error('OpenAI error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'OpenAI API error' });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.error('No content in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    return res.status(200).json({ analysis: text });
  } catch (e) {
    console.error('OpenAI fetch error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
