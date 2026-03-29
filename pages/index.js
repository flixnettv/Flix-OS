import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';

export default function Terminal() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'system', content: 'Flix-OS v1.0.3 • Ready.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const cmd = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: cmd }]);
    setInput('');
    setIsLoading(true);

    try {
      if (cmd.toLowerCase() === 'help') {
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'Commands: help | agents | use <id> | clear'
        }]);
      } else if (cmd.startsWith('use ')) {
        const id = cmd.split(' ')[1];
        setSelectedAgent(id);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Agent active: ${id}`
        }]);
      } else if (cmd.toLowerCase() === 'clear') {
        setMessages([{ type: 'system', content: 'Flix-OS v1.0.3 • Ready.' }]);
      } else if (selectedAgent) {
        const res = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: selectedAgent, message: cmd })
        });

        const data = await res.json();        if (data.response) {
          setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'error',
            content: data.error || 'AI unreachable'
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          content: '⚠️ No agent selected. Use: use default-agent'
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Network error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getColor = (t) => ({
    user: 'text-green-400',
    ai: 'text-blue-400',
    system: 'text-yellow-400',
    error: 'text-red-400'
  })[t] || 'text-white';

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <Head>
        <title>Flix-OS v1.0.3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <header className="mb-4">
          <h1 className="text-xl font-bold">Flix-OS v1.0.3</h1>
          {selectedAgent && (
            <p className="text-xs text-yellow-500">→ {selectedAgent}</p>
          )}
        </header>

        <div
          ref={terminalRef}
          className="bg-gray-900 border border-green-400 rounded-lg p-4 h-[50vh] overflow-y-auto font-mono text-sm mb-3"
        >          {messages.map((m, i) => (
            <div key={i} className={`${getColor(m.type)} mb-0.5`}>
              <span className="text-gray-500 mr-2">$</span>
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="text-blue-400">
              <span className="text-gray-500 mr-2">$</span>
              <span className="animate-pulse">● ● ●</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type command..."
            className="flex-1 bg-gray-900 border border-green-400 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-blue-400 disabled:bg-gray-800"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-500 text-black px-3 py-2 rounded hover:bg-green-400 disabled:bg-gray-700"
          >
            ↵
          </button>
        </form>
      </div>
    </div>
  );
}