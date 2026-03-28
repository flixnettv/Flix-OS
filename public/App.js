const { useState, useEffect, useRef } = React;

/**
 * Flix-OS Core: Terminal Interface (React)
 * مدمج مع نظام ACE3 Memory و Supabase Real-time
 */
function App() {
    // حالة السجلات (Logs) المعروضة في الشاشة
    const [logs, setLogs] = useState([
        "[Flix-OS v1.0.2] System Booting...",
        "Initializing ACE3 Memory Engine...",
        "Connecting to Supabase Cloud... OK",
        "Orchestrator ready. Welcome, Root."
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endOfLogsRef = useRef(null);

    // 1. التمرير التلقائي للأسفل عند إضافة سجلات جديدة
    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // 2. الاستماع اللحظي (Real-time) للتغييرات في قاعدة البيانات
    // هذا الجزء يسمح للـ Cron Jobs والوكلاء بإرسال تحديثات تظهر فوراً
    useEffect(() => {
        // تأكد من تهيئة مكتبة supabase في البيئة العالمية أو استدعائها
        if (window.supabaseClient) {
            const channel = window.supabaseClient
                .channel('system-logs')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'agent_logs' }, 
                    (payload) => {
                        const newLog = payload.new;
                        const timestamp = new Date().toLocaleTimeString();
                        setLogs(prev => [...prev, `[${timestamp}] [${newLog.log_level}]: ${newLog.message}`]);
                    }
                )
                .subscribe();

            return () => {
                window.supabaseClient.removeChannel(channel);
            };
        }
    }, []);

    // 3. معالجة الأوامر المرسلة من المستخدم
    const handleCommand = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const command = input;
        setInput(""); // مسح الحقل فوراً لسرعة الاستجابة
        setLogs(prev => [...prev, `root@flix-os:~$ ${command}`]);
        setLoading(true);

        try {
            // إرسال الطلب إلى الـ Orchestrator (Vercel API)
            const res = await fetch('/api/index', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    prompt: command, 
                    agentId: "flix_admin_01", 
                    sessionId: "session_master_2026",
                    useMcp: command.includes("read github") ? { action: 'read_github', owner: 'your-user', repo: 'your-repo', path: 'README.md' } : null
                })
            });

            const data = await res.json();
            
            if (data.status === 'success') {
                setLogs(prev => [...prev, `[AI]: ${data.response}`]);
            } else {
                setLogs(prev => [...prev, `[System Error]: ${data.error || "Unknown error"}`]);
            }
        } catch (error) {
            setLogs(prev => [...prev, `[Network Error]: Connection to Orchestrator failed.`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 border border-emerald-900/50 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)] p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-emerald-900/30 pb-2">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="text-[10px] text-emerald-700 uppercase tracking-widest font-bold">
                    Flix-OS Core Console v1.0
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-1 custom-scrollbar">
                {logs.map((log, index) => (
                    <div key={index} className="text-sm leading-relaxed">
                        {log.startsWith('>') || log.startsWith('root@') ? (
                            <span className="text-emerald-400">{log}</span>
                        ) : log.includes('[Error]') ? (
                            <span className="text-red-400 font-bold">{log}</span>
                        ) : (
                            <span className="text-emerald-500/80">{log}</span>
                        )}
                    </div>
                ))}
                
                {/* حالة المعالجة */}
                {loading && (
                    <div className="text-sm text-emerald-300 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        Thinking...
                    </div>
                )}
                <div ref={endOfLogsRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleCommand} className="flex gap-3 border-t border-emerald-900/30 pt-4">
                <span className="text-emerald-500 font-bold">λ</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-emerald-400 font-mono text-sm placeholder-emerald-900"
                    placeholder="Type a command or ask Flix-OS..."
                    autoFocus
                    disabled={loading}
                />
            </form>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #064e3b;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

// تصدير المكون ليتم استخدامه في index.html
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
