require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const { AceMemory } = require("@ace3-memory/ace");
const axios = require('axios'); // للتعامل مع Groq و OpenRouter

// إعداد Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * دالة جلب الرد من مقدمي الخدمة المختلفين
 */
async function getLLMResponse(provider, prompt, systemInstruction) {
    switch (provider.toLowerCase()) {
        case 'gemini':
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
            return result.response.text();

        case 'groq':
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama3-8b-8192",
                messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
            }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } });
            return groqRes.data.choices[0].message.content;

        case 'openrouter':
            const orRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "google/gemini-2.0-flash-exp:free", // أو أي موديل تختاره
                messages: [{ role: "user", content: prompt }]
            }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` } });
            return orRes.data.choices[0].message.content;

        default:
            throw new Error("Provider not supported");
    }
}

/**
 * Database Agent Tools: صلاحيات التحكم في الداتابيز
 */
const dbTools = {
    async updateAgentConfig(agentId, newConfig) {
        const { error } = await supabase.from('agents').update({ config: newConfig }).eq('id', agentId);
        return error ? `Error: ${error.message}` : "Agent config updated successfully.";
    },
    async getSystemLogs() {
        const { data } = await supabase.from('agent_logs').select('*').limit(5).order('created_at', { ascending: false });
        return JSON.stringify(data);
    }
};

/**
 * الدالة الأساسية (Orchestrator)
 */
async function runFlixOS(agentId, sessionId, userInput, provider = 'gemini') {
    try {
        // 1. جلب بيانات الوكيل والذاكرة (ACE3 + Supabase)
        const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
        
        // 2. التحقق لو المستخدم طالب أمر "إداري" للداتابيز
        let systemInstruction = agent.role_prompt;
        if (userInput.includes("تحديث الإعدادات") || userInput.includes("سجل العمليات")) {
             systemInstruction += "\n[System Tool Access Enabled] أنت الآن تملك صلاحية الوصول لأدوات قاعدة البيانات.";
        }

        // 3. الحصول على الرد
        const responseText = await getLLMResponse(provider, userInput, systemInstruction);

        // 4. حفظ الذاكرة وتسجيل اللوج
        await supabase.from('agent_memories').insert([{ 
            agent_id: agentId, session_id: sessionId, content: `User: ${userInput}\nAI: ${responseText}`, memory_type: 'short_term' 
        }]);

        await supabase.from('agent_logs').insert([{ 
            agent_id: agentId, event: 'provider_call', data: { provider, status: 'success' } 
        }]);

        return responseText;
    } catch (err) {
        console.error("Orchestrator Error:", err);
        return `خطأ في المحرك: ${err.message}`;
    }
}

module.exports = { runFlixOS };
