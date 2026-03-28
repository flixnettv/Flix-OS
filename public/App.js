const { useState, useEffect, useRef } = React;

const App = () => {
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Flix-OS Core Online...' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    const AGENT_ID = "550e8400-e29b-41d4-a716-446655440000"; 

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const msg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: AGENT_ID, session_id: "hany_dev", message: msg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.reply || `⚠️ ${data.error}` }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "❌ Connection Lost" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
            <div className="p-4 border-b border-green-900 bg-gray-950 text-center font-bold">FLIX-OS v1.0.2</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 border ${m.role === 'user' ? 'bg-green-900 border-green-400' : 'bg-gray-900 border-gray-700'} max-w-[80%]`}>
                            <pre className="whitespace-pre-wrap">{m.text}</pre>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="p-4 bg-gray-950 flex gap-2">
                <input className="flex-1 bg-black border border-green-800 p-2 outline-none" 
                       value={input} onChange={e => setInput(e.target.value)} 
                       onKeyPress={e => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} className="bg-green-800 px-4 py-2 text-white">EXECUTE</button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
