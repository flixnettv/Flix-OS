const { runFlixOS } = require('../multi-provider-handler');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { agent_id, session_id, message, provider } = req.body;

    // تشغيل المحرك الرئيسي
    const reply = await runFlixOS(agent_id, session_id, message, provider || 'gemini');

    return res.status(200).json({ reply });
}
