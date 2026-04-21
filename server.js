// server.js
require('dotenv').config();  // Load from .env file
const express = require('express');
const app = express();

app.post('/api/analyze', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  // From environment
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const res2 = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.3 }
      })
    });

    if (!res2.ok) {
      throw new Error(`Gemini API error: ${res2.status}`);
    }

    const data = await res2.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    res.json({ analysis: text });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on :3000'));
