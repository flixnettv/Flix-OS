const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const { supabase } = require('./utils/supabase');

const FlixEngine = {
    async getResponse(provider, prompt, systemInstruction) {
        const fullPrompt = `${systemInstruction}\n\n${prompt}`;
        if (provider === 'groq') {
            const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: fullPrompt }]
            }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } });
            return res.data.choices[0].message.content;
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    },

    async saveLog(agentId, event, message, sessionId) {
        await supabase.from('agent_logs').insert([{
            agent_id: agentId,
            event: event,
            message: message,
            session_id: sessionId
        }]);
    }
};

module.exports = { FlixEngine };
