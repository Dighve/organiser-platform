import { useState, useRef, useEffect } from 'react'
import { X, Download, Share2, Loader2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story', emoji: '📱' },
  post:  { width: 1080, height: 1080, label: 'Post',  emoji: '🖼️' },
}

const DIFFICULTY_LABELS = {
  BEGINNER:     '🟢 Beginner',
  INTERMEDIATE: '🟡 Intermediate',
  ADVANCED:     '🟠 Advanced',
  EXPERT:       '🔴 Expert',
}

const DIFFICULTY_COLORS = {
  BEGINNER:     '#10b981',
  INTERMEDIATE: '#f59e0b',
  ADVANCED:     '#f97316',
  EXPERT:       '#ef4444',
}

// ─── Canvas Utilities ─────────────────────────────────────────────────────────

function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, currentY)
  return currentY
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// ─── Core flyer builder ───────────────────────────────────────────────────────

async function buildFlyer(event, formatKey) {
  const { width, height } = FORMATS[formatKey]
  const isStory = formatKey === 'story'

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const PAD      = 68
  const HEADER_H = isStory ? 175 : 145
  const IMAGE_H  = isStory ? 820 : 620

  // 1 ── Full gradient background (visible if no image)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0,   '#6d28d9')
  bgGrad.addColorStop(0.5, '#db2777')
  bgGrad.addColorStop(1,   '#ea580c')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2 ── Banner image
  if (event?.imageUrl) {
    try {
      const img = await loadImage(event.imageUrl)
      // Cover-fit the image into the banner area
      const srcRatio  = img.width / img.height
      const destRatio = width / IMAGE_H
      let sx, sy, sw, sh
      if (srcRatio > destRatio) {
        sh = img.height
        sw = img.height * destRatio
        sx = (img.width - sw) / 2
        sy = 0
      } else {
        sw = img.width
        sh = img.width / destRatio
        sx = 0
        sy = (img.height - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, HEADER_H, width, IMAGE_H)
    } catch {
      // gradient background already drawn — nothing extra needed
    }
  }

  // 3 ── Header bar
  const headerGrad = ctx.createLinearGradient(0, 0, width, HEADER_H)
  headerGrad.addColorStop(0, '#4c1d95')
  headerGrad.addColorStop(1, '#9d174d')
  ctx.fillStyle = headerGrad
  ctx.fillRect(0, 0, width, HEADER_H)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${isStory ? 58 : 50}px Arial, sans-serif`
  ctx.fillText('OutMeets', width / 2, HEADER_H * 0.58)
  ctx.font = `${isStory ? 28 : 25}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.fillText('Connect through outdoor adventures', width / 2, HEADER_H * 0.84)

  // 4 ── Dark overlay over bottom of image → content area
  const CONTENT_Y = HEADER_H + IMAGE_H

  const fadeOverlay = ctx.createLinearGradient(0, HEADER_H + IMAGE_H * 0.42, 0, CONTENT_Y)
  fadeOverlay.addColorStop(0, 'rgba(0,0,0,0)')
  fadeOverlay.addColorStop(1, 'rgba(0,0,0,0.86)')
  ctx.fillStyle = fadeOverlay
  ctx.fillRect(0, HEADER_H + IMAGE_H * 0.42, width, IMAGE_H * 0.58)

  ctx.fillStyle = 'rgba(8, 8, 18, 0.93)'
  ctx.fillRect(0, CONTENT_Y, width, height - CONTENT_Y)

  // 5 ── Event details
  ctx.textAlign = 'left'
  let y = CONTENT_Y + (isStory ? 88 : 74)

  // Title
  const titleSize = isStory ? 64 : 56
  ctx.font = `bold ${titleSize}px Arial, sans-serif`
  ctx.fillStyle = '#ffffff'
  y = wrapText(ctx, event?.title || 'Event', PAD, y, width - PAD * 2, titleSize * 1.22)
  y += isStory ? 64 : 56

  // Date & time
  const rowSize = isStory ? 38 : 34
  ctx.font = `${rowSize}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.88)'

  let dateStr = 'Date TBC'
  try {
    if (event?.eventDate) dateStr = format(new Date(event.eventDate), 'EEE d MMM yyyy')
  } catch {}
  const timeStr = event?.startTime ? event.startTime.substring(0, 5) : ''
  ctx.fillText(`📅  ${dateStr}${timeStr ? '  •  ' + timeStr : ''}`, PAD, y)
  y += isStory ? 62 : 56

  // Location
  if (event?.location) {
    const loc = event.location.length > 46 ? event.location.substring(0, 46) + '…' : event.location
    ctx.fillText(`📍  ${loc}`, PAD, y)
    y += isStory ? 62 : 56
  }

  // Difficulty badge
  if (event?.difficultyLevel) {
    const key    = event.difficultyLevel.toUpperCase()
    const label  = DIFFICULTY_LABELS[key] || event.difficultyLevel
    const color  = DIFFICULTY_COLORS[key] || '#7c3aed'
    const bFont  = isStory ? 33 : 29
    ctx.font = `bold ${bFont}px Arial, sans-serif`
    const bText  = `  ${label}  `
    const bW     = ctx.measureText(bText).width + 52
    const bH     = bFont + 30
    ctx.fillStyle = color
    fillRoundRect(ctx, PAD - 6, y - bFont - 12, bW, bH, 44)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(bText, PAD + 20, y)
  }

  // 6 ── Footer
  ctx.textAlign = 'center'
  ctx.font = `${isStory ? 30 : 26}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.52)'
  ctx.fillText('outmeets.com', width / 2, height - (isStory ? 58 : 48))

  return canvas
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventFlyerModal({ isOpen, onClose, event }) {
  const [flyerFormat, setFlyerFormat]   = useState('story')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing]       = useState(false)
  const [isCopied, setIsCopied]         = useState(false)
  const [previewUrl, setPreviewUrl]     = useState(null)
  const canvasCache = useRef({})

  const isMobile    = typeof navigator !== 'undefined'
    && 'share' in navigator
    && (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  const canCopyImg  = typeof navigator !== 'undefined' && 'clipboard' in navigator && typeof ClipboardItem !== 'undefined'

  // Regenerate preview when modal opens or format changes
  useEffect(() => {
    if (!isOpen || !event) return
    let cancelled = false

    setIsGenerating(true)
    setPreviewUrl(null)

    buildFlyer(event, flyerFormat)
      .then((canvas) => {
        if (cancelled) return
        canvasCache.current[flyerFormat] = canvas
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.82))
        setIsGenerating(false)
      })
      .catch(() => {
        if (!cancelled) setIsGenerating(false)
      })

    return () => { cancelled = true }
  }, [isOpen, flyerFormat, event])

  // Clear cache when event changes
  useEffect(() => {
    canvasCache.current = {}
  }, [event?.id])

  const getCanvas = async () =>
    canvasCache.current[flyerFormat] || buildFlyer(event, flyerFormat)

  const filename = () =>
    `outmeets-${(event?.title || 'event').replace(/\s+/g, '-').toLowerCase()}-${flyerFormat}.png`

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const canvas = await getCanvas()
      const blob   = await canvasToBlob(canvas)
      if (!blob) throw new Error('empty blob')

      const file = new File([blob], filename(), { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: event?.title || 'Check out this event!',
          text:  `Join me at "${event?.title}" on OutMeets! outmeets.com`,
        })
        // no toast needed — native share sheet gives feedback
      } else {
        triggerDownload(blob, filename())
        toast.success('Flyer downloaded!')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.error('Could not share — downloading instead')
        try {
          const c = await getCanvas()
          const b = await canvasToBlob(c)
          if (b) triggerDownload(b, filename())
        } catch {}
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    try {
      const canvas = await getCanvas()
      const blob   = await canvasToBlob(canvas)
      if (!blob) return
      triggerDownload(blob, filename())
      toast.success('Flyer downloaded!')
    } catch {
      toast.error('Failed to download flyer')
    }
  }

  const handleCopy = async () => {
    try {
      const canvas = await getCanvas()
      const blob   = await canvasToBlob(canvas)
      if (!blob) throw new Error('empty blob')
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setIsCopied(true)
      toast.success('Image copied! Paste it into Instagram.com')
      setTimeout(() => setIsCopied(false), 2500)
    } catch {
      // Fallback to download if clipboard write fails
      handleDownload()
    }
  }

  if (!isOpen) return null

  const fmt = FORMATS[flyerFormat]

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600">
          <div>
            <h2 className="text-base font-bold text-white">Share as Flyer</h2>
            <p className="text-xs text-white/75">Share to Instagram, WhatsApp & more</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex gap-2 p-4 pb-3">
          {Object.entries(FORMATS).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setFlyerFormat(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                flyerFormat === key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center px-4 pb-3">
          <div
            className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 shadow-inner ${
              flyerFormat === 'story' ? 'w-28 aspect-[9/16]' : 'w-44 aspect-square'
            }`}
          >
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-purple-500" />
              </div>
            )}
            {previewUrl && !isGenerating && (
              <img src={previewUrl} alt="Flyer preview" className="w-full h-full object-cover" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            {fmt.width} × {fmt.height} px
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-4">
          {isMobile ? (
            // Mobile: Share (native sheet) + Download icon
            <>
              <button
                onClick={handleShare}
                disabled={isSharing || isGenerating}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
                {isSharing ? 'Preparing…' : 'Share'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                title="Save to device"
                className="px-3.5 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 transition-all"
              >
                <Download className="h-5 w-5" />
              </button>
            </>
          ) : (
            // Desktop: Copy to clipboard (primary) + Download icon
            <>
              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all"
              >
                {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {isCopied ? 'Copied!' : 'Copy Image'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                title="Download PNG"
                className="px-3.5 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 transition-all"
              >
                <Download className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Tip */}
        <div className="px-4 pb-5">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {isMobile
              ? '📱 Tap Share → select Instagram → post as Story or Feed'
              : canCopyImg
                ? '💻 Copy image to clipboard, then paste into any app or website'
                : '💻 Download the image to share or upload anywhere'}
          </p>
        </div>

      </div>
    </div>
  )
}
