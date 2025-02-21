import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Clock,
  Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  post_type: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function Post() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return; // Ensure we have a valid UUID
    loadPost();
    loadComments();
    if (user) {
      loadUserVote();
    }
  }, [id, user]);

  const loadPost = async () => {
    if (!id) return;

    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading post:', error);
      return;
    }

    setPost(post);
  };

  const loadComments = async () => {
    if (!id) return;

    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        author:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    setComments(comments || []);
  };

  const loadUserVote = async () => {
    if (!id || !user) return;

    const { data: vote } = await supabase
      .from('community_post_votes')
      .select('vote_type')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();

    if (vote) {
      setUserVote(vote.vote_type);
    }
  };

  const handleVote = async (voteType: boolean) => {
    if (!user || !id) return;

    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from('community_post_votes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        setUserVote(null);
      } else {
        // Upsert vote
        await supabase
          .from('community_post_votes')
          .upsert({
            post_id: id,
            user_id: user.id,
            vote_type: voteType
          });
        setUserVote(voteType);
      }

      loadPost();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: id,
          author_id: user.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/community"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Discussions
        </Link>

        {/* Post */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img
                  className="h-10 w-10 rounded-full"
                  src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'User')}`}
                  alt=""
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {post.author?.full_name}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded-full hover:bg-gray-100">
                  <Share2 className="h-5 w-5 text-gray-400" />
                </button>
                <button className="p-1 rounded-full hover:bg-gray-100">
                  <Bookmark className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="prose max-w-none mb-6">
              {post.content}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleVote(true)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    userVote === true
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {post.upvotes}
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    userVote === false
                      ? 'bg-red-100 text-red-800'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {post.downvotes}
                </button>
                <div className="inline-flex items-center text-sm text-gray-500">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {comments.length} comments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>

          {/* New Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div>
                <label htmlFor="comment" className="sr-only">
                  Add your comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Add your comment..."
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center mb-8">
              <p className="text-sm text-gray-700">
                Please{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-900">
                  sign in
                </Link>{' '}
                to join the discussion.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={comment.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.full_name || 'User')}`}
                      alt=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {comment.author?.full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2 text-sm text-gray-700">
                      {comment.content}
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <button className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {comment.upvotes}
                      </button>
                      <button className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {comment.downvotes}
                      </button>
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}