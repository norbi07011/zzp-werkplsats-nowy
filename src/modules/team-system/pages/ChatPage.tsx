import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Send } from 'lucide-react';

export const ChatPage = () => {
  const { chatMessages, addChatMessage, currentUser, t } = useStore();
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-700">{t('chat')}</h2>
        <p className="text-xs text-slate-400">Company wide channel</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map(msg => {
          const isMe = msg.userId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] p-3 rounded-lg ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                 {!isMe && <p className="text-xs font-bold text-slate-500 mb-1">{msg.userName}</p>}
                 <p className="text-sm">{msg.text}</p>
               </div>
               <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex space-x-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('enterMessage')}
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-primary-500"
        />
        <button type="submit" className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
