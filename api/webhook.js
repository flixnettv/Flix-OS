import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { agent_id, message } = req.body;

    try {
        // جلب بيانات الوكيل من قاعدة البيانات
        const { data: agent, error: agentErr } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agent_id)
            .single();

        if (agentErr || !agent) throw new Error("Agent Not Found");

        // تنظيف اسم الموديل لتجنب خطأ الـ 404
        const modelName = agent.model.includes('/') ? agent.model.split('/').pop() : agent.model;
        const model = genAI.getGenerativeModel({ model: modelName });

        // إرسال الطلب لـ Gemini
        const prompt = `${agent.role_prompt}\n\nUser: ${message}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return res.status(200).json({ reply: response.text() });

    } catch (error) {
        return res.status(500).json({ error: "API Error", details: error.message });
    }
}
