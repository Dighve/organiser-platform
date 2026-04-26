import { useState, useRef, useEffect } from 'react'
import { Share2, Copy, Check, ChevronDown, MessageCircle, Mail, UserPlus, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { trackShareOpened, trackShareCompleted, trackShareMethodSelected } from '../lib/analytics'
import InviteMembersModal from './InviteMembersModal'

export default function ShareButton({
  type = 'event', // 'event' or 'group'
  itemId, // event ID or group ID
  groupId, // group ID (for showing "Not Member" badge in invitations)
  title,
  description,
  url,
  imageUrl,
  onFlyerShare, // optional: opens EventFlyerModal when provided
  showEmbed = false, // optional: show "Embed on website" option (host/organiser only)
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'icon'
  size = 'md' // 'sm', 'md', 'lg'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEmbedPanel, setShowEmbedPanel] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShare = () => {
    trackShareOpened(type, url)
    setShowEmbedPanel(false)
    setIsOpen(!isOpen)
  }

  const getEmbedSnippet = () => {
    const embedUrl = `${window.location.origin}/events/${itemId}/embed`
    return `<iframe src="${embedUrl}" width="100%" height="380" frameborder="0" style="border-radius:12px;border:1px solid #e5e7eb;max-width:360px;display:block"></iframe>`
  }

  const copyEmbedSnippet = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedSnippet())
      setEmbedCopied(true)
      toast.success('Embed code copied!')
      setTimeout(() => setEmbedCopied(false), 2000)
    } catch {
      toast.error('Failed to copy embed code')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackShareMethodSelected(type, 'copy_link', url)
      toast.success('Link copied to clipboard!')
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy link')
    }
  }

  const shareViaWhatsApp = () => {
    trackShareMethodSelected(type, 'whatsapp', url)
    const text = encodeURIComponent(`${title}\n\n${description}\n\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setIsOpen(false)
  }

  const shareViaEmail = () => {
    trackShareMethodSelected(type, 'email', url)
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${description}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setIsOpen(false)
  }

  const shareViaFacebook = () => {
    trackShareMethodSelected(type, 'facebook', url)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    setIsOpen(false)
  }

  const shareViaTwitter = () => {
    trackShareMethodSelected(type, 'twitter', url)
    const text = encodeURIComponent(title)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
    setIsOpen(false)
  }

  const openInviteModal = () => {
    trackShareMethodSelected(type, 'invite_members', url)
    setShowInviteModal(true)
    setIsOpen(false)
  }

  const flyerOption = onFlyerShare ? [{
    id: 'flyer',
    name: 'Share as Flyer',
    icon: '🖼️',
    color: 'from-orange-500 to-pink-500',
    action: () => { onFlyerShare(); setIsOpen(false) }
  }] : []

  const embedOption = showEmbed ? [{
    id: 'embed',
    name: 'Embed on website',
    icon: '🔗',
    color: 'from-indigo-500 to-purple-600',
    action: () => setShowEmbedPanel(true)
  }] : []

  const shareOptions = [
    ...flyerOption,
    ...embedOption,
    {
      id: 'invite',
      name: 'Invite Members',
      icon: '👥',
      color: 'from-purple-600 to-pink-600',
      action: openInviteModal
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: '🔗',
      color: 'from-purple-500 to-purple-600',
      action: copyToClipboard
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: 'from-green-500 to-green-600',
      action: shareViaWhatsApp
    },
    {
      id: 'email',
      name: 'Email',
      icon: '📧',
      color: 'from-blue-500 to-blue-600',
      action: shareViaEmail
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'from-blue-600 to-indigo-600',
      action: shareViaFacebook
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: 'from-sky-500 to-blue-500',
      action: shareViaTwitter
    }
  ]

  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  // Button variant classes
  const variantClasses = {
    primary: 'group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50',
    ghost: 'bg-transparent text-gray-700 border-0',
    icon: 'bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 p-2'
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Share Button */}
      <button
        onClick={handleShare}
        className={`
          ${variant === 'primary' ? variantClasses[variant] : `flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 ${variantClasses[variant]} ${variant === 'icon' ? 'p-2' : sizeClasses[size]} ${variant !== 'icon' ? 'w-full justify-center' : ''}`}
        `}
        aria-label="Share"
      >
        <Share2 className={`h-5 w-5 ${variant === 'primary' ? 'group-hover:rotate-12 transition-transform' : ''}`} />
        {variant !== 'icon' && <span>Share</span>}
        {variant !== 'icon' && (
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="relative mt-2 z-[100] w-full min-w-[280px] bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-gray-100 animate-fade-in">
          {showEmbedPanel ? (
            /* Embed panel */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmbedPanel(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-gray-800 text-sm">Embed on your website</span>
              </div>
              <p className="text-xs text-gray-500">Paste this into any website that supports HTML:</p>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <code className="text-xs text-gray-700 break-all leading-relaxed font-mono">
                  {getEmbedSnippet()}
                </code>
              </div>
              <button
                onClick={copyEmbedSnippet}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-all"
              >
                {embedCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {embedCopied ? 'Copied!' : 'Copy embed code'}
              </button>
              <a
                href={`${window.location.origin}/events/${itemId}/embed`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-purple-600 hover:underline"
              >
                Preview embed
              </a>
            </div>
          ) : (
            <>
              <div className="p-2 space-y-1">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 text-left"
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <span className="text-xl">{option.icon}</span>
                    </div>

                    {/* Name */}
                    <span className="flex-1 font-semibold text-gray-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                      {option.name}
                    </span>

                    {/* Check icon for copied state */}
                    {option.id === 'copy' && copied && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Helper Text */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-100">
                <p className="text-xs text-gray-600 text-center">
                  💡 Choose how you'd like to share
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        type={type}
        itemId={itemId}
        groupId={groupId}
        title={title}
        url={url}
      />
    </div>
  )
}
