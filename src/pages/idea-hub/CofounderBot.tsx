// Update the CofounderBot component to properly display feedback
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Brain, 
  MessageSquare,
  Clock,
  CheckSquare,
  Target,
  AlertCircle,
  ArrowRight,
  ListChecks,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import TaskPromptDialog from '../../components/TaskPromptDialog';
import { generateTasks } from '../../lib/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type: 'question' | 'answer' | 'feedback' | 'summary';
  section?: string;
}

interface StandupEntry {
  accomplished: string;
  working_on: string;
  blockers: string;
  goals: string;
  answers: Record<string, string>;
}

const SECTION_TRANSITIONS = {
  accomplished: {
    title: "Accomplishments",
    initial: "What have you achieved since our last discussion? I'm particularly interested in concrete outcomes and their impact."
  },
  working_on: {
    title: "Current Work",
    initial: "What are you actively working on right now? What's your main focus?"
  },
  blockers: {
    title: "Challenges",
    initial: "Are you facing any challenges or blockers in your work?"
  },
  goals: {
    title: "Goals",
    initial: "What are your key goals for the near term?"
  }
};

export default function CofounderBot() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentSection, setCurrentSection] = useState<keyof typeof SECTION_TRANSITIONS>('accomplished');
  const [currentEntry, setCurrentEntry] = useState<StandupEntry>({
    accomplished: '',
    working_on: '',
    blockers: '',
    goals: '',
    answers: {}
  });
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: SECTION_TRANSITIONS.accomplished.initial,
    type: 'question'
  }]);
  const [currentInput, setCurrentInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showTaskPrompt, setShowTaskPrompt] = useState(false);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleNextSection = async () => {
    const sections = Object.keys(SECTION_TRANSITIONS) as Array<keyof typeof SECTION_TRANSITIONS>;
    const currentIndex = sections.indexOf(currentSection);
    
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      setCurrentSection(nextSection);
      
      // Add transition message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: SECTION_TRANSITIONS[nextSection].initial,
        type: 'question',
        section: nextSection
      }]);
    } else {
      // Generate summary before showing task options
      await generateSummary();
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      const { feedback, follow_up_questions } = await generateTasks(currentEntry, user?.id || '');
      
      // Format feedback into a readable string
      const formattedFeedback = `🎯 Key Insights

${feedback.strengths.length > 0 ? `Strengths:
${feedback.strengths.map(s => `• ${s}`).join('\n')}

` : ''}${feedback.areas_for_improvement.length > 0 ? `Areas for Improvement:
${feedback.areas_for_improvement.map(a => `• ${a}`).join('\n')}

` : ''}${feedback.opportunities.length > 0 ? `Opportunities:
${feedback.opportunities.map(o => `• ${o}`).join('\n')}

` : ''}${feedback.risks.length > 0 ? `Risks:
${feedback.risks.map(r => `• ${r}`).join('\n')}

` : ''}${feedback.strategic_recommendations.length > 0 ? `Strategic Recommendations:
${feedback.strategic_recommendations.map(r => `• ${r}`).join('\n')}` : ''}`;

      // Add summary message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: formattedFeedback,
        type: 'summary'
      }]);

      // Add follow-up questions if available
      if (follow_up_questions && follow_up_questions.length > 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I have a few follow-up questions:\n\n${follow_up_questions.map(q => `• ${q}`).join('\n')}`,
          type: 'question'
        }]);
      }

      setIsComplete(true);
    } catch (error: any) {
      console.error('Error generating summary:', error);
      setError('Failed to generate summary. Would you like to try again?');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveStandup = async () => {
    if (!user) return;

    try {
      const { data: entry, error: saveError } = await supabase
        .from('standup_entries')
        .insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          ...currentEntry,
          answers: currentEntry.answers
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Show task generation prompt
      setShowTaskPrompt(true);
    } catch (error: any) {
      console.error('Error saving standup:', error);
      setError(error.message);
    }
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isThinking) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: currentInput,
      type: 'answer',
      section: currentSection
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Update current entry
    setCurrentEntry(prev => ({
      ...prev,
      [currentSection]: currentInput
    }));

    setCurrentInput('');
    setIsThinking(true);

    try {
      // Generate AI feedback focused on current section
      const { feedback, follow_up_questions } = await generateTasks({
        accomplished: currentSection === 'accomplished' ? currentInput : currentEntry.accomplished,
        working_on: currentSection === 'working_on' ? currentInput : currentEntry.working_on,
        blockers: currentSection === 'blockers' ? currentInput : currentEntry.blockers,
        goals: currentSection === 'goals' ? currentInput : currentEntry.goals
      }, user?.id || '');

      // Format feedback into a conversational response
      const formattedFeedback = `Here's my analysis:

${feedback.strengths.length > 0 ? `Strengths:
${feedback.strengths.map(s => `• ${s}`).join('\n')}

` : ''}${feedback.areas_for_improvement.length > 0 ? `Areas to Consider:
${feedback.areas_for_improvement.map(a => `• ${a}`).join('\n')}

` : ''}${feedback.opportunities.length > 0 ? `Opportunities:
${feedback.opportunities.map(o => `• ${o}`).join('\n')}

` : ''}${feedback.strategic_recommendations.length > 0 ? `Recommendations:
${feedback.strategic_recommendations.map(r => `• ${r}`).join('\n')}` : ''}`;

      // Add AI feedback message
      const feedbackMessage: Message = {
        role: 'assistant',
        content: formattedFeedback,
        type: 'feedback',
        section: currentSection
      };
      setMessages(prev => [...prev, feedbackMessage]);

      // Add follow-up questions if available
      if (follow_up_questions && follow_up_questions.length > 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I have a few follow-up questions:\n\n${follow_up_questions.map(q => `• ${q}`).join('\n')}`,
          type: 'question',
          section: currentSection
        }]);
      }

    } catch (error: any) {
      console.error('Error generating feedback:', error);
      setError(error.message);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateTasks = () => {
    handleSaveStandup();
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Bot className="h-8 w-8 text-indigo-600" />
            <div className="ml-3">
              <h1 className="text-2xl font-semibold text-gray-900">Daily Standup</h1>
              <p className="mt-1 text-sm text-gray-500">
                Let's review your progress and plan next steps
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Object.entries(SECTION_TRANSITIONS).map(([key, section], index) => (
              <div
                key={key}
                className={`flex-1 ${index !== 0 ? 'ml-4' : ''}`}
              >
                <div className="relative">
                  <div
                    className={`h-2 rounded-full ${
                      Object.keys(SECTION_TRANSITIONS).indexOf(currentSection) >= index
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`}
                  />
                  <div className="mt-2 flex items-center justify-center">
                    {currentEntry[key as keyof StandupEntry] ? (
                      <CheckSquare className="h-4 w-4 text-green-500 mr-1" />
                    ) : key === currentSection ? (
                      <Clock className="h-4 w-4 text-indigo-500 mr-1" />
                    ) : (
                      <Target className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      key === currentSection 
                        ? 'text-indigo-600'
                        : currentEntry[key as keyof StandupEntry]
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {section.title}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

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
                      ? 'bg-indigo-600 text-white'
                      : message.type === 'summary'
                      ? 'bg-green-50 text-gray-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type === 'summary' && (
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="font-medium">Summary</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {(isThinking || isSummarizing) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            {isComplete ? (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleExit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Exit
                </button>
                <button
                  onClick={handleGenerateTasks}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Generate Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleInputSubmit} className="flex space-x-4">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!currentInput.trim() || isThinking}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </button>
                </form>

                {currentEntry[currentSection] && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextSection}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Generation Dialog */}
        <TaskPromptDialog
          isOpen={showTaskPrompt}
          onClose={() => setShowTaskPrompt(false)}
          standupEntry={currentEntry}
        />
      </div>
    </div>
  );
}