import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Claim } from '../types';
import { createManifestAssistant } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, PaperClipIcon, ArrowRightIcon } from './icons/Icons';
import { GenerateContentResponse, Chat } from '@google/genai';

interface ManifestAssistantProps {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
}

const ManifestAssistant: React.FC<ManifestAssistantProps> = ({ claim, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello! I'm your Claims Assistant. I've reviewed the claim for ${claim.policyholderName}. How can I help you with this case?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createManifestAssistant(claim);
    }
  }, [isOpen, claim]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMessage });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
         const responseChunk = chunk as GenerateContentResponse;
         const text = responseChunk.text;
         if (text) {
             fullText += text;
             setMessages(prev => {
                 const newMessages = [...prev];
                 newMessages[newMessages.length - 1].text = fullText;
                 return newMessages;
             });
         }
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error processing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="bg-brand-primary text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-brand-accent" />
          <h3 className="font-semibold text-lg">Claims Assistant</h3>
        </div>
        <button onClick={onClose} className="hover:bg-brand-secondary rounded-full p-1 transition-colors">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-light">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-brand-primary text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-neutral-dark rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this claim..."
            className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none text-sm bg-white text-neutral-black"
            rows={3}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bottom-3 bg-brand-primary text-white p-1.5 rounded-md hover:bg-brand-secondary disabled:opacity-50 transition-colors"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
            AI can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  );
};

export default ManifestAssistant;