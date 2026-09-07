import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Brain } from 'lucide-react';

interface Message {
    id: number;
    sender: 'user' | 'cortex';
    text: string;
    timestamp: Date;
}

interface CortexChatProps {
    isCritical: boolean;
}

export function CortexChat({ isCritical }: CortexChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            sender: 'cortex',
            text: 'NeuroSpec Cortex Online. Ready to assist with diagnostics.',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const criticalTriggeredRef = useRef(false);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-trigger on critical failure
    useEffect(() => {
        if (isCritical && !criticalTriggeredRef.current) {
            criticalTriggeredRef.current = true;
            setIsOpen(true);

            setTimeout(() => {
                const alertMessage: Message = {
                    id: Date.now(),
                    sender: 'cortex',
                    text: '>> SYSTEM ALERT: Anomaly Detected. I have loaded the repair protocols for Error Code ERR-204. Ask me for details.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, alertMessage]);
            }, 500);
        } else if (!isCritical) {
            criticalTriggeredRef.current = false;
        }
    }, [isCritical]);

    // Simulated Knowledge Base
    const getResponse = (userMessage: string): string => {
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return 'NeuroSpec Cortex Online. Ready to assist with diagnostics. How can I help you today?';
        }

        if (lowerMsg.includes('spalling')) {
            return 'According to Manual Section 4.2: Inner Race Spalling requires immediate bearing replacement. Recommended Part: BR-99. This failure mode indicates metal fatigue and cannot be repaired in-situ.';
        }

        if (lowerMsg.includes('vibration')) {
            return 'High vibration often indicates misalignment or imbalance. Check:\n• Coupler torque settings (Ref: Section 9.1)\n• Bearing clearances (Ref: Section 5.3)\n• Foundation bolts (Ref: Section 2.4)\nRecommended tolerance: <0.15mm displacement.';
        }

        if (lowerMsg.includes('err-204') || lowerMsg.includes('error 204')) {
            return 'Error Code ERR-204: Predictive Model detected acoustic anomaly pattern consistent with bearing degradation. Recommended Actions:\n1. Schedule visual inspection within 24h\n2. Increase monitoring frequency to 1Hz\n3. Prepare replacement bearing (Part BR-99)\n4. Review lubrication schedule';
        }

        if (lowerMsg.includes('rpm') || lowerMsg.includes('speed')) {
            return 'Optimal operating range: 2900-3100 RPM. Current deviations may cause:\n• Increased wear (below 2000 RPM)\n• Resonance issues (above 4000 RPM)\n• Reduced efficiency (outside optimal range)\nAdjust via RPM control slider.';
        }

        if (lowerMsg.includes('carbon') || lowerMsg.includes('energy')) {
            return 'Energy efficiency is tracked via OEE (Overall Equipment Effectiveness). Current impact metrics include:\n• Power consumption (kW)\n• Carbon footprint (kg CO2/h)\n• Financial impact (€/hour)\nOptimize by maintaining RPM in 2900-3100 range.';
        }

        if (lowerMsg.includes('help') || lowerMsg.includes('commands')) {
            return 'I can assist with:\n• Bearing failures (spalling, wear)\n• Vibration diagnostics\n• Error code explanations\n• RPM optimization\n• Energy efficiency\n• Maintenance procedures\n\nJust ask me a question!';
        }

        return `I understand you're asking about "${userMessage}". While I don't have specific documentation on that topic in my current knowledge base, I recommend:\n1. Checking the main diagnostic terminal\n2. Reviewing system logs\n3. Consulting Manual Section 10 (General Troubleshooting)\n\nIs there anything else I can help with?`;
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            text: inputText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        // Show thinking indicator
        setIsThinking(true);

        // Simulate AI processing delay
        setTimeout(() => {
            setIsThinking(false);
            const response = getResponse(inputText);
            const cortexMessage: Message = {
                id: Date.now() + 1,
                sender: 'cortex',
                text: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, cortexMessage]);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Widget */}
            {isOpen && (
                <div className="neuro-card fixed bottom-24 right-6 w-96 h-[500px] border-cyan-500/50 shadow-2xl shadow-cyan-500/20 flex flex-col z-40">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/80">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <div>
                                <div className="text-sm font-bold text-cyan-400">NeuroSpec Cortex</div>
                                <div className="text-[9px] text-slate-500">Cognitive Repair Assistant</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg font-mono ${msg.sender === 'user'
                                        ? 'bg-cyan-900/40 border border-cyan-500/30 text-cyan-100'
                                        : 'bg-neuro-panel/80 border border-white/10 text-slate-200'
                                        }`}
                                >
                                    <div className="text-sm whitespace-pre-wrap font-mono">{msg.text}</div>
                                    <div className="text-[8px] text-slate-500 mt-1 font-mono">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Thinking Indicator */}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-neuro-panel/80 border border-white/10 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        <span className="text-sm ml-2">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about diagnostics..."
                                disabled={isThinking}
                                className="neuro-input flex-1"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isThinking || !inputText.trim()}
                                className="neuro-btn bg-cyan-900/40 hover:bg-cyan-900/60 border-cyan-500/50 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-24 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCritical
                    ? 'bg-red-900/80 border-2 border-red-500 text-red-200 animate-pulse'
                    : 'bg-cyan-900/80 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-900'
                    } z-40`}
            >
                <MessageCircle className="w-6 h-6" />
                {isCritical && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                )}
            </button>
        </>
    );
}

export default CortexChat;
