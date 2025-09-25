import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChatMessage } from './components/ChatMessage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ApiService } from './services/apiService';
import { ChatMessage as ChatMessageType } from './types';
import { Github } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('Uploading...');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'assistant',
      content: `Welcome to the Censys Host Data Summarizer!

I'm here to help you analyze and summarize your Censys host data. Simply upload a JSON file containing Censys host data, and I'll provide you with clear, actionable summaries for each host.

To get started, please upload a JSON file with the structure:
{
  "hosts": [
    {
      "ip": "192.168.1.1",
      // ... other host data
    }
  ]
}

What would you like to analyze today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const addMessage = (message: Omit<ChatMessageType, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessageType = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileSelect = async (file: File) => {
    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing file upload...');

    // Add user message
    addMessage({
      type: 'user',
      content: `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`
    });

    try {
      // Simulate progress stages
      setUploadProgress(10);
      setUploadStatus('Uploading file to server...');

      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(40);
      setUploadStatus('Validating file format...');

      const response = await ApiService.uploadFile(file);

      setUploadProgress(80);
      setUploadStatus('Processing host data...');
      await new Promise(resolve => setTimeout(resolve, 200));

      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
      if (response.success && response.data) {
        setCurrentSessionId(response.data.sessionId);
        addMessage({
          type: 'assistant',
          content: response.message || `Successfully validated ${response.data.hostCount} host(s).`
        });

        // Auto-summarize if backend determined data is suitable
        if (response.data.shouldSummarize) {
          handleSummarization(response.data.sessionId);
        }

      } else {
        setUploadError(response.error || 'Failed to upload file');
        addMessage({
          type: 'error',
          content: response.error || 'Failed to upload and validate your file. Please try again.'
        });
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during upload';
      setUploadError(errorMessage);
      setUploadStatus('Upload failed');
      addMessage({
        type: 'error',
        content: errorMessage
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('Uploading...');
    }
  };

  const handleSummarization = async (sessionId: string) => {
    setIsSummarizing(true);

    // No need to update messages - no button to hide

    addMessage({
      type: 'system',
      content: 'Generating AI-powered summaries for your hosts... This may take a moment.'
    });

    try {
      const response = await ApiService.summarizeData(sessionId);

      if (response.success && response.data) {
        addMessage({
          type: 'assistant',
          content: response.message || `Successfully analyzed ${response.data.processedCount} out of ${response.data.totalCount} hosts. Here are the summaries:`,
          summaries: response.data.summaries
        });

        // Keep session ID for continued conversations about this data
      } else {
        addMessage({
          type: 'error',
          content: response.error || 'Failed to generate summaries'
        });
      }
    } catch (error) {
      addMessage({
        type: 'error',
        content: 'An unexpected error occurred during summarization'
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleNewAnalysis = () => {
    // Keep welcome message and add prompt for new file
    const welcomeMessage = messages.find(m => m.id === 'welcome');
    if (welcomeMessage) {
      setMessages([
        welcomeMessage,
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Ready for a new analysis! Please upload another Censys host data file.',
          timestamp: new Date()
        }
      ]);
    }
    setCurrentSessionId('');
    setUploadError('');
  };

  const handleUserMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    addMessage({
      type: 'user',
      content: message
    });

    setIsChatting(true);
    setUserInput('');

    try {
      // Call the backend chat API with session context
      const response = await ApiService.sendChatMessage(message, currentSessionId || undefined);

      if (response.success && response.data) {
        addMessage({
          type: 'assistant',
          content: response.data.response
        });
      } else {
        addMessage({
          type: 'error',
          content: response.error || 'Failed to get response from AI assistant'
        });
      }
    } catch (error) {
      addMessage({
        type: 'error',
        content: 'An error occurred while processing your message. Please try again.'
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      handleUserMessage(userInput.trim());
    }
  };

  const showUpload = !currentSessionId && !isUploading && !isSummarizing;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>Censys Host Data Analyzer</h1>
          </div>
          <div className="header-info">
            <div className="brand-info">
              <p className="ai-credit">Powered by Google Gemini</p>
              <p className="developer-credit">Developed by Christopher C. Parker</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="chat-container">
          <div className="messages-container">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {isUploading && (
              <div className="loading-message">
                <LoadingSpinner message={uploadStatus} />
              </div>
            )}

            {isSummarizing && (
              <div className="loading-message">
                <LoadingSpinner message="Generating AI summaries for your hosts..." />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            {/* Combined input row with chat and upload */}
            {messages.length > 0 && (
              <div className="combined-input-container">
                <form onSubmit={handleInputSubmit} className="chat-input-form">
                  <div className="chat-input-container">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Chat with the assistant..."
                      className="chat-input"
                      disabled={isChatting}
                    />
                    <button
                      type="submit"
                      className="chat-submit-button"
                      disabled={!userInput.trim() || isChatting}
                    >
                      {isChatting ? '...' : 'Send'}
                    </button>
                  </div>
                </form>

                {/* Compact file upload button */}
                {showUpload && (
                  <div className="compact-upload-container">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                      uploadStatus={uploadStatus}
                      error=""
                      compact={true}
                    />
                  </div>
                )}

                {/* New analysis button */}
                {!showUpload && !isSummarizing && (
                  <button
                    className="compact-new-analysis-button"
                    onClick={handleNewAnalysis}
                  >
                    New File
                  </button>
                )}
              </div>
            )}

            {/* Show error message if any */}
            {uploadError && showUpload && (
              <div className="upload-error-message">
                {uploadError}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>Built with React, TypeScript & Gemini AI</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/chrispark2003" target="_blank" rel="noopener noreferrer">
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
