const { supabase } = require('../utils/supabase');

export default async function handler(req, res) {
    try {
        const { data: logs } = await supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15);

        const formatted = logs.map(l => `[${new Date(l.created_at).toLocaleTimeString()}] ${l.event}: ${l.message}`);
        return res.status(200).json({ logs: formatted });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
