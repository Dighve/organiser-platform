/**
 * ProfileAvatar Component
 * 
 * A reusable avatar component that displays either:
 * 1. Profile photo if available
 * 2. Gradient avatar with initials as fallback
 * 
 * Supports multiple sizes and maintains consistent styling across the platform
 */

const ProfileAvatar = ({ 
  member, 
  size = 'md',
  className = '',
  showBadge = false,
  badgeType = null // 'organiser' or 'host'
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-2xl',
    '2xl': 'h-20 w-20 text-3xl',
    '3xl': 'h-32 w-32 text-5xl',
  }

  // Helper function to get initials
  const getInitials = () => {
    if (member?.displayName && member.displayName.trim()) {
      return member.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (member?.email) {
      return member.email[0].toUpperCase()
    }
    return '?'
  }

  const baseClasses = `${sizeClasses[size]} rounded-full ${className}`

  return (
    <div className="relative inline-block">
      {member?.profilePhotoUrl ? (
        <img
          src={member.profilePhotoUrl}
          alt={member.displayName || member.email || 'Member'}
          className={`${baseClasses} object-cover`}
        />
      ) : (
        <div className={`${baseClasses} bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold`}>
          {getInitials()}
        </div>
      )}
      
      {/* Badge for organiser or host */}
      {showBadge && badgeType && (
        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-full px-2 py-0.5 border-2 border-white shadow-lg">
          {badgeType === 'organiser' ? '💼' : '🎯'}
        </div>
      )}
    </div>
  )
}

export default ProfileAvatar
