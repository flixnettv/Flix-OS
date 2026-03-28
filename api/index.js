import { supabase, saveAgentMemory } from '../utils/supabase.js';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { prompt, agentId, sessionId } = req.body;

    try {
        // 1. طلب الرد من Gemini 1.5 Flash
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        const aiText = response.data.candidates[0].content.parts[0].text;

        // 2. تفعيل ACE3 Memory: حفظ المحادثة في Supabase
        // سيتم تخزين السؤال والجواب ليعرف الوكيل من أنت في المرة القادمة
        await saveAgentMemory(agentId, sessionId, { 
            user_query: prompt, 
            ai_response: aiText,
            timestamp: new Date().toISOString()
        }, 'short_term');

        // 3. إرسال الرد للواجهة
        res.status(200).json({ 
            status: 'success', 
            response: aiText 
        });

    } catch (error) {
        console.error("Orchestrator Error:", error.response?.data || error.message);
        res.status(500).json({ error: "خطأ في الاتصال بالمحرّك أو مفتاح الـ API" });
    }
}
