const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// AI calls are relatively expensive - cap per-user usage
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many assistant requests. Please wait a moment.' }
});

const SYSTEM_INSTRUCTION_TEMPLATE = (ctx) => `You are "VyaparSetu Assistant" (व्यापारसेतु), an expert regulatory advisory intelligence layer for industrial units in India (specifically ${ctx.state}).
Current Applicant Context:
- Entity: ${ctx.businessName}
- Industry: ${ctx.sector}
- State: ${ctx.state}
- Investment: ₹${ctx.investmentCr} Crore
- Employees: ${ctx.employees}
- Active Applications: ${(ctx.activeApplications || []).join(', ')}

Guidelines:
1. Ground answers strictly in applicable Indian Acts (Factories Act 1948, Water Act 1974, Air Act 1981, State Fire Services Act, FSSAI Act 2006, etc).
2. Be concise and practical. This is advisory only, not a legal or statutory decision.
3. If unsure, say so and recommend confirming with the concerned department officer.`;

// POST /api/ai/ask - proxies to Gemini using the server-held API key.
// The frontend must call this instead of hitting Gemini directly with an exposed key.
router.post('/ask', requireAuth, aiLimiter, async (req, res) => {
  const { prompt, contextData } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI assistant is not configured on this server. Set GEMINI_API_KEY in backend/.env.'
    });
  }

  try {
    // Using fetch directly against the Gemini REST endpoint keeps this route
    // dependency-light; swap for the official SDK if you prefer.
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_TEMPLATE(contextData || {}) }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai] Gemini API error:', errText);
      return res.status(502).json({ error: 'AI assistant upstream error' });
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    res.json({
      answer,
      legalReferences: [],
      lastUpdated: new Date().toISOString(),
      confidence: 'Moderate (Subject to Zonal Officer Confirmation)'
    });
  } catch (err) {
    console.error('[ai] request failed:', err.message);
    res.status(502).json({ error: 'AI assistant request failed' });
  }
});

module.exports = router;
