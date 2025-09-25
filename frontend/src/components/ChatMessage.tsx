import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { Bot, User, AlertCircle, Info } from 'lucide-react';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getIcon = () => {
    switch (message.type) {
      case 'user':
        return <User size={20} />;
      case 'assistant':
        return <Bot size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'system':
        return <Info size={20} />;
      default:
        return <Bot size={20} />;
    }
  };

  const getMessageClassName = () => {
    return `chat-message ${message.type}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderContent = () => {
    if (message.summaries && message.summaries.length > 0) {
      return (
        <div>
          <p>{message.content}</p>
          <div className="summaries-container">
            {message.summaries.map((summary, index) => (
              <div key={index} className="host-summary">
                <div className="host-ip">{summary.ip}</div>
                <div className="host-summary-text">{summary.summary}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <p>{message.content}</p>;
  };

  return (
    <div className={getMessageClassName()}>
      <div className="message-header">
        <div className="message-icon">
          {getIcon()}
        </div>
        <div className="message-meta">
          <span className="message-sender">
            {message.type === 'user' ? 'You' : 
             message.type === 'assistant' ? 'Censys Assistant' :
             message.type === 'error' ? 'Error' : 'System'}
          </span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
      </div>
      <div className="message-content">
        {renderContent()}
      </div>
    </div>
  );
};