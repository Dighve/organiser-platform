# Mobile & Desktop Design Patterns - OutMeets Platform

**CRITICAL: Always implement features for BOTH mobile and desktop with different UX**

---

## 📱 Mobile-First Philosophy

### Core Principles:
1. **Design mobile first** (375px viewport)
2. **Add desktop enhancements** via responsive breakpoints
3. **Different UX patterns** for mobile vs desktop
4. **Touch-friendly targets** (minimum 44px height)
5. **Test on real devices** before deploying

---

## 🎯 Responsive Breakpoints

```css
/* Mobile: Default (< 768px) */
/* Tablet: md: (768px - 1024px) */
/* Desktop: lg: (> 1024px) */
/* Large Desktop: xl: (> 1280px) */
```

### Tailwind Prefixes:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

---

## 📱 MOBILE DESIGN PATTERNS

### 1. Three-Dot Menu (⋮) - Action Menu Pattern

**When to use:** For edit, delete, share actions on cards/items

**Implementation:**
```jsx
import { MoreVertical, Edit, Trash, Share } from 'lucide-react';

function EventCard({ event }) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="relative">
      {/* Three-dot button - Mobile only */}
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full lg:hidden"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>
      
      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute top-12 right-4 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 lg:hidden">
          <button 
            onClick={handleEdit}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
          >
            <Edit className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Edit Event</span>
          </button>
          <button 
            onClick={handleShare}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
          >
            <Share className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Share</span>
          </button>
          <button 
            onClick={handleDelete}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
          >
            <Trash className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">Delete</span>
          </button>
        </div>
      )}
      
      {/* Card content */}
      <div className="p-4">
        {/* ... */}
      </div>
    </div>
  );
}
```

**Key Features:**
- Position: `absolute top-4 right-4`
- Icon: `MoreVertical` from lucide-react
- Size: `w-5 h-5` (20px)
- Padding: `p-2` (8px) for touch target
- Hidden on desktop: `lg:hidden`
- Dropdown: Full-width buttons with icons
- Z-index: `z-50` to appear above content

### 2. Bottom Sheet Modal Pattern

**When to use:** For forms, filters, detailed views on mobile

**Implementation:**
```jsx
function MobileBottomSheet({ isOpen, onClose, title, children }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
      
      {/* Bottom sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50
        transform transition-transform duration-300 lg:hidden
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
```

### 3. Full-Width Card Pattern

**Mobile layout:**
```jsx
<div className="w-full px-4 py-3 space-y-4">
  <div className="bg-white rounded-lg shadow-md p-4">
    {/* No side margins on mobile */}
  </div>
</div>
```

### 4. Stacked Layout Pattern

**Mobile:** Vertical stacking
```jsx
<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
  <div className="w-full lg:w-1/2">Section 1</div>
  <div className="w-full lg:w-1/2">Section 2</div>
</div>
```

### 5. Hamburger Menu Pattern

**Mobile navigation:**
```jsx
import { Menu, X } from 'lucide-react';

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Hamburger button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 lg:hidden">
          <nav className="p-6 space-y-4">
            {/* Navigation items */}
          </nav>
        </div>
      )}
    </>
  );
}
```

### 6. Touch Target Sizing

**Minimum touch targets:**
```jsx
// Buttons
<button className="px-4 py-3 min-h-[44px]">
  Click me
</button>

// Icons
<button className="p-3"> {/* 12px padding + 20px icon = 44px */}
  <Icon className="w-5 h-5" />
</button>

// Links
<a className="block py-3 px-4">
  Link text
</a>
```

---

## 🖥️ DESKTOP DESIGN PATTERNS

### 1. Hover Actions Pattern

**When to use:** Show edit/delete buttons on hover

**Implementation:**
```jsx
function EventCard({ event }) {
  return (
    <div className="group relative">
      {/* Card content */}
      <div className="p-6">
        {/* ... */}
      </div>
      
      {/* Hover actions - Desktop only */}
      <div className="hidden lg:flex absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
        <button 
          onClick={handleEdit}
          className="p-2 bg-white hover:bg-purple-50 rounded-lg shadow-md border border-gray-200"
        >
          <Edit className="w-4 h-4 text-purple-600" />
        </button>
        <button 
          onClick={handleShare}
          className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-md border border-gray-200"
        >
          <Share className="w-4 h-4 text-blue-600" />
        </button>
        <button 
          onClick={handleDelete}
          className="p-2 bg-white hover:bg-red-50 rounded-lg shadow-md border border-gray-200"
        >
          <Trash className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
}
```

**Key Features:**
- Hidden by default: `opacity-0`
- Show on hover: `group-hover:opacity-100`
- Desktop only: `hidden lg:flex`
- Smooth transition: `transition-opacity`

### 2. Sidebar Navigation Pattern

**Desktop persistent sidebar:**
```jsx
function Layout({ children }) {
  return (
    <div className="flex">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <nav className="p-6 space-y-2">
          {/* Navigation items */}
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
```

### 3. Multi-Column Grid Pattern

**Desktop:** 2-3 columns
**Mobile:** 1 column

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

### 4. Dropdown Menu Pattern

**Desktop dropdown:**
```jsx
import { ChevronDown } from 'lucide-react';

function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative hidden lg:block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
      >
        <span>Actions</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {items.map(item => (
            <button 
              key={item.id}
              onClick={item.onClick}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Modal Dialog Pattern

**Desktop centered modal:**
```jsx
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-8 py-6">
          {children}
        </div>
      </div>
    </>
  );
}
```

### 6. Breadcrumbs Pattern

**Desktop navigation:**
```jsx
import { ChevronRight } from 'lucide-react';

function Breadcrumbs({ items }) {
  return (
    <nav className="hidden lg:flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <a 
            href={item.href}
            className={`hover:text-purple-600 ${
              index === items.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
            }`}
          >
            {item.label}
          </a>
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

---

## 🔄 REUSABLE COMPONENTS

### Existing Components to ALWAYS Reuse:

#### 1. ProfileAvatar.jsx
```jsx
import ProfileAvatar from '@/components/ProfileAvatar';

// Usage
<ProfileAvatar 
  member={member} 
  size="md" // xs, sm, md, lg, xl, 2xl, 3xl
  showBadge={true} // Show organiser/host badge
/>
```

#### 2. ImageUpload.jsx
```jsx
import ImageUpload from '@/components/ImageUpload';

// Usage
<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  folder="events" // events, groups, profiles
/>
```

#### 3. GooglePlacesAutocomplete.jsx
```jsx
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';

// Usage
<GooglePlacesAutocomplete
  value={location}
  onChange={(value) => setLocation(value)}
  onPlaceSelect={(data) => {
    setLocation(data.address);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
  }}
  placeholder="Enter location"
/>
```

#### 4. TagInput.jsx
```jsx
import TagInput from '@/components/TagInput';

// Usage
<TagInput
  value={tags}
  onChange={(newTags) => setTags(newTags)}
  suggestions={['Hiking boots', 'Water bottle', 'Backpack']}
  placeholder="Add gear..."
/>
```

#### 5. MemberAutocomplete.jsx
```jsx
import MemberAutocomplete from '@/components/MemberAutocomplete';

// Usage
<MemberAutocomplete
  value={selectedMember}
  onChange={(member) => setSelectedMember(member)}
  placeholder="Select host..."
/>
```

#### 6. NotificationBell.jsx
```jsx
import NotificationBell from '@/components/NotificationBell';

// Usage (in header)
<NotificationBell />
```

#### 7. LoginModal.jsx
```jsx
import LoginModal from '@/components/LoginModal';

// Usage
<LoginModal 
  isOpen={showLogin}
  onClose={() => setShowLogin(false)}
/>
```

---

## 🎨 CONSISTENT DESIGN SYSTEM

### Button Patterns:

#### Primary Action (Continue, Save, Submit)
```jsx
<button className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-xl transition-all">
  Continue
</button>
```

#### Secondary Action (Cancel, Back)
```jsx
<button className="w-full lg:w-auto px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-purple-600 transition-all">
  Cancel
</button>
```

#### Destructive Action (Delete)
```jsx
<button className="w-full lg:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
  Delete
</button>
```

### Card Patterns:

#### Standard Card
```jsx
<div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 lg:p-6">
  {/* Content */}
</div>
```

#### Gradient Card
```jsx
<div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4 lg:p-6">
  {/* Content */}
</div>
```

#### Glassmorphism Card
```jsx
<div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg p-4 lg:p-6">
  {/* Content */}
</div>
```

### Input Patterns:

#### Standard Input
```jsx
<input 
  type="text"
  className="w-full px-4 py-3 lg:py-4 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
  placeholder="Enter text..."
/>
```

#### Gradient-Bordered Input
```jsx
<div className="relative group">
  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity" />
  <input 
    type="text"
    className="relative w-full px-4 py-3 lg:py-4 border-2 border-gray-300 rounded-lg focus:border-purple-600 transition-all"
  />
</div>
```

---

## ✅ IMPLEMENTATION CHECKLIST

Before implementing ANY feature, verify:

### Mobile (< 768px):
- [ ] Three-dot menu for actions (if applicable)
- [ ] Full-width cards/buttons
- [ ] Stacked vertical layout
- [ ] Touch targets ≥ 44px
- [ ] Bottom sheet modals (if applicable)
- [ ] Hamburger menu navigation
- [ ] Single column grid
- [ ] Tested on 375px viewport

### Desktop (> 1024px):
- [ ] Hover actions visible on hover
- [ ] Multi-column grid (2-3 columns)
- [ ] Sidebar navigation (if applicable)
- [ ] Centered modal dialogs
- [ ] Dropdown menus
- [ ] Breadcrumbs (if applicable)
- [ ] Wider spacing and padding
- [ ] Tested on 1440px viewport

### Both:
- [ ] Reused existing components
- [ ] OutMeets brand colors (purple-pink-orange)
- [ ] Smooth transitions (300ms)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Accessibility (keyboard navigation)

---

## 🚫 COMMON MISTAKES TO AVOID

### ❌ Wrong: Desktop-only implementation
```jsx
<button className="hover:bg-gray-100">
  Edit
</button>
```

### ✅ Correct: Mobile + Desktop
```jsx
{/* Mobile: Three-dot menu */}
<button className="lg:hidden">
  <MoreVertical />
</button>

{/* Desktop: Hover action */}
<button className="hidden lg:block opacity-0 group-hover:opacity-100">
  <Edit />
</button>
```

### ❌ Wrong: Same layout for all screens
```jsx
<div className="grid grid-cols-3">
  {/* Always 3 columns */}
</div>
```

### ✅ Correct: Responsive grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

### ❌ Wrong: Small touch targets
```jsx
<button className="p-1">
  <Icon className="w-4 h-4" />
</button>
```

### ✅ Correct: Proper touch targets
```jsx
<button className="p-3 min-h-[44px]">
  <Icon className="w-5 h-5" />
</button>
```

---

## 📚 EXAMPLES FROM CODEBASE

### EventDetailPage.jsx - Three-Dot Menu
```jsx
// Mobile: Three-dot menu
<button className="lg:hidden">
  <MoreVertical className="w-5 h-5" />
</button>

// Desktop: Hover buttons
<div className="hidden lg:flex opacity-0 group-hover:opacity-100">
  <button><Edit /></button>
  <button><Share /></button>
  <button><Trash /></button>
</div>
```

### GroupDetailPage.jsx - Tabs
```jsx
// Mobile: Full-width tabs
<div className="flex border-b border-gray-200 overflow-x-auto">
  <button className="px-6 py-3 whitespace-nowrap">About</button>
  <button className="px-6 py-3 whitespace-nowrap">Events</button>
  <button className="px-6 py-3 whitespace-nowrap">Members</button>
</div>

// Desktop: Same but with more spacing
<div className="flex border-b border-gray-200">
  <button className="px-8 py-4">About</button>
  <button className="px-8 py-4">Events</button>
  <button className="px-8 py-4">Members</button>
</div>
```

### HomePage.jsx - Grid Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

---

## 🎯 TESTING CHECKLIST

### Before Deployment:
1. [ ] Test on mobile viewport (375px)
2. [ ] Test on tablet viewport (768px)
3. [ ] Test on desktop viewport (1440px)
4. [ ] Test touch interactions (on real device if possible)
5. [ ] Test keyboard navigation
6. [ ] Test with slow 3G connection
7. [ ] Verify all actions work on both mobile and desktop
8. [ ] Check that three-dot menu appears on mobile
9. [ ] Check that hover actions appear on desktop
10. [ ] Verify responsive grid adapts correctly

---

**Remember: Mobile and desktop are DIFFERENT experiences. Design for both!**
