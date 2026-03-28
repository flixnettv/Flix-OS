const { useState, useEffect, useRef } = React;

const App = () => {
    const [messages, setMessages] = useState([{ role: 'ai', text: 'تم إقلاع Flix-OS v1.0.2... النظام بانتظار أوامرك.' }]);
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState(["[System] Connecting to Vercel Edge..."]);
    const [loading, setLoading] = useState(false);
    
    // المراجع (Refs)
    const chatRef = useRef(null);
    const logRef = useRef(null);

    // تحديث اللوجات (الترمنال)
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/terminal');
                const data = await res.json();
                if (data.logs) setLogs(data.logs);
            } catch (e) { console.error("Log Fetch Failure"); }
        };
        const timer = setInterval(fetchLogs, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
        logRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, logs]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const msg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setLoading(true);

        try {
            const response = await fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: "550e8400-e29b-41d4-a716-446655440000", // استبدله بالـ ID الحقيقي من Supabase
                    session_id: "flix_main_session",
                    message: msg,
                    provider: 'gemini'
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.reply || "خطأ في الرد." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "فشل الاتصال بالمحرك السحابي." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden border-2 border-green-900">
            {/* Header */}
            <header className="p-4 border-b border-green-900 bg-gray-900 flex justify-between">
                <span className="font-bold tracking-tighter">FLIX-OS // CORE_SYSTEM</span>
                <span className="text-xs animate-pulse">● ONLINE</span>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded max-w-[80%] border ${m.role === 'user' ? 'bg-green-900 border-green-400' : 'bg-gray-900 border-gray-700'}`}>
                            <p className="text-sm">{m.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatRef} />
            </div>

            {/* Terminal Monitor */}
            <div className="h-32 bg-black border-t border-green-900 p-2 overflow-y-auto text-[10px] opacity-70">
                {logs.map((l, i) => <div key={i} className="leading-tight text-green-700">> {l}</div>)}
                <div ref={logRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-950 border-t border-green-900 flex gap-2">
                <input 
                    className="flex-1 bg-black border border-green-800 p-2 outline-none text-green-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Enter command..."
                />
                <button onClick={sendMessage} className="bg-green-800 px-4 text-white">SEND</button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
