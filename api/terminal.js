const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    // السماح بطلبات GET فقط
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'استخدم GET لطلب السجلات' });
    }

    try {
        // جلب آخر 20 سجل من جدول اللوجات
        const { data: logs, error } = await supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // تنسيق اللوجات بشكل احترافي للترمنال
        const formattedLogs = logs.map(log => {
            const time = new Date(log.created_at).toLocaleTimeString();
            return `[${time}] ${log.level.toUpperCase()}: ${log.event} - ${log.message || ''}`;
        });

        return res.status(200).json({ logs: formattedLogs });

    } catch (error) {
        console.error("Terminal Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
