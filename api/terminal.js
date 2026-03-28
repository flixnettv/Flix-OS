import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    try {
        const { data: logs } = await supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        const formatted = logs.map(l => `[${new Date(l.created_at).toLocaleTimeString()}] ${l.event}: ${l.message}`);
        return res.status(200).json({ logs: formatted });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
