import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';

export default function Terminal() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'system', content: 'Flix-OS v1.0.3 initialized. Type "help" for available commands.' }
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

    const userInput = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userInput }]);
    setInput('');
    setIsLoading(true);

    try {
      if (userInput.toLowerCase() === 'help') {
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'Commands: help, agents, use <agent_id>, clear'
        }]);
      } else if (userInput.startsWith('use ')) {
        const agentId = userInput.split(' ')[1];
        setSelectedAgent(agentId);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Switched to agent: ${agentId}`
        }]);
      } else if (userInput.toLowerCase() === 'clear') {
        setMessages([{ type: 'system', content: 'Flix-OS v1.0.3 initialized.' }]);
      } else if (selectedAgent) {
        const response = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: selectedAgent,
            message: userInput
          })        });
        
        const data = await response.json();
        if (data.response) {
          setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'error',
            content: data.error || 'Error communicating with AI'
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          content: 'No agent selected. Use "use <agent_id>" first.'
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Network error occurred'
      }]);
    }

    setIsLoading(false);
  };

  const getTerminalColor = (type) => {
    switch (type) {
      case 'user': return 'text-green-400';
      case 'ai': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <Head>
        <title>Flix-OS v1.0.3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-green-400">Flix-OS v1.0.3</h1>
          <p className="text-gray-400 text-sm">Personal AI Workspace</p>
          {selectedAgent && (
            <div className="mt-2 text-yellow-400 text-sm">              Active Agent: {selectedAgent}
            </div>
          )}
        </header>

        <div
          ref={terminalRef}
          className="bg-gray-900 border border-green-400 rounded p-4 h-96 overflow-y-auto mb-4 font-mono text-sm"
        >
          {messages.map((msg, index) => (
            <div key={index} className={`${getTerminalColor(msg.type)} mb-1`}>
              <span className="text-gray-500 mr-2">$</span>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="text-blue-400 mb-1">
              <span className="text-gray-500 mr-2">$</span>
              <span className="animate-pulse">Processing...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Enter command..."
            className="flex-1 bg-gray-900 border border-green-400 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-blue-400 disabled:bg-gray-800"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-300 disabled:bg-gray-600 disabled:text-gray-400"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}