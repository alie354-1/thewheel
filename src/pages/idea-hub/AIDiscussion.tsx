import React, { useState, useEffect } from 'react';
import { Bot, Send, ArrowLeft, Save, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIDiscussion() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('New Discussion');
  const [discussionId, setDiscussionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI co-founder. I can help you validate your ideas and provide feedback. What would you like to discuss?'
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const loadDiscussion = async () => {
      const { data: discussion } = await supabase
        .from('ai_discussions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (discussion) {
        setDiscussionId(discussion.id);
        setTitle(discussion.title);
        setMessages(discussion.messages);
      }
    };

    if (user) {
      loadDiscussion();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input },
      { 
        role: 'assistant' as const, 
        content: 'This is a demo response. In a real implementation, this would be connected to an AI service.'
      }
    ];

    setMessages(newMessages);
    setInput('');

    // Auto-save after each message
    if (user) {
      await handleSave(newMessages);
    }
  };

  const handleSave = async (messagesToSave = messages) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (discussionId) {
        await supabase
          .from('ai_discussions')
          .update({
            title,
            messages: messagesToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', discussionId);
      } else {
        const { data } = await supabase
          .from('ai_discussions')
          .insert({
            user_id: user.id,
            title,
            messages: messagesToSave
          })
          .select()
          .single();

        if (data) {
          setDiscussionId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving discussion:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setDiscussionId(null);
    setTitle('New Discussion');
    setMessages([{
      role: 'assistant',
      content: 'Hi! I\'m your AI co-founder. I can help you validate your ideas and provide feedback. What would you like to discuss?'
    }]);
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/idea-hub" className="mr-4 text-gray-400 hover:text-gray-500">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center">
                <Bot className="h-6 w-6 mr-2 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Enter discussion title..."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Get instant feedback and validation for your startup ideas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Discussion'}
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white shadow rounded-lg">
          {/* Messages */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}