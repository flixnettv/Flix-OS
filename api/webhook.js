import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { agent_id, session_id, message } = req.body;

    try {
        // 1. جلب بيانات الوكيل
        const { data: agent, error: agentErr } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agent_id)
            .single();

        if (agentErr || !agent) throw new Error("Agent not found in Database");

        // 2. تهيئة Gemini مع معالجة اسم الموديل
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // تصحيح: المكتبة تضيف "models/" تلقائياً، لذا نمرر الاسم المجرد
        const cleanModelName = agent.model.replace('models/', '');
        const model = genAI.getGenerativeModel({ model: cleanModelName });
        
        const result = await model.generateContent(`${agent.role_prompt}\n\nUser: ${message}`);
        const reply = result.response.text();

        // 3. تسجيل العمليات
        await Promise.all([
            supabase.from('agent_memories').insert([{
                agent_id, session_id, content: `User: ${message} | AI: ${reply}`, memory_type: 'short_term'
            }]),
            supabase.from('agent_logs').insert([{
                agent_id, event: 'chat_success', message: `Reply generated for ${session_id}`, session_id
            }])
        ]);

        return res.status(200).json({ reply });

    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ error: `[GoogleGenerativeAI Error]: ${err.message}` });
    }
}
