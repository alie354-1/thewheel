import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  ArrowLeft, 
  Save, 
  Plus, 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  Download,
  Copy,
  Check,
  Globe,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { createGoogleSlides } from '../../lib/slides';

interface Slide {
  id: string;
  type: 'cover' | 'problem' | 'solution' | 'market' | 'business' | 'team' | 'custom';
  title: string;
  content: {
    text?: string;
    bullets?: string[];
    image?: string;
  };
}

export default function PitchDeck() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Pitch Deck');
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: '1',
      type: 'cover',
      title: 'Company Name',
      content: {
        text: 'Tagline goes here'
      }
    },
    {
      id: '2',
      type: 'problem',
      title: 'The Problem',
      content: {
        text: 'Describe the problem you\'re solving',
        bullets: [
          'Pain point 1',
          'Pain point 2',
          'Pain point 3'
        ]
      }
    },
    {
      id: '3',
      type: 'solution',
      title: 'Our Solution',
      content: {
        text: 'Describe your solution',
        image: 'https://via.placeholder.com/800x400'
      }
    }
  ]);

  useEffect(() => {
    if (user) {
      loadDeck();
    }
  }, [user]);

  const loadDeck = async () => {
    try {
      const { data: deck, error } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (deck) {
        setDeckId(deck.id);
        setTitle(deck.title);
        setSlides(deck.slides);
        setIsPublic(deck.is_public);
        setShareUrl(`${window.location.origin}/pitch-deck/${deck.id}`);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (deckId) {
        await supabase
          .from('pitch_decks')
          .update({
            title,
            slides,
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('id', deckId);
      } else {
        const { data } = await supabase
          .from('pitch_decks')
          .insert({
            user_id: user.id,
            title,
            slides,
            is_public: isPublic
          })
          .select()
          .single();

        if (data) {
          setDeckId(data.id);
          setShareUrl(`${window.location.origin}/pitch-deck/${data.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving pitch deck:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setDeckId(null);
    setTitle('Pitch Deck');
    setSlides([
      {
        id: '1',
        type: 'cover',
        title: 'Company Name',
        content: {
          text: 'Tagline goes here'
        }
      }
    ]);
    setCurrentSlide(0);
    setIsPublic(false);
    setShareUrl('');
  };

  const addSlide = (type: Slide['type']) => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: {
        text: '',
        bullets: []
      }
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const handleExport = async () => {
    try {
      const presentationId = await createGoogleSlides(title, slides);
      window.open(`https://docs.google.com/presentation/d/${presentationId}/edit`, '_blank');
    } catch (error) {
      console.error('Error exporting to Google Slides:', error);
    }
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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Rocket className="h-6 w-6 mr-2" />
                {title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create compelling investor presentations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowShareDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Google Slides
            </button>
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Deck
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Deck'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Slide List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Slides</h3>
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-full text-left p-3 rounded-lg ${
                    currentSlide === index
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Presentation className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {slide.title}
                    </span>
                  </div>
                </button>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => addSlide('custom')}
                  className="w-full inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slide
                </button>
              </div>
            </div>
          </div>

          {/* Slide Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              {/* Slide Navigation */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-500">
                    Slide {currentSlide + 1} of {slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <select
                  value={slides[currentSlide]?.type}
                  onChange={(e) => updateSlide(currentSlide, { type: e.target.value as Slide['type'] })}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="cover">Cover Slide</option>
                  <option value="problem">Problem</option>
                  <option value="solution">Solution</option>
                  <option value="market">Market</option>
                  <option value="business">Business Model</option>
                  <option value="team">Team</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Slide Content */}
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Slide Title
                  </label>
                  <input
                    type="text"
                    value={slides[currentSlide]?.title}
                    onChange={(e) => updateSlide(currentSlide, { title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <textarea
                    value={slides[currentSlide]?.content.text}
                    onChange={(e) => updateSlide(currentSlide, {
                      content: { ...slides[currentSlide].content, text: e.target.value }
                    })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {slides[currentSlide]?.content.bullets && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Bullet Points
                    </label>
                    {slides[currentSlide].content.bullets.map((bullet, index) => (
                      <div key={index} className="flex items-center mt-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...slides[currentSlide].content.bullets!];
                            newBullets[index] = e.target.value;
                            updateSlide(currentSlide, {
                              content: { ...slides[currentSlide].content, bullets: newBullets }
                            });
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <button
                          onClick={() => {
                            const newBullets = slides[currentSlide].content.bullets!.filter((_, i) => i !== index);
                            updateSlide(currentSlide, {
                              content: { ...slides[currentSlide].content, bullets: newBullets }
                            });
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-500"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newBullets = [...(slides[currentSlide].content.bullets || []), ''];
                        updateSlide(currentSlide, {
                          content: { ...slides[currentSlide].content, bullets: newBullets }
                        });
                      }}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Bullet Point
                    </button>
                  </div>
                )}

                {slides[currentSlide]?.content.image && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={slides[currentSlide].content.image}
                      onChange={(e) => updateSlide(currentSlide, {
                        content: { ...slides[currentSlide].content, image: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {slides[currentSlide].content.image && (
                      <img
                        src={slides[currentSlide].content.image}
                        alt="Slide"
                        className="mt-2 max-h-48 rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowShareDialog(false)} />
              <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Share Pitch Deck</h3>
                
                {/* Visibility Setting */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700">Visibility</label>
                  <div className="mt-2 flex items-center space-x-4">
                    <button
                      onClick={() => setIsPublic(false)}
                      className={`inline-flex items-center px-3 py-2 rounded-md ${
                        !isPublic 
                          ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Private
                    </button>
                    <button
                      onClick={() => setIsPublic(true)}
                      className={`inline-flex items-center px-3 py-2 rounded-md ${
                        isPublic 
                          ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Public
                    </button>
                  </div>
                </div>

                {/* Share Link */}
                {shareUrl && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700">Share Link</label>
                    <div className="mt-2 flex">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          // Show copied feedback
                        }}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowShareDialog(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
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