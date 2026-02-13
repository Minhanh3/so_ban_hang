
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';
import { askGemini } from '../services/gemini';
import { db } from '../services/storage';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await db.queryAll();
      const response = await askGemini(userMessage, data);
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'Không có phản hồi.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Đã có lỗi xảy ra trong kết nối cơ sở dữ liệu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden max-h-[500px]">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">Trợ lý AI (SQL Assistant)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px]">
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm text-center italic mt-10">
                Hãy hỏi tôi về tình hình kinh doanh, tồn kho hoặc đơn hàng trong SQL Server!
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl p-3 shadow-sm rounded-tl-none">
                  <Loader2 className="animate-spin text-blue-600" size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi về dữ liệu..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default AIAssistant;
