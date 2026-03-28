const { useState, useEffect, useRef } = React;

const App = () => {
    const [messages, setMessages] = useState([{ role: 'ai', text: 'تم إقلاع Flix-OS v1.0.2... النظام بانتظار أوامرك.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);

    // الـ ID الذي أنشأناه في الـ SQL بالأعلى
    const FLIX_AGENT_ID = "550e8400-e29b-41d4-a716-446655440000"; 

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
                    agent_id: FLIX_AGENT_ID,
                    session_id: "flix_main_session",
                    message: msg
                })
            });

            const data = await response.json();
            
            if (data.error) {
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ خطأ في السيرفر: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "❌ فشل الاتصال. تأكد من إعدادات Vercel ووجود الـ API Keys." }]);
        } finally {
            setLoading(false);
            chatRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
            <header className="p-4 border-b border-green-900 bg-gray-950 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-widest text-green-500">FLIX-OS CORE</h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs uppercase">System Live</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[85%] border shadow-lg ${m.role === 'user' ? 'bg-green-900/30 border-green-500' : 'bg-gray-900 border-gray-700'}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatRef} />
            </div>

            <div className="p-4 bg-gray-950 border-t border-green-900 flex gap-2">
                <input 
                    className="flex-1 bg-black border border-green-800 p-3 outline-none text-green-400 focus:border-green-400 transition-all"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Enter command to Flix-OS..."
                />
                <button 
                    onClick={sendMessage} 
                    className={`px-6 py-2 font-bold transition-all ${loading ? 'bg-gray-700' : 'bg-green-700 hover:bg-green-600'} text-white rounded`}
                >
                    {loading ? "PROCESSING..." : "EXECUTE"}
                </button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
