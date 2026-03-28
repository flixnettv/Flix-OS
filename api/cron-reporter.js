import { supabase, logSystemAction } from '../utils/supabase.js';

export default async function handler(req, res) {
    // التحقق من أن الطلب آمن (يأتي من Vercel Cron فقط)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        // 1. جلب المهام النشطة من Supabase
        const { data: tasks, error } = await supabase
            .from('agent_tasks')
            .select('*')
            .eq('status', 'pending');

        if (error) throw error;

        // 2. صياغة التقرير
        const reportSummary = tasks.length > 0 
            ? `لديك ${tasks.length} مهام معلقة. جارٍ العمل على Flix-OS.` 
            : "كل المهام مكتملة. النظام مستقر.";

        // 3. تسجيل التقرير في السجلات ليظهر في الـ Terminal
        await logSystemAction('REPORT', 'Daily Status Update', { 
            summary: reportSummary,
            taskCount: tasks.length 
        });

        return res.status(200).json({ success: true, message: "Report generated." });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
