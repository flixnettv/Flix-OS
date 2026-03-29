import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import OpenRouter from 'openrouter-ai';
import { HfInference } from '@huggingface/inference'; // ← الحزمة الجديدة

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { agent_id, message } = body;

    if (!agent_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing agent_id or message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: agent, error } = await supabase
      .from('agents')
      .select('name, model, role_prompt')
      .eq('id', agent_id)
      .single();

    if (error || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `${agent.role_prompt}\n\nUser: ${message}\nAssistant:`; // ← prompt format
    let response;

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); // ← new instance
    const model = agent.model.replace(/^models\/|groq\/|openrouter\/|huggingface\//, '');
    if (agent.model.includes('gemini')) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelInst = genAI.getGenerativeModel({ model });
      const result = await modelInst.generateContent(prompt);
      response = await result.response.text();
    } else if (agent.model.includes('groq')) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });
      response = completion.choices[0].message.content;
    } else if (agent.model.includes('openrouter')) {
      const openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });
      response = completion.choices[0].message.content;
    } else if (agent.model.includes('huggingface')) {
      // ← استخدام Hugging Face Text Generation
      const result = await hf.textGeneration({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false
        },
      });
      response = result.generated_text;
    } else {
      // fallback
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelInst = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await modelInst.generateContent(prompt);
      response = await result.response.text();
    }

    await supabase.from('agent_logs').insert({
      agent_id,
      input: message,
      output: response,
      timestamp: new Date().toISOString()
    }).catch(() => {});

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }    });

  } catch (err) {
    console.error('[Webhook Error]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}