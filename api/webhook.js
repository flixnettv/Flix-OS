import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import OpenRouter from 'openrouter-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { agent_id, message } = await req.json();
    
    // Initialize clients
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY
    });

    // Fetch agent configuration
    const {  agent, error } = await supabase
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

    // Build system prompt
    const systemPrompt = `${agent.role_prompt}\n\nCurrent context: ${message}`;
    
    // Determine provider based on model
    let response;
    
    if (agent.model.includes('gemini')) {
      const modelName = agent.model.replace('models/', '');
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(systemPrompt);
      response = await result.response.text();
      
    } else if (agent.model.includes('groq')) {
      const completion = await groq.chat.completions.create({
        model: agent.model.replace('groq/', ''),
        messages: [{ role: 'user', content: systemPrompt }],
      });
      response = completion.choices[0].message.content;
      
    } else if (agent.model.includes('openrouter')) {
      const completion = await openrouter.chat.completions.create({
        model: agent.model.replace('openrouter/', ''),
        messages: [{ role: 'user', content: systemPrompt }],
      });
      response = completion.choices[0].message.content;
      
    } else {
      // Fallback to Gemini
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(systemPrompt);
      response = await result.response.text();
    }

    // Log the interaction
    await supabase.from('agent_logs').insert({
      agent_id,
      input: message,
      output: response,
      timestamp: new Date().toISOString()
    }).throwOnError();

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}