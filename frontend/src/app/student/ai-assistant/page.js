"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Map, Clock, Info } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Map, text: "Tôi đang ở KTX Bách Khoa, làm sao để đến ĐH Kinh Tế nhanh nhất?" },
  { icon: Clock, text: "Xe số 2 (ĐH Bách Khoa - ĐH Ngoại Ngữ) chuyến tiếp theo lúc mấy giờ?" },
  { icon: Info, text: "Tôi lỡ đánh rơi đồ trên xe 43B-123.45 thì phải liên hệ ai?" }
];

export default function StudentAIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Xin chào! Mình là **UniBot** - Trợ lý AI của hệ thống xe bus UniBus. Mình có thể giúp bạn tìm đường đi ngắn nhất, tra cứu lịch trình, hoặc giải đáp mọi thắc mắc về hệ thống. Bạn cần mình giúp gì nào? ✨' },
    { role: 'user', content: 'Cho mình hỏi trạm KTX lúc mấy giờ có xe?' },
    { role: 'ai', content: 'Trạm KTX Bách Khoa có chuyến xe tiếp theo lúc **07:15** nha bạn. Tuyến số 1 đi ngang qua trạm này.' },
    { role: 'user', content: 'Ok cảm ơn UniBot nha!' },
    { role: 'ai', content: 'Không có gì! Bạn nhớ ra trạm trước 5 phút để đón xe nhé. Chúc bạn một ngày tốt lành! 🚌' },
    { role: 'user', content: 'À quên, xe này có dừng ở cổng ĐH Ngoại Ngữ không?' },
    { role: 'ai', content: 'Dạ có ạ! Tuyến số 1 sẽ dừng ở cổng chính ĐH Ngoại Ngữ. Thời gian di chuyển từ KTX Bách Khoa đến đó khoảng 15 phút.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    // Thêm tin nhắn của User
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Giả lập AI trả lời sau 1.5s
    setTimeout(() => {
      let aiResponse = "";
      if (text.toLowerCase().includes("kinh tế")) {
        aiResponse = "Để đến **ĐH Kinh Tế** từ **KTX Bách Khoa**, bạn hãy đi **Tuyến số 1** nhé! \n\n🚌 Tuyến số 1 sẽ đi ngang trạm KTX Bách Khoa sau **5 phút nữa** (Lúc 07:15). Bạn hãy chuẩn bị ra trạm nhé! Nếu cần mình sẽ gửi thông báo Push cho bạn khi xe cách trạm 500m.";
      } else if (text.toLowerCase().includes("mấy giờ")) {
        aiResponse = "Chuyến tiếp theo của **Tuyến số 2** sẽ khởi hành từ trạm gốc lúc **14:00**. Xe sẽ đi qua các điểm: ĐH Bách Khoa ➡️ ĐH Sư Phạm ➡️ ĐH Ngoại Ngữ. Thời gian di chuyển dự kiến là 25 phút. Bạn có muốn mình đặt vé trước cho bạn không?";
      } else {
        aiResponse = "Cảm ơn bạn đã đặt câu hỏi. Mình là AI được huấn luyện chuyên sâu về dữ liệu giao thông của UniBus. Hiện tại hệ thống đang được cập nhật, mình sẽ trả lời câu hỏi này chi tiết hơn trong phiên bản tới nhé! 🤖";
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
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
            {SUGGESTIONS.map((sug, idx) => {
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
