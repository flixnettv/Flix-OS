import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// إنشاء اتصال Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    // السماح فقط بطلبات POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { agent_id, session_id, message } = req.body;

    try {
        // 1. جلب بيانات الوكيل من الداتابيز
        const { data: agent, error: agentErr } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agent_id)
            .single();

        if (agentErr || !agent) {
            return res.status(404).json({ error: "Agent not found. Check UUID in App.js" });
        }

        // 2. الاتصال بـ Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: agent.model || "gemini-1.5-flash" });
        
        const result = await model.generateContent(`${agent.role_prompt}\n\nUser: ${message}`);
        const reply = result.response.text();

        // 3. حفظ الذاكرة واللوجات (Log & Memory)
        await supabase.from('agent_memories').insert([{
            agent_id, session_id, content: `User: ${message} | AI: ${reply}`, memory_type: 'short_term'
        }]);

        await supabase.from('agent_logs').insert([{
            agent_id, event: 'chat_success', message: `Reply generated for ${session_id}`, session_id
        }]);

        return res.status(200).json({ reply });

    } catch (err) {
        console.error("Critical Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
