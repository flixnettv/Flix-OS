import { supabase, saveAgentMemory, logSystemAction } from '../utils/supabase.js';
import { readGithubFile } from './mcp.js';

export default async function handler(req, res) {
    // تفعيل CORS للتواصل مع الواجهة الأمامية
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, agentId, sessionId, useMcp } = req.body;

    try {
        await logSystemAction('INFO', 'Received new prompt', { agentId, sessionId });

        // 1. استدعاء أداة MCP إذا طلب المستخدم ذلك
        let mcpContext = "";
        if (useMcp && useMcp.action === 'read_github') {
            const githubData = await readGithubFile(useMcp.owner, useMcp.repo, useMcp.path);
            if (githubData.success) {
                mcpContext = `\n[System: GitHub File Content Added]\n${githubData.content}\n`;
            }
        }

        // 2. إرسال الطلب إلى Gemini (أو أي موديل آخر عبر المحرك)
        // محاكاة لطلب الـ API الخاص بـ Gemini 1.5 Flash
        const finalPrompt = `${mcpContext}\nUser Prompt: ${prompt}`;
        
        // هنا يتم وضع الكود الفعلي للاتصال بـ API Gemini أو Groq
        const aiResponse = `[Mock Response] تم معالجة طلبك عبر المحرك. لقد استلمت النص: "${prompt}".`; 

        // 3. حفظ الذاكرة في Supabase (نظام ACE3)
        await saveAgentMemory(agentId, sessionId, { prompt, response: aiResponse }, 'short_term');

        res.status(200).json({ 
            status: 'success', 
            response: aiResponse,
            agent_id: agentId 
        });

    } catch (error) {
        await logSystemAction('ERROR', 'Orchestrator Error', { error: error.message });
        res.status(500).json({ error: error.message });
    }
}
