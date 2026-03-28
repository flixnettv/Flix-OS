const { useState, useEffect, useRef } = React;

const App = () => {
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Flix-OS v1.0.2 Initialized. System standby.' }]);
    const [logs, setLogs] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    const AGENT_ID = "550e8400-e29b-41d4-a716-446655440000";

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await fetch('/api/terminal');
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        };
        const interval = setInterval(fetchLogs, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

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
                body: JSON.stringify({ agent_id: AGENT_ID, session_id: "main_user", message: msg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.reply || data.error }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection failed." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-green-900 bg-black">
            <header className="p-4 border-b border-green-900 bg-gray-950 text-center font-bold">FLIX-OS // CORE</header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded border ${m.role === 'user' ? 'bg-green-950 border-green-500' : 'bg-gray-900 border-gray-700'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <div className="h-24 overflow-y-auto p-2 text-[10px] bg-black border-t border-green-900 opacity-50">
                {logs.map((l, i) => <div key={i}>> {l}</div>)}
            </div>

            <div className="p-4 flex gap-2 bg-gray-950">
                <input 
                    className="flex-1 bg-black border border-green-800 p-2 outline-none"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Command..."
                />
                <button onClick={handleSend} className="bg-green-800 px-4 py-2 text-white uppercase text-xs">Execute</button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
