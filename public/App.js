const { useState, useEffect, useRef } = React;

const App = () => {
    const [messages, setMessages] = useState([{ role: 'ai', text: 'تم إقلاع Flix-OS v1.0.2... النظام بانتظار أوامرك.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);

    // --- هــــام جـــداً ---
    // انسخ الـ ID الحقيقي من جدول agents في Supabase وضعه هنا
    const REAL_AGENT_ID = "ضع_الـ_UUID_هنا"; 

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
                    agent_id: REAL_AGENT_ID,
                    session_id: "flix_session_1",
                    message: msg
                })
            });

            const data = await response.json();
            
            if (data.error) {
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ خطأ: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "❌ فشل الاتصال بالمحرك السحابي. تأكد من الـ Variables في Vercel." }]);
        } finally {
            setLoading(false);
            chatRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-green-400 font-mono p-4">
            <div className="flex-1 overflow-y-auto space-y-4 border border-green-900 p-4 mb-4 bg-gray-950 rounded">
                {messages.map((m, i) => (
                    <div key={i} className={`p-2 border ${m.role === 'user' ? 'border-green-700 bg-green-900/20 text-right' : 'border-blue-900 bg-blue-900/10 text-left'}`}>
                        {m.text}
                    </div>
                ))}
                <div ref={chatRef} />
            </div>
            <div className="flex gap-2">
                <input 
                    className="flex-1 bg-black border border-green-500 p-2 outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Enter command..."
                />
                <button onClick={sendMessage} className="bg-green-700 px-6 py-2 text-white hover:bg-green-600">
                    {loading ? "..." : "SEND"}
                </button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
