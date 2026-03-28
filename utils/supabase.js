import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// دالة لحفظ الذاكرة قصيرة/طويلة المدى للوكيل
export async function saveAgentMemory(agentId, sessionId, content, type = 'short_term') {
    const { data, error } = await supabase
        .from('agent_memories')
        .insert([{ agent_id: agentId, session_id: sessionId, memory_content: content, memory_type: type }]);
    
    if (error) console.error("Memory Save Error:", error);
    return data;
}

// دالة لتسجيل الـ Logs
export async function logSystemAction(level, message, details = {}) {
    await supabase
        .from('agent_logs')
        .insert([{ log_level: level, message, details }]);
}
