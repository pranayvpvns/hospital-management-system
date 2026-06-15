import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Loader2, AlertTriangle } from 'lucide-react';
import { agentAPI } from '../services/api';

const UfoChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: 'Hi! I am the MNH UFO AI Operator. How can I help?', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      // Capture current UI State to send to AI Action Planner
      const uiState = {
        currentRoute: window.location.pathname,
        availableFields: Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))
          .map(el => el.id || el.name).filter(Boolean),
        availableButtons: Array.from(document.querySelectorAll('button'))
          .map(el => el.id || el.innerText.trim()).filter(Boolean)
      };

      const response = await agentAPI.chat(userMsg, uiState);
      const data = response.data;
      
      // Add response based on backend format
      let message = "Action processed.";
      if (data.details) {
        message = data.details;
      } else if (data.message) {
        message = data.message;
      }
      
      // Add status information
      if (data.status === 'failure') {
        message += " (Failed)";
      } else if (data.status === 'success') {
        message += " (Success)";
      }
      
      setMessages(prev => [...prev, { text: message, sender: 'ai' }]);

      // Process next steps if available
      if (data.next_steps) {
        setTimeout(() => {
          setMessages(prev => [...prev, { text: `Next steps: ${data.next_steps}`, sender: 'ai' }]);
        }, 500);
      }

      // Process UFO actions if available (for future compatibility)
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach((action, i) => {
          setTimeout(() => {
            executeAction(action);
          }, (i + 1) * 500);
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: "Failed to connect to UFO Orchestrator.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action) => {
    const actionType = action.action || action.type;
    
    switch (actionType?.toUpperCase()) {
      case 'NAVIGATE':
        navigate(action.target);
        break;
      case 'TYPE':
      case 'FILL':
        // Safe DOM manipulation to auto-fill inputs
        const fieldName = action.target || action.field;
        const inputEl = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
        if (inputEl) {
          // Native value setter properly triggers React events
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputValueSetter.call(inputEl, action.value);
          const event = new Event('input', { bubbles: true });
          inputEl.dispatchEvent(event);
          
          inputEl.style.transition = 'all 0.3s';
          inputEl.style.boxShadow = '0 0 0 2px #4ade80';
          setTimeout(() => inputEl.style.boxShadow = '', 1500);
        }
        break;
      case 'CLICK':
        const btnEl = document.getElementById(action.target) || document.querySelector(`button[type="submit"]`);
        if (btnEl) btnEl.click();
        break;
      case 'ALERT':
        // Add a visual alert message to the chat
        setMessages(prev => [...prev, { 
          text: `[SYSTEM ALERT] ${action.message || 'Action executed'}`, 
          sender: 'ai', 
          isAlert: true,
          level: action.level || 'high'
        }]);
        break;
      case 'WAIT':
        // Timeout handling could be complex here, so we skip synchronous block
        break;
      default:
        break;
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'}`}
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: '80vh', height: '500px' }}>
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-semibold text-sm">AI Operator</h3>
                <p className="text-xs opacity-80 text-primary-100">UFO Architecture</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none' : m.isAlert ? 'bg-rose-100 text-rose-800 border-rose-300 border font-semibold flex gap-2' : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'}`}>
                  {m.isAlert && <AlertTriangle size={16} />}
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none shadow-sm border border-gray-100 p-3">
                  <Loader2 size={16} className="text-primary-500 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI operator to click or fill..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                disabled={loading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UfoChatWidget;
