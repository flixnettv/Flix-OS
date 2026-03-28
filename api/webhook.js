import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// استخدام المفاتيح من الـ Environment Variables في Vercel
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

        // 2. تهيئة Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // تعديل حاسم: بناخد الاسم الصافي للموديل ونخليه gemini-1.5-flash مباشرة
        const cleanModelName = agent.model.includes('/') ? agent.model.split('/').pop() : agent.model;
        
        // استدعاء الموديل
        const model = genAI.getGenerativeModel({ model: cleanModelName });
        
        // 3. إرسال الطلب لـ Google
        const result = await model.generateContent(`${agent.role_prompt}\n\nUser: ${message}`);
        const response = await result.response;
        const reply = response.text();

        // 4. تسجيل العملية في الداتابيز (Logs & Memories)
        await Promise.all([
            supabase.from('agent_memories').insert([{
                agent_id, session_id, content: `U: ${message} | A: ${reply}`, memory_type: 'short_term'
            }]),
            supabase.from('agent_logs').insert([{
                agent_id, event: 'chat_success', message: `Reply generated via ${cleanModelName}`, session_id
            }])
        ]);

        return res.status(200).json({ reply });

    } catch (err) {
        // لو حصل خطأ، بنرجعه عشان يظهر في الشاشة عندك
        return res.status(500).json({ error: `[System Error]: ${err.message}` });
    }
}
