import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle, X, Send, Bot, User, Loader2,
    Trash2, Minimize2, Maximize2, Sparkles
} from 'lucide-react';
import { chatService } from '../../services/api/chatService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ChatAgent = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Charger l'historique au démarrage
    useEffect(() => {
        if (isOpen) {
            loadHistory();
            setUnreadCount(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Scroll automatique
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus sur l'input à l'ouverture
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const loadHistory = async () => {
        setInitialLoading(true);
        try {
            const data = await chatService.getHistory();
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            date_creation: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const data = await chatService.sendMessage(userMessage.content);

            setMessages(prev => [
                ...prev.filter(m => m.id !== userMessage.id),
                data.user_message,
                data.assistant_message,
            ]);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'envoi du message');
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
            setInput(userMessage.content);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm('Effacer tout l\'historique de la conversation ?')) return;
        try {
            await chatService.clearHistory();
            setMessages([]);
            toast.success('Historique effacé');
        } catch (error) {
            toast.error('Erreur lors de l\'effacement');
        }
    };

    const handleQuickQuestion = (q) => {
        setInput(q);
        inputRef.current?.focus();
    };

    // Suggestions de questions rapides
    const quickQuestions = isAuthenticated ? [
        "Combien y a-t-il d'hôtels ?",
        "Quelles villes sont disponibles ?",
        "Quels sont les prix ?",
        "Comment réserver ?",
    ] : [
        "Combien y a-t-il d'hôtels ?",
        "Quelles villes sont disponibles ?",
        "Quels sont les prix ?",
        "Comment s'inscrire ?",
    ];

    // ✅ BOUTON FERMÉ
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
                title="Discuter avec Ravorona"
            >
                <div className="relative">
                    <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <span className="font-semibold hidden sm:inline">Assistant IA</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            </button>
        );
    }

    // ✅ FENÊTRE RÉDUITE
    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50 w-72 bg-white rounded-t-xl shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <span className="font-semibold text-sm">Ravorona</span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="p-1 hover:bg-white/20 rounded"
                            title="Agrandir"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded"
                            title="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ FENÊTRE COMPLÈTE
    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm flex items-center gap-1">
                            Ravorona
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                        </h3>
                        <p className="text-xs text-white/80">
                            {isAuthenticated ? `Bonjour ${user?.username}` : 'Assistant IA'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleClear}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                        title="Effacer l'historique"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                        title="Réduire"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                        title="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {initialLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bot className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">
                            Bonjour ! 👋
                        </h4>
                        <p className="text-sm text-gray-600 mb-4 px-4">
                            Je suis <strong>Ravorona</strong>, votre assistant personnel.
                            {!isAuthenticated && (
                                <> Connectez-vous pour des infos personnalisées.</>
                            )}
                        </p>
                        <div className="space-y-2 text-left px-2">
                            <p className="text-xs text-gray-500 font-medium mb-2 px-2">
                                Questions fréquentes :
                            </p>
                            {quickQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickQuestion(q)}
                                    className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition"
                                >
                                    💬 {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.content}
                                </p>
                                <p
                                    className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                        }`}
                                >
                                    {new Date(msg.date_creation).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Loader pendant la réponse */}
                {loading && (
                    <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t border-gray-200 flex gap-2"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    maxLength={500}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Envoyer"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>

            {/* FOOTER */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                    🤖 Propulsé par Gemini IA • {isAuthenticated ? 'Connecté' : 'Mode visiteur'}
                </p>
            </div>
        </div>
    );
};

export default ChatAgent;