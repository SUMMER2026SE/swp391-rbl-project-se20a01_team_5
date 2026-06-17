"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';

const suggestionsFromBackend = [];

export default function StudentAIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notice, setNotice] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(false);
    setNotice('AI assistant đang được giữ ngoài luồng demo Iter1 để tránh nhầm với các chức năng đã sẵn sàng.');
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-6 font-sans">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-brand-primary" /> AI Trợ lý Thông minh
        </h1>
        <p className="text-brand-text/60 font-medium">Hỏi đường, tìm chuyến xe, giải đáp nội quy - Mọi thứ chỉ trong 1 nốt nhạc.</p>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden pb-6 min-h-0">

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden relative min-h-0">

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto messenger-scrollbar p-6 flex flex-col gap-6 min-h-0">
            {notice && (
              <div className="rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
                {notice}
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-center text-sm font-bold text-brand-text/40">
                Chưa có hội thoại từ backend.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-black text-brand-primary' : 'bg-brand-surface text-brand-text border border-black/5'}`}>
                  {msg.role === 'ai' ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-brand-surface border border-black/5 text-brand-text rounded-tr-none' : 'bg-brand-primary/10 border border-brand-primary/20 text-brand-text rounded-tl-none'}`}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {/* Xử lý in đậm text trong ngoặc ** ** */}
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} className="font-black">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                      {i !== msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 max-w-[85%] self-start">
                <div className="w-10 h-10 rounded-full bg-black text-brand-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-text rounded-tl-none flex items-center gap-1.5 h-12">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-brand-surface/50 border-t border-black/5">
            <div className="relative flex items-center bg-white border border-black/10 rounded-2xl p-2 shadow-sm focus-within:border-brand-primary focus-within:shadow-md transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Hỏi UniBot điều gì đó... (VD: Tìm đường từ KTX đến trường)"
                className="flex-1 bg-transparent border-none py-3 px-4 text-sm font-bold focus:outline-none placeholder-brand-text/40"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-black text-brand-primary rounded-xl flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>

        </div>

        {/* Suggestion Panel */}
        <div className="xl:w-1/3 bg-brand-text rounded-3xl shadow-sm border border-black/5 p-6 md:p-8 flex flex-col text-white relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" /> Gợi ý Câu hỏi
          </h3>
          <p className="text-sm font-medium text-white/60 mb-8">
            Click vào các câu hỏi bên dưới để hỏi UniBot ngay lập tức.
          </p>

          <div className="flex flex-col gap-4 relative z-10">
            {suggestionsFromBackend.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white/60">
                Chưa có gợi ý câu hỏi từ backend.
              </div>
            )}
            {suggestionsFromBackend.map((sug, idx) => {
              const Icon = sug.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSend(sug.text)}
                  className="bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-2xl cursor-pointer transition-colors flex gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed">{sug.text}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <Bot className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <div className="text-xs font-bold text-brand-primary uppercase tracking-wider">Phiên bản</div>
              <div className="font-bold">UniBot AI v1.0</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
