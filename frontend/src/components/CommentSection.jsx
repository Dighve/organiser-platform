import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, Edit2, Trash2, CornerDownRight, X, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { commentsAPI, membersAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ProfileAvatar from './ProfileAvatar'

export default function CommentSection({ eventId }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editingReply, setEditingReply] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState({})
  const [showAllReplies, setShowAllReplies] = useState({})

  // Fetch current member data for avatar
  const { data: currentMemberData } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
    enabled: isAuthenticated,
  })

  // Fetch comments
  const { data: commentsData, isLoading, error: commentsError } = useQuery({
    queryKey: ['eventComments', eventId],
    queryFn: () => commentsAPI.getEventComments(eventId),
    retry: (failureCount, error) => {
      // Don't retry on 403 errors (access denied)
      if (error?.response?.status === 403) {
        return false
      }
      return failureCount < 2
    },
  })

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content) => commentsAPI.createComment(eventId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      setNewComment('')
      toast.success('Comment posted!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to post comment')
    },
  })

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => 
      commentsAPI.updateComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      setEditingComment(null)
      setEditContent('')
      toast.success('Comment updated!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update comment')
    },
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentsAPI.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      toast.success('Comment deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    },
  })

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: ({ commentId, content }) => 
      commentsAPI.createReply(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      setReplyingTo(null)
      setReplyContent('')
      toast.success('Reply posted!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to post reply')
    },
  })

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, content }) => 
      commentsAPI.updateReply(replyId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      setEditingReply(null)
      setEditContent('')
      toast.success('Reply updated!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update reply')
    },
  })

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => commentsAPI.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventComments', eventId])
      toast.success('Reply deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete reply')
    },
  })

  const handleCreateComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    createCommentMutation.mutate(newComment)
  }

  const handleCreateReply = (e, commentId) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    createReplyMutation.mutate({ commentId, content: replyContent })
  }

  const handleUpdateComment = (e, commentId) => {
    e.preventDefault()
    if (!editContent.trim()) return
    updateCommentMutation.mutate({ commentId, content: editContent })
  }

  const handleUpdateReply = (e, replyId) => {
    e.preventDefault()
    if (!editContent.trim()) return
    updateReplyMutation.mutate({ replyId, content: editContent })
  }

  const startEditingComment = (comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const startEditingReply = (reply) => {
    setEditingReply(reply.id)
    setEditContent(reply.content)
  }

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

  const handleDeleteReply = (replyId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      deleteReplyMutation.mutate(replyId)
    }
  }

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
    setShowAllReplies((prev) => ({
      ...prev,
      [commentId]: false,
    }))
  }

  const getUserInitial = (memberName) => {
    return memberName ? memberName.charAt(0).toUpperCase() : '?'
  }

  const comments = commentsData?.data || []
  const visibleCount = 3

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }
    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
      <h2 className="flex items-center gap-2 text-base lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 lg:mb-6">
        <span className="text-lg lg:text-xl">💬</span>
        <span>Comments ({comments.length})</span>
      </h2>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleCreateComment} className="mb-6">
          <div className="flex items-center gap-3">
            <ProfileAvatar member={currentMemberData} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-full px-4 py-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                />
                {newComment.trim().length > 0 && (
                  <button
                    type="submit"
                    disabled={createCommentMutation.isLoading}
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                    aria-label="Send comment"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <p className="text-gray-600 text-center">
            <span className="font-semibold">Login</span> to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {commentsError?.response?.status === 403 ? (
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Members Only</h3>
          <p className="text-gray-600 mb-1">
            Join the group to view and post comments.
          </p>
          <p className="text-gray-500 text-sm">
            Only group members can participate in event discussions.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 md:py-12">
          <MessageCircle className="hidden md:block h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="hidden md:block text-gray-500 text-lg">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(showAllComments ? comments : comments.slice(0, visibleCount)).map((comment) => (
            <div key={comment.id} className="group">
              {/* Comment */}
              <div className="flex gap-3">
                <ProfileAvatar member={{ email: comment.memberEmail, displayName: comment.memberName, profilePhotoUrl: comment.memberProfilePhotoUrl }} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/50 relative">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{comment.memberName}</h4>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          {comment.edited && <span className="ml-1">(edited)</span>}
                        </p>
                      </div>
                      {isAuthenticated && user?.id === comment.memberId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditingComment(comment)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-colors"
                            title="Edit comment"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingComment === comment.id ? (
                      <form onSubmit={(e) => handleUpdateComment(e, comment.id)} className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 bg-white border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComment(null)
                              setEditContent('')
                            }}
                            className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!editContent.trim() || updateCommentMutation.isLoading}
                            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {updateCommentMutation.isLoading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {isAuthenticated && editingComment !== comment.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (replyingTo === comment.id) {
                            setReplyingTo(null)
                            setReplyContent('')
                          } else {
                            setReplyingTo(comment.id)
                            setReplyContent('')
                          }
                        }}
                        className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center justify-center"
                        aria-label="Reply"
                      >
                        <CornerDownRight className="h-4 w-4 transform -rotate-180" />
                      </button>
                    )}
                  </div>

                  {/* Replies (collapsed by default) */}
                  {comment.replies && comment.replies.length > 0 && (
                    <>
                      <div className="mt-3 ml-4">
                        <button
                          type="button"
                          onClick={() => toggleReplies(comment.id)}
                          className="text-sm font-semibold text-purple-600 hover:text-pink-600 transition-colors"
                        >
                          {expandedReplies[comment.id] ? 'Hide replies' : `View replies (${comment.replies.length})`}
                        </button>
                      </div>
                      {expandedReplies[comment.id] && (
                        <div className="mt-3 space-y-3 ml-4 border-l-2 border-purple-200 pl-4">
                          {(showAllReplies[comment.id] ? comment.replies : comment.replies.slice(0, 3)).map((reply) => (
                            <div key={reply.id} className="group/reply flex gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {getUserInitial(reply.memberName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div>
                                      <h5 className="font-semibold text-gray-900 text-sm">{reply.memberName}</h5>
                                      <p className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                        {reply.edited && <span className="ml-1">(edited)</span>}
                                      </p>
                                    </div>
                                    {isAuthenticated && user?.id === reply.memberId && (
                                      <div className="flex gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => startEditingReply(reply)}
                                          className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                          title="Edit reply"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteReply(reply.id)}
                                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Delete reply"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {editingReply === reply.id ? (
                                    <form onSubmit={(e) => handleUpdateReply(e, reply.id)} className="space-y-2">
                                      <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows="2"
                                        className="w-full px-3 py-2 bg-white border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-sm"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingReply(null)
                                            setEditContent('')
                                          }}
                                          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={!editContent.trim() || updateReplyMutation.isLoading}
                                          className="px-3 py-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                          {updateReplyMutation.isLoading ? 'Saving...' : 'Save'}
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {comment.replies.length > 3 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllReplies((prev) => ({
                                    ...prev,
                                    [comment.id]: !prev[comment.id],
                                  }))
                                }
                                className="text-xs font-semibold text-purple-600 hover:text-pink-600 transition-colors"
                              >
                                {showAllReplies[comment.id] ? 'Collapse replies' : 'See more replies'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Reply Input */}
                  {isAuthenticated && editingComment !== comment.id && replyingTo === comment.id && (
                    <form onSubmit={(e) => handleCreateReply(e, comment.id)} className="mt-2 ml-4">
                      <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-full px-3 py-1.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                        <input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-transparent outline-none text-sm"
                          autoFocus
                        />
                        {replyContent.trim().length > 0 && (
                          <button
                            type="submit"
                            disabled={createReplyMutation.isLoading}
                            className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50"
                            aria-label="Send reply"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}

          {comments.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowAllComments((prev) => !prev)}
                className="px-4 py-2 text-sm font-semibold text-purple-600 hover:text-pink-600 bg-white/70 rounded-full border border-purple-100 hover:border-purple-200 transition-all"
              >
                {showAllComments ? 'Collapse comments' : 'See more comments'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
