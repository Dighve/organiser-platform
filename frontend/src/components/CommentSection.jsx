import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, Edit2, Trash2, CornerDownRight, Lock, Loader, X, Pin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { commentsAPI, membersAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ProfileAvatar from './ProfileAvatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function CommentSection({ eventId, isHost }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [replyModalComment, setReplyModalComment] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editingReply, setEditingReply] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
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

  // Pin comment mutation
  const pinCommentMutation = useMutation({
    mutationFn: (commentId) => commentsAPI.pinComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries(['eventComments', eventId])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to pin comment')
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

  const comments = commentsData?.data || []
  const visibleCount = 3


  const renderMarkdown = (text) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({_node, ...props}) => (
          <a
            className="text-purple-600 underline decoration-2 hover:text-pink-600"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        p: ({_node, ...props}) => <p className="mb-1 text-sm sm:text-base leading-relaxed" {...props} />,
        ul: ({_node, ...props}) => <ul className="list-disc ml-5 mb-1 text-sm sm:text-base" {...props} />,
        ol: ({_node, ...props}) => <ol className="list-decimal ml-5 mb-1 text-sm sm:text-base" {...props} />,
        li: ({_node, ...props}) => <li className="mb-0.5" {...props} />,
      }}
    >
      {text}
    </ReactMarkdown>
  )

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
      <h2 className="flex items-center gap-2 text-base lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 lg:mb-6">
        <span className="text-lg lg:text-xl">💬</span>
        <span>Comments ({comments.length})</span>
      </h2>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <>
          {/* Mobile: tappable pill → fixed bottom bar (hidden while bar is open) */}
          {!commentModalOpen && <div
            onClick={() => setCommentModalOpen(true)}
            className="lg:hidden mb-6 flex items-center gap-3 cursor-text"
          >
            <ProfileAvatar member={currentMemberData} size="md" />
            <div className="flex-1 flex items-center bg-white border-2 border-gray-200 rounded-full px-4 py-2">
              <span className="text-sm text-gray-400">Add a comment</span>
            </div>
          </div>}
          {/* Desktop: inline form */}
          <form onSubmit={handleCreateComment} className="hidden lg:block mb-6">
            <div className="flex items-end gap-3">
              <ProfileAvatar member={currentMemberData} size="md" />
              <div className="flex-1">
                <div className={`flex items-end gap-2 bg-white border-2 border-gray-200 px-4 py-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all ${newComment.trim().length > 0 ? 'rounded-2xl' : 'rounded-full'}`}>
                  <textarea
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = `${e.target.scrollHeight}px`
                    }}
                    placeholder="Add a comment"
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-sm sm:text-base resize-none overflow-hidden"
                    style={{ minHeight: '1.5rem' }}
                  />
                  {newComment.trim().length > 0 && (
                    <button
                      type="submit"
                      disabled={createCommentMutation.isLoading}
                      className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                      aria-label="Send comment"
                    >
                      {createCommentMutation.isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </>
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
          {(showAllComments ? comments : comments.slice(0, visibleCount)).map((comment) => {
            const isDeleted = comment.deleted
            const commentMember = {
              email: comment.memberEmail,
              displayName: comment.memberName,
              profilePhotoUrl: comment.memberPhotoUrl || comment.memberProfilePhotoUrl,
            }
            const commentLink = !isDeleted && comment.memberId ? `/members/${comment.memberId}` : null

            return (
              <div key={comment.id} className={`group ${comment.pinned ? 'bg-orange-50/60 rounded-xl p-3 -mx-1 border border-orange-100' : ''}`}>
                {comment.pinned && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold mb-2 ml-1">
                    <Pin className="h-3 w-3" />
                    <span>Pinned</span>
                  </div>
                )}
                {/* Comment */}
                <div className="flex gap-3">
                  {commentLink ? (
                    <Link to={commentLink} className="shrink-0" aria-label={`${comment.memberName}'s profile`}>
                      <ProfileAvatar member={commentMember} size="md" />
                    </Link>
                  ) : (
                    <ProfileAvatar member={commentMember} size="md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="relative py-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          {commentLink ? (
                            <Link to={commentLink} className="font-semibold text-purple-700 hover:text-pink-700">
                              {comment.memberName}
                            </Link>
                          ) : (
                            <h4 className="font-semibold text-gray-900">{comment.memberName}</h4>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            {comment.edited && <span className="ml-1">(edited)</span>}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isHost && (
                            <button
                              onClick={() => pinCommentMutation.mutate(comment.id)}
                              disabled={pinCommentMutation.isLoading}
                              className={`p-1.5 rounded-lg transition-colors hover:bg-white ${comment.pinned ? 'text-orange-500 hover:text-orange-600' : 'text-gray-400 hover:text-orange-500'}`}
                              title={comment.pinned ? 'Unpin comment' : 'Pin comment'}
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isAuthenticated && user?.id === comment.memberId && (
                            <>
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
                            </>
                          )}
                        </div>
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
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {renderMarkdown(comment.content)}
                        </div>
                      )}

                      {isAuthenticated && editingComment !== comment.id && (
                        <>
                          {/* Mobile: fixed bottom bar */}
                          <button
                            type="button"
                            onClick={() => { setReplyModalComment(comment.id); setReplyContent('') }}
                            className="lg:hidden absolute right-2 bottom-2 h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center justify-center"
                            aria-label="Reply"
                          >
                            <CornerDownRight className="h-4 w-4 transform -rotate-180" />
                          </button>
                          {/* Desktop: inline */}
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
                            className="hidden lg:flex absolute right-2 bottom-2 h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-colors items-center justify-center"
                            aria-label="Reply"
                          >
                            <CornerDownRight className="h-4 w-4 transform -rotate-180" />
                          </button>
                        </>
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
                                {!reply.deleted && reply.memberId ? (
                                  <Link
                                    to={`/members/${reply.memberId}`}
                                    className="shrink-0"
                                    aria-label={`${reply.memberName}'s profile`}
                                  >
                                    <ProfileAvatar
                                      member={{
                                        displayName: reply.memberName,
                                        email: reply.memberEmail,
                                        profilePhotoUrl: reply.memberPhotoUrl,
                                      }}
                                      size="xs"
                                    />
                                  </Link>
                                ) : (
                                  <ProfileAvatar
                                    member={{
                                      displayName: reply.memberName,
                                      email: reply.memberEmail,
                                      profilePhotoUrl: reply.memberPhotoUrl,
                                    }}
                                    size="sm"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="py-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div>
                                        {!reply.deleted && reply.memberId ? (
                                          <Link
                                            to={`/members/${reply.memberId}`}
                                            className="font-semibold text-purple-700 hover:text-pink-700 text-sm"
                                          >
                                            {reply.memberName}
                                          </Link>
                                        ) : (
                                          <h5 className="font-semibold text-gray-900 text-sm">{reply.memberName}</h5>
                                        )}
                                        <p className="text-xs text-gray-500 whitespace-nowrap">
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
                                      <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {renderMarkdown(reply.content)}
                                      </div>
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
                      <form onSubmit={(e) => handleCreateReply(e, comment.id)} className="hidden lg:block mt-2 ml-4">
                        <div className="flex items-center gap-2 bg-white border-2 border-purple-400 ring-2 ring-purple-200 rounded-2xl px-3 py-1.5 transition-all">
                          <input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-transparent outline-none text-base"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => { setReplyingTo(null); setReplyContent('') }}
                            className="h-7 w-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0"
                            aria-label="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="submit"
                            disabled={!replyContent.trim() || createReplyMutation.isLoading}
                            className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-40 flex-shrink-0"
                            aria-label="Send reply"
                          >
                            {createReplyMutation.isLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

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

      {/* Mobile: fixed input bar attached to keyboard */}
      {(commentModalOpen || replyModalComment) && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-end gap-2 px-3 py-2">
            <ProfileAvatar member={currentMemberData} size="sm" />
            <div className="flex-1 flex items-end bg-gray-100 rounded-2xl px-3 py-2">
              <textarea
                autoFocus
                value={commentModalOpen ? newComment : replyContent}
                onChange={(e) => {
                  const val = e.target.value
                  commentModalOpen ? setNewComment(val) : setReplyContent(val)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                placeholder={commentModalOpen ? 'Add a comment...' : 'Write a reply...'}
                rows={1}
                className="flex-1 bg-transparent outline-none text-base resize-none overflow-hidden"
                style={{ minHeight: '1.25rem', maxHeight: '100px' }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCommentModalOpen(false)
                setReplyModalComment(null)
                setNewComment('')
                setReplyContent('')
              }}
              className="h-9 w-9 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (commentModalOpen && newComment.trim()) {
                  createCommentMutation.mutate(newComment)
                  setCommentModalOpen(false)
                } else if (replyModalComment && replyContent.trim()) {
                  createReplyMutation.mutate({ commentId: replyModalComment, content: replyContent })
                  setReplyModalComment(null)
                }
              }}
              disabled={createCommentMutation.isLoading || createReplyMutation.isLoading || (commentModalOpen ? !newComment.trim() : !replyContent.trim())}
              className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-40"
              aria-label="Send"
            >
              {(createCommentMutation.isLoading || createReplyMutation.isLoading)
                ? <Loader className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
