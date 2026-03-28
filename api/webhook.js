import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { agent_id, session_id, message } = req.body;

    try {
        const { data: agent, error: agentErr } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agent_id)
            .single();

        if (agentErr || !agent) throw new Error("Agent not found in Database");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: agent.model });
        
        const result = await model.generateContent(`${agent.role_prompt}\n\nUser: ${message}`);
        const reply = result.response.text();

        // حفظ الذاكرة واللوجات
        await Promise.all([
            supabase.from('agent_memories').insert([{
                agent_id, session_id, content: `U: ${message} | A: ${reply}`, memory_type: 'short_term'
            }]),
            supabase.from('agent_logs').insert([{
                agent_id, event: 'chat_success', message: `Response sent to ${session_id}`, session_id
            }])
        ]);

        return res.status(200).json({ reply });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
