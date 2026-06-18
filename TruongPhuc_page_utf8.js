"use client";

import { useState } from 'react';
import { Phone, AlertTriangle, MessageSquare, Send, Wrench, ShieldAlert, AlertCircle, PhoneCall } from 'lucide-react';

export default function CoordinatorContactPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'coordinator', text: 'Ch├áo b├íc t├ái. Tuyß║┐n 1 Nguyß╗àn L╞░╞íng Bß║▒ng ─æang c├│ kß║╣t xe nhß║╣, b├íc ch├║ ├╜ ─æi chß║¡m lß║íi nh├⌐.', time: '14:20' },
    { id: 2, sender: 'driver', text: 'Nhß║¡n tin. T├┤i ─æang chß║íy chß║¡m, dß╗▒ kiß║┐n chß║¡m khoß║úng 5 ph├║t.', time: '14:22' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      sender: 'driver',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const handleSOS = (type) => {
    alert(`─É├ú gß╗¡i b├ío ─æß╗Öng khß║⌐n cß║Ñp tß╗¢i ─Éiß╗üu phß╗æi vi├¬n: ${type}!`);
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">─Éiß╗üu phß╗æi vi├¬n</h1>
        <p className="text-brand-text/60 font-medium">Kß║┐t nß╗æi trß╗▒c tiß║┐p vß╗¢i trung t├óm ─æß╗â xß╗¡ l├╜ c├íc t├¼nh huß╗æng ph├ít sinh.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Left Column: Info & SOS Buttons */}
        <div className="flex flex-col gap-6">
          
          {/* Coordinator Profile Bento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-brand-surface rounded-[24px] border border-black/5 flex items-center justify-center shadow-sm">
                <span className="text-3xl font-black text-brand-primary">L</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-text">L├¬ Quß╗æc Bß║úo</h2>
                <p className="text-sm font-medium text-brand-text/60 mb-2">─Éiß╗üu phß╗æi vi├¬n Ca Chiß╗üu</p>
                <div className="inline-flex px-3 py-1 bg-brand-success/10 text-brand-success font-bold text-xs rounded-full items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                  ─Éang trß╗▒c ban
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 relative z-10">
              <button className="flex-1 py-4 bg-brand-primary rounded-2xl font-bold text-brand-text hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                <PhoneCall className="w-5 h-5" /> Gß╗ìi ─æiß╗çn thoß║íi
              </button>
            </div>
          </div>

          {/* SOS Buttons Bento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-brand-danger" /> B├ío c├ío sß╗▒ cß╗æ (SOS)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <button 
                onClick={() => handleSOS('Hß╗Ång xe / Nß╗ò lß╗æp')}
                className="bg-brand-surface border border-black/5 hover:border-brand-warning hover:bg-brand-warning/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6 text-brand-warning" />
                </div>
                <span className="font-bold text-sm">Hß╗Ång xe / Nß╗ò lß╗æp</span>
              </button>

              <button 
                onClick={() => handleSOS('Kß║╣t xe nghi├¬m trß╗ìng')}
                className="bg-brand-surface border border-black/5 hover:border-brand-secondary hover:bg-brand-secondary/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-brand-secondary" />
                </div>
                <span className="font-bold text-sm">Kß║╣t xe nghi├¬m trß╗ìng</span>
              </button>

              <button 
                onClick={() => handleSOS('Tai nß║ín khß║⌐n cß║Ñp')}
                className="md:col-span-2 bg-brand-danger/10 border border-brand-danger/20 hover:bg-brand-danger hover:text-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group text-brand-danger"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6 text-brand-danger" />
                </div>
                <span className="font-bold text-sm">Tai nß║ín / Cß║Ñp cß╗⌐u y tß║┐</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Chat Interface Bento */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden h-[600px] lg:h-auto">
          
          <div className="p-6 border-b border-black/5 bg-brand-surface/50 flex items-center justify-between shrink-0">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-secondary" /> Chat Nß╗Öi bß╗Ö
            </h3>
            <span className="text-xs font-bold text-brand-text/50 uppercase tracking-widest">K├¬nh ╞░u ti├¬n</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
            <div className="text-center text-xs font-bold text-brand-text/30 mb-2">H├┤m nay</div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'driver' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  max-w-[80%] p-4 rounded-2xl text-sm font-medium
                  ${msg.sender === 'driver' 
                    ? 'bg-brand-text text-white rounded-tr-none' 
                    : 'bg-brand-surface text-brand-text rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
                <div className="text-[10px] font-bold text-brand-text/40 mt-1 mx-1">
                  {msg.time}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 bg-white shrink-0 flex gap-3">
            <input 
              type="text" 
              placeholder="Nhß║¡p tin nhß║»n..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-brand-surface border border-black/5 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-primary transition-colors"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-2xl bg-brand-primary text-brand-text flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
