const { useState, useEffect, useRef } = React;

function App() {
    const [logs, setLogs] = useState(["[Flix-OS v1.0] System Booting...", "Connecting to Supabase... OK", "Orchestrator ready."]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endOfLogsRef = useRef(null);

    // التمرير التلقائي للأسفل
    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleCommand = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const command = input;
        setInput("");
        setLogs(prev => [...prev, `> ${command}`]);
        setLoading(true);

        try {
            // توجيه الطلب إلى نقطة نهاية Vercel Serverless
            const res = await fetch('/api/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: command, 
                    agentId: "agent_alpha_01", 
                    sessionId: "session_123" 
                })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                setLogs(prev => [...prev, `[System]: ${data.response}`]);
            } else {
                setLogs(prev => [...prev, `[Error]: ${data.error}`]);
            }
        } catch (error) {
            setLogs(prev => [...prev, `[Network Error]: Could not connect to Orchestrator.`]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {logs.map((log, index) => (
                    <div key={index} className="text-sm">
                        <span className="text-emerald-500">{log}</span>
                    </div>
                ))}
                {loading && <div className="text-sm text-yellow-500 animate-pulse">Processing task...</div>}
                <div ref={endOfLogsRef} />
            </div>

            <form onSubmit={handleCommand} className="flex gap-2">
                <span className="text-emerald-500 mt-2">root@flix-os:~$</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-emerald-400 font-mono text-sm"
                    placeholder="Enter command or task..."
                    autoFocus
                />
            </form>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
