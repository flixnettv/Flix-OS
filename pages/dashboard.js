import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AgentDashboard() {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({ agents: true, logs: true });
  const [newAgent, setNewAgent] = useState({ name: '', model: 'gemini/gemini-1.5-flash', role_prompt: '' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchAgents();
    fetchLogs();
  }, []);

  const fetchAgents = async () => {
    const { data, error } = await supabase.from('agents').select('*');
    if (!error) setAgents(data);
    setLoading({ ...loading, agents: false });
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*, agents(name)')
      .order('timestamp', { ascending: false })
      .limit(10);
    if (!error) setLogs(data);
    setLoading({ ...loading, logs: false });
  };

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.role_prompt) return;

    const { error } = await supabase.from('agents').insert([{
      ...newAgent,
      id: crypto.randomUUID(),
      is_active: true
    }]);

    if (!error) {
      setNewAgent({ name: '', model: 'gemini/gemini-1.5-flash', role_prompt: '' });
      fetchAgents();
    }
  };
  const toggleAgentStatus = async (id, current) => {
    await supabase.from('agents').update({ is_active: !current }).eq('id', id);
    fetchAgents();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-green-400 font-mono">
      <h1 className="text-2xl font-bold mb-6">Flix-OS Dashboard</h1>

      <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-green-400">
        <h2 className="text-lg mb-3">Add New Agent</h2>
        <input
          type="text"
          placeholder="Name"
          value={newAgent.name}
          onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
          className="bg-black text-green-400 border border-green-600 p-2 w-full mb-2"
        />
        <select
          value={newAgent.model}
          onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
          className="bg-black text-green-400 border border-green-600 p-2 w-full mb-2"
        >
          <option value="gemini/gemini-1.5-flash">Gemini Pro</option>
          <option value="groq/llama3-70b-8192">Groq Llama3</option>
          <option value="openrouter/mistralai/mistral-7b-instruct">Mistral 7B</option>
        </select>
        <textarea
          placeholder="Role Prompt"
          value={newAgent.role_prompt}
          onChange={(e) => setNewAgent({ ...newAgent, role_prompt: e.target.value })}
          className="bg-black text-green-400 border border-green-600 p-2 w-full h-24 mb-2"
        />
        <button
          onClick={handleAddAgent}
          className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-400"
        >
          Add Agent
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-3">Agents ({agents.length})</h2>
        {loading.agents ? (
          <p>Loading agents...</p>
        ) : (
          <table className="w-full border-collapse border border-green-600">
            <thead>
              <tr className="bg-gray-700">
                <th className="border border-green-600 p-2">ID</th>                <th className="border border-green-600 p-2">Name</th>
                <th className="border border-green-600 p-2">Model</th>
                <th className="border border-green-600 p-2">Active</th>
                <th className="border border-green-600 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-800">
                  <td className="border border-green-600 p-2 text-xs">{a.id.slice(0, 8)}...</td>
                  <td className="border border-green-600 p-2">{a.name}</td>
                  <td className="border border-green-600 p-2 text-xs">{a.model}</td>
                  <td className="border border-green-600 p-2">
                    <span className={a.is_active ? 'text-green-400' : 'text-red-400'}>
                      {a.is_active ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="border border-green-600 p-2">
                    <button
                      onClick={() => toggleAgentStatus(a.id, a.is_active)}
                      className={`px-2 py-1 text-xs ${a.is_active ? 'bg-red-600' : 'bg-green-600'} text-white rounded`}
                    >
                      {a.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2 className="text-xl mb-3">Recent Logs</h2>
        {loading.logs ? (
          <p>Loading logs...</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-800 rounded">
            {logs.map((log, i) => (
              <div key={i} className="p-2 bg-gray-700 rounded text-sm">
                <p className="text-yellow-400">{log.agents?.name || 'Unknown'}:</p>
                <p className="truncate">{log.input}</p>
                <p className="text-gray-400 text-xs mt-1">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );}