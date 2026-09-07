import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCommanderProps {
    onViewChange: (view: 'MONITOR' | 'GLOBAL' | 'GEN_LAB') => void;
    onToggleBreak: () => void;
    onAutoHeal: () => void;
}

export function VoiceCommander({ onViewChange, onToggleBreak, onAutoHeal }: VoiceCommanderProps) {
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState<string>('');
    const [showToast, setShowToast] = useState(false);
    const recognitionRef = useRef<any>(null);
    const shouldRestartRef = useRef(true); // Track if we should auto-restart

    useEffect(() => {
        // Check browser compatibility
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Only auto-restart if not manually stopped
            if (recognitionRef.current && shouldRestartRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    // Already started
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // Restart on common errors
                setTimeout(() => {
                    if (recognitionRef.current) {
                        try {
                            recognition.start();
                        } catch (e) {
                            // Ignore
                        }
                    }
                }, 1000);
            }
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            processCommand(transcript);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    const processCommand = (transcript: string) => {
        console.log('Voice input:', transcript);

        let commandRecognized = false;
        let commandName = '';

        // Command Grammar
        if (transcript.includes('inject') && (transcript.includes('failure') || transcript.includes('fail'))) {
            commandName = 'INJECT FAILURE';
            onToggleBreak();
            commandRecognized = true;
        } else if (transcript.includes('simulate') && transcript.includes('crash')) {
            commandName = 'SIMULATE CRASH';
            onToggleBreak();
            commandRecognized = true;
        } else if ((transcript.includes('authorize') || transcript.includes('auto')) && (transcript.includes('repair') || transcript.includes('heal'))) {
            commandName = 'AUTO-HEAL';
            onAutoHeal();
            commandRecognized = true;
        } else if (transcript.includes('fix') && transcript.includes('system')) {
            commandName = 'FIX SYSTEM';
            onAutoHeal();
            commandRecognized = true;
        } else if (transcript.includes('show') && (transcript.includes('global') || transcript.includes('globe'))) {
            commandName = 'SHOW GLOBAL';
            onViewChange('GLOBAL');
            commandRecognized = true;
        } else if (transcript.includes('show') && (transcript.includes('monitor') || transcript.includes('monitoring'))) {
            commandName = 'SHOW MONITOR';
            onViewChange('MONITOR');
            commandRecognized = true;
        } else if (transcript.includes('show') && (transcript.includes('lab') || transcript.includes('laboratory'))) {
            commandName = 'SHOW LAB';
            onViewChange('GEN_LAB');
            commandRecognized = true;
        } else if (transcript.includes('global') && transcript.includes('view')) {
            commandName = 'GLOBAL VIEW';
            onViewChange('GLOBAL');
            commandRecognized = true;
        }

        if (commandRecognized) {
            setLastCommand(commandName);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            // User manually stopping - don't auto-restart
            shouldRestartRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            // User manually starting - enable auto-restart
            shouldRestartRef.current = true;
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    };

    return (
        <>
            {/* Floating Voice Orb */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={toggleListening}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                        ? 'bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 animate-pulse shadow-lg shadow-purple-500/50'
                        : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600'
                        }`}
                >
                    {isListening ? (
                        <Mic className="w-6 h-6 text-white" />
                    ) : (
                        <MicOff className="w-6 h-6 text-slate-400" />
                    )}

                    {/* Listening Ripple Effect */}
                    {isListening && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-purple-500 opacity-20 animate-ping"></span>
                            <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" style={{ animationDelay: '0.5s' }}></span>
                        </>
                    )}
                </button>

                {/* Status Label */}
                <div className={`absolute top-full mt-2 right-0 text-[10px] font-mono text-center transition-opacity ${isListening ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <span className="bg-slate-900/90 px-2 py-1 rounded border border-purple-500/30 text-purple-400">
                        LISTENING...
                    </span>
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-emerald-900/90 border border-emerald-500 rounded-lg px-6 py-3 shadow-lg shadow-emerald-500/30">
                        <div className="text-emerald-200 font-mono text-sm tracking-wider flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span>&gt;&gt; COMMAND RECOGNIZED: "{lastCommand}"</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom CSS for animations */}
            <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-top-2 {
          from { transform: translateY(-8px) translateX(-50%); }
          to { transform: translateY(0) translateX(-50%); }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out;
        }
      `}</style>
        </>
    );
}

export default VoiceCommander;
