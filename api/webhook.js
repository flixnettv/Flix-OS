const { FlixEngine } = require('../index');
const { supabase } = require('../utils/supabase');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { agent_id, session_id, message, provider } = req.body;

    try {
        const { data: agent } = await supabase.from('agents').select('*').eq('id', agent_id).single();
        if (!agent) throw new Error("الوكيل غير موجود");

        const reply = await FlixEngine.getResponse(provider || 'gemini', message, agent.role_prompt);
        
        // حفظ في الذاكرة مع session_id
        await supabase.from('agent_memories').insert([{
            agent_id: agent_id,
            session_id: session_id,
            content: `User: ${message}\nAI: ${reply}`,
            memory_type: 'short_term'
        }]);

        await FlixEngine.saveLog(agent_id, 'chat_success', 'تم الرد بنجاح', session_id);
        
        return res.status(200).json({ reply });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
