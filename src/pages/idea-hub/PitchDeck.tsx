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
  MinusCircle,
  Share2,
  MessageSquare,
  Download,
  Copy,
  Check,
  Users,
  Lock,
  Globe,
  ExternalLink
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

interface Comment {
  id: string;
  user_id: string;
  slide_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Collaborator {
  id: string;
  user_id: string;
  role: 'viewer' | 'editor';
  user: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export default function PitchDeck() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Pitch Deck');
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
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
        .select(`
          *,
          collaborators:pitch_deck_collaborators(
            id,
            user_id,
            role,
            user:user_id(
              full_name,
              email,
              avatar_url
            )
          )
        `)
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
        setCollaborators(deck.collaborators || []);
        setShareUrl(`${window.location.origin}/pitch-deck/${deck.id}`);
        await loadComments(deck.id);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  const loadComments = async (deckId: string) => {
    try {
      const { data: comments, error } = await supabase
        .from('pitch_deck_comments')
        .select(`
          *,
          user:user_id(
            full_name,
            avatar_url
          )
        `)
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (comments) {
        setComments(comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
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
    setCollaborators([]);
    setComments([]);
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

  const handleAddCollaborator = async () => {
    if (!deckId || !newCollaboratorEmail) return;

    try {
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', {
          email: newCollaboratorEmail
        });

      if (userError || !userData) {
        console.error('User not found');
        return;
      }

      const { error: collabError } = await supabase
        .from('pitch_deck_collaborators')
        .insert({
          deck_id: deckId,
          user_id: userData.id,
          role: 'viewer'
        });

      if (collabError) throw collabError;

      // Reload collaborators
      const { data: updatedCollaborators } = await supabase
        .from('pitch_deck_collaborators')
        .select(`
          id,
          user_id,
          role,
          user:profiles(full_name, email, avatar_url)
        `)
        .eq('deck_id', deckId);

      if (updatedCollaborators) {
        setCollaborators(updatedCollaborators);
      }

      setNewCollaboratorEmail('');
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };

  const handleUpdateCollaborator = async (collaboratorId: string, role: 'viewer' | 'editor') => {
    if (!deckId) return;

    try {
      await supabase
        .from('pitch_deck_collaborators')
        .update({ role })
        .eq('id', collaboratorId);

      setCollaborators(prev =>
        prev.map(c =>
          c.id === collaboratorId ? { ...c, role } : c
        )
      );
    } catch (error) {
      console.error('Error updating collaborator:', error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!deckId) return;

    try {
      await supabase
        .from('pitch_deck_collaborators')
        .delete()
        .eq('id', collaboratorId);

      setCollaborators(prev =>
        prev.filter(c => c.id !== collaboratorId)
      );
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  const handleAddComment = async () => {
    if (!deckId || !newComment.trim()) return;

    try {
      const { data: comment, error } = await supabase
        .from('pitch_deck_comments')
        .insert({
          deck_id: deckId,
          slide_id: slides[currentSlide].id,
          content: newComment,
          user_id: user?.id
        })
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      if (comment) {
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
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
            <div className="flex-1">
              <div className="flex items-center">
                <Rocket className="h-6 w-6 mr-2 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Enter deck title..."
                />
              </div>
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
                    <Presentation className="h-4 w-4 mr-2 text-gray-400" />
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
          <div className="lg:col-span-2">
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
                          className="ml-2 p-2 text-gray-400 hover:text-gray-500"
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

          {/* Comments Panel */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Comments</h3>
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showComments ? 'Hide' : 'Show'} Comments
              </button>
            </div>

            {showComments && (
              <div className="space-y-4">
                {comments.filter(c => c.slide_id === slides[currentSlide]?.id).map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={
                        comment.user?.avatar_url || 
                        "https://ui-avatars.com/api/?name=" + encodeURIComponent(comment.user?.full_name || 'User')
                      }
                      alt=""
                    />
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{comment.user?.full_name}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        {comment.content}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <label htmlFor="comment" className="sr-only">Add comment</label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <textarea
                        id="comment"
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Add a comment..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            )}
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

                {/* Collaborators */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700">Collaborators</label>
                  <div className="mt-2 space-y-4">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={collaborator.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(collaborator.user?.full_name || 'User')}`}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{collaborator.user?.full_name}</p>
                            <p className="text-sm text-gray-500">{collaborator.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={collaborator.role}
                            onChange={(e) => handleUpdateCollaborator(collaborator.id, e.target.value as 'viewer' | 'editor')}
                            className="rounded-md border-gray-300 text-sm"
                          >
                            <option value="viewer">Can View</option>
                            <option value="editor">Can Edit</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="p-1 text-gray-400 hover:text-gray-500"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Collaborator */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={newCollaboratorEmail}
                        onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={handleAddCollaborator}
                        disabled={!newCollaboratorEmail}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

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