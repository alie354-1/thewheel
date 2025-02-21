import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, User, Clock, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  participant?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
  last_message?: Message;
}

export default function Messages() {
  const { user, profile } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:participant1_id(full_name, avatar_url, email),
          participant2:participant2_id(full_name, avatar_url, email)
        `)
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (conversations) {
        const formattedConversations = conversations.map(conv => ({
          ...conv,
          participant: conv.participant1_id === user?.id ? conv.participant2 : conv.participant1
        }));
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messages || []);

      // Mark messages as read
      if (messages) {
        const unreadMessages = messages.filter(
          m => !m.is_read && m.recipient_id === user?.id
        );
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startNewConversation = async () => {
    if (!user || !newRecipientEmail.trim()) {
      setError('Please enter a recipient email');
      return;
    }

    try {
      // Get recipient user by email
      const { data: recipientData, error: userError } = await supabase
        .rpc('get_user_by_email', {
          email: newRecipientEmail
        });

      if (userError || !recipientData) {
        setError('User not found. Please check the email address.');
        return;
      }

      // Create or get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: recipientData.id
        })
        .select()
        .single();

      if (convError) {
        if (convError.code === '23505') { // Unique violation
          setError('A conversation with this user already exists.');
        } else {
          setError('Failed to start conversation. Please try again.');
        }
        return;
      }

      setNewRecipientEmail('');
      setShowNewMessage(false);
      loadConversations();
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const recipientId = selectedConversation.participant1_id === user.id
        ? selectedConversation.participant2_id
        : selectedConversation.participant1_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations(); // Refresh conversation list to update last_message_at
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.participant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Search and New Message */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Messages</h2>
                <button
                  onClick={() => setShowNewMessage(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Message
                </button>
              </div>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {conversation.participant?.avatar_url ? (
                    <img
                      src={conversation.participant.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.participant?.full_name || conversation.participant?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message?.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    {selectedConversation.participant?.avatar_url ? (
                      <img
                        src={selectedConversation.participant.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {selectedConversation.participant?.full_name || selectedConversation.participant?.email}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 flex items-center ${
                          message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={sendMessage} className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a conversation or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Message Dialog */}
        {showNewMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewMessage(false);
                    setNewRecipientEmail('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    id="recipient"
                    value={newRecipientEmail}
                    onChange={(e) => setNewRecipientEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter recipient's email"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMessage(false);
                      setNewRecipientEmail('');
                      setError('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Start Conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}