import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';
import { ChatMessage, sendMessage } from '../services/chatService';
import { ValidationResult, FileAnalysis } from '../types';

interface ChatWindowProps {
  onClose: () => void;
  validationResults?: ValidationResult[];
  fileAnalyses?: FileAnalysis[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, validationResults, fileAnalyses }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    try {
      const response = await sendMessage(userMessage, messages, validationResults, fileAnalyses);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response }
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out hover:translate-y-[-2px] z-50 overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-green-50 text-gray-800">
        <h3 className="font-medium text-blue-900">File Inspector Assistant</h3>
        {(validationResults?.length || fileAnalyses?.length) && (
          <span className="text-xs text-green-600">
            {fileAnalyses?.length || 0} files • {validationResults?.length || 0} entries
          </span>
        )}
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">×</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-[#0F1F14] text-white shadow-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about file contents..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;