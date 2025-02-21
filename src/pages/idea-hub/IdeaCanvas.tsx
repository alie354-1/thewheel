import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface CanvasSection {
  title: string;
  content: string;
  placeholder: string;
}

export default function IdeaCanvas() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Untitled Canvas');
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<CanvasSection[]>([
    {
      title: 'Problem',
      content: '',
      placeholder: 'What problem are you solving?'
    },
    {
      title: 'Solution',
      content: '',
      placeholder: 'How does your solution address the problem?'
    },
    {
      title: 'Unique Value Proposition',
      content: '',
      placeholder: 'What makes your solution unique and valuable?'
    },
    {
      title: 'Target Market',
      content: '',
      placeholder: 'Who are your target customers?'
    },
    {
      title: 'Revenue Streams',
      content: '',
      placeholder: 'How will you make money?'
    },
    {
      title: 'Cost Structure',
      content: '',
      placeholder: 'What are the main costs?'
    },
    {
      title: 'Key Metrics',
      content: '',
      placeholder: 'What metrics will you track?'
    },
    {
      title: 'Competitive Advantage',
      content: '',
      placeholder: 'What gives you an edge over competitors?'
    },
    {
      title: 'Channels',
      content: '',
      placeholder: 'How will you reach your customers?'
    }
  ]);

  useEffect(() => {
    const loadCanvas = async () => {
      const { data: canvas } = await supabase
        .from('idea_canvases')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (canvas) {
        setCanvasId(canvas.id);
        setTitle(canvas.title);
        setSections(canvas.sections);
      }
    };

    if (user) {
      loadCanvas();
    }
  }, [user]);

  const handleSectionChange = (index: number, content: string) => {
    const newSections = [...sections];
    newSections[index].content = content;
    setSections(newSections);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (canvasId) {
        await supabase
          .from('idea_canvases')
          .update({
            title,
            sections,
            updated_at: new Date().toISOString()
          })
          .eq('id', canvasId);
      } else {
        const { data } = await supabase
          .from('idea_canvases')
          .insert({
            user_id: user.id,
            title,
            sections
          })
          .select()
          .single();

        if (data) {
          setCanvasId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving canvas:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setCanvasId(null);
    setTitle('Untitled Canvas');
    setSections(sections.map(section => ({ ...section, content: '' })));
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/idea-hub" className="mr-4 text-gray-400 hover:text-gray-500">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center">
                <FileSpreadsheet className="h-6 w-6 mr-2 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Enter canvas title..."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Structure and visualize your business concept
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Canvas
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Canvas'}
            </button>
          </div>
        </div>

        {/* Canvas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {section.title}
              </h3>
              <textarea
                rows={4}
                value={section.content}
                onChange={(e) => handleSectionChange(index, e.target.value)}
                placeholder={section.placeholder}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}