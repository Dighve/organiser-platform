# OutMeets Legal Implementation Guide

**Created:** December 9, 2025  
**Status:** Ready for Implementation

## EXECUTIVE SUMMARY

This guide provides a complete roadmap for implementing legal agreements and compliance measures for the OutMeets platform. All legal documents have been drafted and are ready for review by a qualified solicitor.

**⚠️ CRITICAL:** While these documents are comprehensive, they should be reviewed by a qualified solicitor before deployment, especially for:
- UK-specific legal requirements
- Insurance recommendations
- Liability limitations
- GDPR compliance verification

---

## 1. LEGAL DOCUMENTS CREATED

### 1.1 Complete Document List

| Document | Purpose | When Required | Status |
|----------|---------|---------------|--------|
| **Terms of Service** | Platform-wide user agreement | Account creation | ✅ Complete |
| **Privacy Policy** | GDPR-compliant data policy | Account creation | ✅ Complete |
| **Organiser Agreement** | Organiser responsibilities & liability | First group/event creation | ✅ Complete |
| **Event Participation Waiver** | Event-specific liability release | Joining each event | ✅ Complete |
| **Cookie Policy** | Cookie usage & consent | First website visit | ✅ Complete |

### 1.2 Document Locations

All documents are located in:
```
organiser-platform/docs/legal/
├── TERMS_OF_SERVICE.md
├── PRIVACY_POLICY.md
├── ORGANISER_AGREEMENT.md
├── EVENT_PARTICIPATION_WAIVER.md
├── COOKIE_POLICY.md
└── LEGAL_IMPLEMENTATION_GUIDE.md (this file)
```

---

## 2. USER JOURNEY & CONSENT POINTS

### 2.1 New User Registration (First Visit)

**Step 1: Cookie Consent Banner**
- Appears on first page load
- Options: Accept All, Essential Only, Customize
- Required before any interaction

**Step 2: Sign Up (Google OAuth or Magic Link)**
- User clicks "Sign in to join"
- Presented with authentication options

**Step 3: Terms & Privacy Acceptance**
- Checkbox: "I agree to the Terms of Service and Privacy Policy"
- Links to full documents
- Cannot proceed without acceptance
- Timestamp and IP logged

**Implementation:**
```jsx
<div className="mt-4 flex items-start gap-2">
  <input
    type="checkbox"
    id="terms"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    className="mt-1"
  />
  <label htmlFor="terms" className="text-sm text-gray-600">
    I agree to the{' '}
    <a href="/legal/terms" className="text-purple-600 hover:underline">
      Terms of Service
    </a>{' '}
    and{' '}
    <a href="/legal/privacy" className="text-purple-600 hover:underline">
      Privacy Policy
    </a>
  </label>
</div>
```

### 2.2 Becoming an Organiser (First Group/Event)

**When:** User clicks "Create Group" or "Create Event" for the first time

**Modal Flow:**
1. **Title:** "Become an Organiser"
2. **Summary:** Key responsibilities and liabilities
3. **Full Agreement:** Scrollable Organiser Agreement
4. **Insurance Notice:** Prominent warning about insurance requirements
5. **Checkbox:** "I have read and agree to the Organiser Agreement"
6. **Checkbox:** "I understand I need public liability insurance (recommended £5M+)"
7. **Button:** "Accept & Continue"

**Implementation:**
```jsx
// Check if user has accepted Organiser Agreement
const { data: member } = useQuery(['currentMember'], membersAPI.getCurrentMember)

const handleCreateGroup = () => {
  if (!member.hasAcceptedOrganiserAgreement) {
    setShowOrganiserAgreementModal(true)
  } else {
    navigate('/groups/create')
  }
}
```

### 2.3 Joining an Event

**When:** User clicks "Join Event"

**Modal Flow:**
1. **Title:** "Event Participation Waiver"
2. **Event Details:** Auto-filled (event name, date, organiser)
3. **Risk Acknowledgment:** Summary of key risks
4. **Full Waiver:** Scrollable waiver document
5. **Emergency Contact:** Form fields (name, phone, relationship)
6. **Medical Info (Optional):** Allergies, conditions, medications
7. **Checkbox:** "I have read and agree to the Event Participation Waiver"
8. **Checkbox:** "I understand I am assuming all risks of participation"
9. **Button:** "Accept Waiver & Join Event"

**Implementation:**
```jsx
const handleJoinEvent = async () => {
  // Show waiver modal
  setShowWaiverModal(true)
}

const handleWaiverAccept = async (waiverData) => {
  // Save waiver acceptance to database
  await eventsAPI.joinEvent(eventId, {
    waiverAccepted: true,
    waiverAcceptedAt: new Date().toISOString(),
    emergencyContact: waiverData.emergencyContact,
    medicalInfo: waiverData.medicalInfo,
  })
  
  // Join event
  // ...
}
```

---

## 3. DATABASE SCHEMA CHANGES

### 3.1 New Tables Required

#### `legal_agreements` Table
```sql
CREATE TABLE legal_agreements (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id),
    agreement_type VARCHAR(50) NOT NULL, -- 'TERMS', 'PRIVACY', 'ORGANISER', 'EVENT_WAIVER'
    agreement_version VARCHAR(20) NOT NULL, -- e.g., '2025-12-09'
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    event_id BIGINT REFERENCES events(id), -- NULL for non-event agreements
    
    UNIQUE(member_id, agreement_type, event_id) -- Prevent duplicates
);

CREATE INDEX idx_legal_agreements_member ON legal_agreements(member_id);
CREATE INDEX idx_legal_agreements_event ON legal_agreements(event_id);
```

#### `event_waivers` Table (Detailed Waiver Data)
```sql
CREATE TABLE event_waivers (
    id BIGSERIAL PRIMARY KEY,
    event_participant_id BIGINT NOT NULL REFERENCES event_participants(id),
    member_id BIGINT NOT NULL REFERENCES members(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    
    -- Waiver acceptance
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    -- Medical information (optional)
    has_medical_conditions BOOLEAN DEFAULT FALSE,
    medical_conditions TEXT, -- JSON or text
    medications TEXT,
    allergies TEXT,
    blood_type VARCHAR(10),
    
    UNIQUE(event_participant_id)
);

CREATE INDEX idx_event_waivers_member ON event_waivers(member_id);
CREATE INDEX idx_event_waivers_event ON event_waivers(event_id);
```

#### Update `members` Table
```sql
ALTER TABLE members ADD COLUMN has_accepted_organiser_agreement BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN organiser_agreement_accepted_at TIMESTAMP;
ALTER TABLE members ADD COLUMN terms_accepted_at TIMESTAMP;
ALTER TABLE members ADD COLUMN privacy_accepted_at TIMESTAMP;
```

### 3.2 Migration Script

Create: `backend/src/main/resources/db/migration/V10__Add_legal_agreements.sql`

```sql
-- Legal agreements tracking
CREATE TABLE legal_agreements (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    agreement_type VARCHAR(50) NOT NULL,
    agreement_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    UNIQUE(member_id, agreement_type, event_id)
);

CREATE INDEX idx_legal_agreements_member ON legal_agreements(member_id);
CREATE INDEX idx_legal_agreements_event ON legal_agreements(event_id);

-- Event waivers with emergency contacts
CREATE TABLE event_waivers (
    id BIGSERIAL PRIMARY KEY,
    event_participant_id BIGINT NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    has_medical_conditions BOOLEAN DEFAULT FALSE,
    medical_conditions TEXT,
    medications TEXT,
    allergies TEXT,
    blood_type VARCHAR(10),
    UNIQUE(event_participant_id)
);

CREATE INDEX idx_event_waivers_member ON event_waivers(member_id);
CREATE INDEX idx_event_waivers_event ON event_waivers(event_id);

-- Update members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_accepted_organiser_agreement BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS organiser_agreement_accepted_at TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP;

-- Backfill existing users (assume they accepted terms when they signed up)
UPDATE members 
SET terms_accepted_at = created_at, 
    privacy_accepted_at = created_at 
WHERE terms_accepted_at IS NULL;
```

---

## 4. BACKEND IMPLEMENTATION

### 4.1 New DTOs

#### `LegalAgreementRequest.java`
```java
package com.organiser.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LegalAgreementRequest {
    @NotBlank
    private String agreementType; // TERMS, PRIVACY, ORGANISER, EVENT_WAIVER
    
    @NotBlank
    private String agreementVersion; // e.g., "2025-12-09"
    
    private Long eventId; // Required for EVENT_WAIVER
    
    private String ipAddress;
    private String userAgent;
}
```

#### `EventWaiverRequest.java`
```java
package com.organiser.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventWaiverRequest {
    @NotNull
    private Long eventId;
    
    // Emergency contact
    @NotBlank
    private String emergencyContactName;
    
    @NotBlank
    private String emergencyContactPhone;
    
    @NotBlank
    private String emergencyContactRelationship;
    
    // Medical info (optional)
    private Boolean hasMedicalConditions;
    private String medicalConditions;
    private String medications;
    private String allergies;
    private String bloodType;
}
```

### 4.2 New Entities

#### `LegalAgreement.java`
```java
package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "legal_agreements")
@Data
public class LegalAgreement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(nullable = false)
    private String agreementType;
    
    @Column(nullable = false)
    private String agreementVersion;
    
    @Column(nullable = false)
    private LocalDateTime acceptedAt;
    
    private String ipAddress;
    
    @Column(columnDefinition = "TEXT")
    private String userAgent;
    
    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;
}
```

#### `EventWaiver.java`
```java
package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_waivers")
@Data
public class EventWaiver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "event_participant_id", nullable = false)
    private EventParticipant eventParticipant;
    
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @Column(nullable = false)
    private LocalDateTime acceptedAt;
    
    private String ipAddress;
    
    // Emergency contact
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    
    // Medical info
    private Boolean hasMedicalConditions;
    
    @Column(columnDefinition = "TEXT")
    private String medicalConditions;
    
    @Column(columnDefinition = "TEXT")
    private String medications;
    
    @Column(columnDefinition = "TEXT")
    private String allergies;
    
    private String bloodType;
}
```

### 4.3 New Repositories

```java
public interface LegalAgreementRepository extends JpaRepository<LegalAgreement, Long> {
    Optional<LegalAgreement> findByMemberIdAndAgreementTypeAndEventId(
        Long memberId, String agreementType, Long eventId
    );
    
    List<LegalAgreement> findByMemberId(Long memberId);
    
    boolean existsByMemberIdAndAgreementType(Long memberId, String agreementType);
}

public interface EventWaiverRepository extends JpaRepository<EventWaiver, Long> {
    Optional<EventWaiver> findByEventParticipantId(Long eventParticipantId);
    
    List<EventWaiver> findByEventId(Long eventId);
    
    Optional<EventWaiver> findByMemberIdAndEventId(Long memberId, Long eventId);
}
```

### 4.4 New Service Methods

#### `LegalService.java`
```java
@Service
public class LegalService {
    
    @Autowired
    private LegalAgreementRepository legalAgreementRepository;
    
    public void recordAgreementAcceptance(
        Long memberId, 
        String agreementType, 
        String version,
        String ipAddress,
        String userAgent,
        Long eventId
    ) {
        LegalAgreement agreement = new LegalAgreement();
        agreement.setMember(memberRepository.findById(memberId).orElseThrow());
        agreement.setAgreementType(agreementType);
        agreement.setAgreementVersion(version);
        agreement.setAcceptedAt(LocalDateTime.now());
        agreement.setIpAddress(ipAddress);
        agreement.setUserAgent(userAgent);
        if (eventId != null) {
            agreement.setEvent(eventRepository.findById(eventId).orElseThrow());
        }
        legalAgreementRepository.save(agreement);
    }
    
    public boolean hasAcceptedAgreement(Long memberId, String agreementType) {
        return legalAgreementRepository.existsByMemberIdAndAgreementType(
            memberId, agreementType
        );
    }
}
```

### 4.5 Update EventService

```java
@Service
public class EventService {
    
    @Autowired
    private EventWaiverRepository eventWaiverRepository;
    
    public void joinEvent(Long eventId, Long memberId, EventWaiverRequest waiverRequest) {
        // Existing join logic...
        
        // Save waiver
        EventWaiver waiver = new EventWaiver();
        waiver.setEventParticipant(participant);
        waiver.setMember(member);
        waiver.setEvent(event);
        waiver.setAcceptedAt(LocalDateTime.now());
        waiver.setEmergencyContactName(waiverRequest.getEmergencyContactName());
        waiver.setEmergencyContactPhone(waiverRequest.getEmergencyContactPhone());
        waiver.setEmergencyContactRelationship(waiverRequest.getEmergencyContactRelationship());
        waiver.setHasMedicalConditions(waiverRequest.getHasMedicalConditions());
        waiver.setMedicalConditions(waiverRequest.getMedicalConditions());
        waiver.setMedications(waiverRequest.getMedications());
        waiver.setAllergies(waiverRequest.getAllergies());
        waiver.setBloodType(waiverRequest.getBloodType());
        
        eventWaiverRepository.save(waiver);
        
        // Record legal agreement
        legalService.recordAgreementAcceptance(
            memberId, "EVENT_WAIVER", "2025-12-09", 
            request.getRemoteAddr(), request.getHeader("User-Agent"), eventId
        );
    }
}
```

---

## 5. FRONTEND IMPLEMENTATION

### 5.1 New Components

#### `CookieConsentBanner.jsx`
```jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
  })

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const prefs = { essential: true, functional: true, analytics: true }
    localStorage.setItem('cookie_consent', JSON.stringify(prefs))
    setShow(false)
  }

  const handleEssentialOnly = () => {
    const prefs = { essential: true, functional: false, analytics: false }
    localStorage.setItem('cookie_consent', JSON.stringify(prefs))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-purple-200 shadow-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            🍪 We use cookies
          </h3>
          <p className="text-sm text-gray-600">
            We use essential cookies for authentication and optional cookies to improve your experience.{' '}
            <a href="/legal/cookies" className="text-purple-600 hover:underline">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleEssentialOnly}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### `OrganiserAgreementModal.jsx`
```jsx
import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

export default function OrganiserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasRead, setHasRead] = useState(false)
  const [understandsInsurance, setUnderstandsInsurance] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const acceptMutation = useMutation({
    mutationFn: () => legalAPI.acceptOrganiserAgreement(),
    onSuccess: () => {
      toast.success('✅ Organiser Agreement accepted!')
      onAccept()
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept agreement')
    },
  })

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
    if (bottom) setScrolledToBottom(true)
  }

  const canAccept = hasRead && understandsInsurance && scrolledToBottom

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Become an Organiser
          </h2>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">Important Responsibilities</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• You are personally liable for participant safety</li>
                  <li>• Public liability insurance (£5M+) is strongly recommended</li>
                  <li>• You must have adequate qualifications and experience</li>
                  <li>• OutMeets is NOT liable for your events</li>
                </ul>
              </div>
            </div>
          </div>

          <div 
            className="h-96 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 mb-6 prose prose-sm max-w-none"
            onScroll={handleScroll}
          >
            {/* Full Organiser Agreement content here */}
            <div dangerouslySetInnerHTML={{ __html: organiserAgreementHTML }} />
          </div>

          {!scrolledToBottom && (
            <p className="text-sm text-gray-500 text-center mb-4">
              ↓ Please scroll to the bottom to continue
            </p>
          )}

          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 rounded"
                disabled={!scrolledToBottom}
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the <strong>Organiser Agreement</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={understandsInsurance}
                onChange={(e) => setUnderstandsInsurance(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 rounded"
                disabled={!scrolledToBottom}
              />
              <span className="text-sm text-gray-700">
                I understand I need <strong>public liability insurance</strong> (recommended £5M+ coverage)
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={!canAccept || acceptMutation.isLoading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acceptMutation.isLoading ? 'Accepting...' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### `EventWaiverModal.jsx`
```jsx
// Similar structure to OrganiserAgreementModal
// Includes emergency contact form
// Includes optional medical info form
// Auto-fills event details
```

### 5.2 Update Existing Components

#### `LoginModal.jsx`
Add Terms & Privacy checkbox:
```jsx
<div className="mt-4 flex items-start gap-2">
  <input
    type="checkbox"
    id="terms"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    className="mt-1 h-4 w-4 text-purple-600 rounded"
  />
  <label htmlFor="terms" className="text-xs text-gray-600">
    I agree to the{' '}
    <a href="/legal/terms" target="_blank" className="text-purple-600 hover:underline">
      Terms of Service
    </a>{' '}
    and{' '}
    <a href="/legal/privacy" target="_blank" className="text-purple-600 hover:underline">
      Privacy Policy
    </a>
  </label>
</div>

<button
  type="submit"
  disabled={!acceptedTerms || isLoading}
  className="..."
>
  Send Magic Link
</button>
```

#### `CreateGroupPage.jsx` & `CreateEventPage.jsx`
Add Organiser Agreement check:
```jsx
const { data: member } = useQuery(['currentMember'], membersAPI.getCurrentMember)
const [showOrganiserModal, setShowOrganiserModal] = useState(false)

useEffect(() => {
  if (member && !member.hasAcceptedOrganiserAgreement) {
    setShowOrganiserModal(true)
  }
}, [member])

return (
  <>
    <OrganiserAgreementModal
      isOpen={showOrganiserModal}
      onClose={() => navigate('/')}
      onAccept={() => setShowOrganiserModal(false)}
    />
    {/* Rest of create form */}
  </>
)
```

#### `EventDetailPage.jsx`
Add waiver modal before join:
```jsx
const [showWaiverModal, setShowWaiverModal] = useState(false)

const handleJoinClick = () => {
  setShowWaiverModal(true)
}

const handleWaiverAccept = async (waiverData) => {
  await joinEventMutation.mutate({
    eventId,
    ...waiverData
  })
}

return (
  <>
    <EventWaiverModal
      isOpen={showWaiverModal}
      onClose={() => setShowWaiverModal(false)}
      onAccept={handleWaiverAccept}
      event={event}
    />
    {/* Rest of event detail */}
  </>
)
```

### 5.3 New Pages

#### `TermsPage.jsx`
```jsx
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold mb-8">Terms of Service</h1>
        <div className="bg-white rounded-2xl p-8 prose prose-lg max-w-none">
          {/* Render TERMS_OF_SERVICE.md content */}
        </div>
      </div>
    </div>
  )
}
```

Create similar pages for:
- `/legal/privacy` - Privacy Policy
- `/legal/cookies` - Cookie Policy
- `/legal/organiser-agreement` - Organiser Agreement
- `/legal/waiver` - Event Participation Waiver

---

## 6. IMPLEMENTATION CHECKLIST

### Phase 1: Database & Backend (Week 1)
- [ ] Create migration V10__Add_legal_agreements.sql
- [ ] Run migration on development database
- [ ] Create LegalAgreement and EventWaiver entities
- [ ] Create repositories
- [ ] Create LegalService
- [ ] Update EventService.joinEvent() to require waiver
- [ ] Update MemberService to track organiser agreement
- [ ] Create LegalController with endpoints
- [ ] Test all endpoints with Postman

### Phase 2: Frontend Components (Week 2)
- [ ] Create CookieConsentBanner component
- [ ] Create OrganiserAgreementModal component
- [ ] Create EventWaiverModal component
- [ ] Create legal pages (Terms, Privacy, Cookies, etc.)
- [ ] Update LoginModal with terms checkbox
- [ ] Update CreateGroupPage with organiser check
- [ ] Update CreateEventPage with organiser check
- [ ] Update EventDetailPage with waiver modal
- [ ] Add footer links to legal pages

### Phase 3: Testing (Week 3)
- [ ] Test cookie consent banner
- [ ] Test new user registration flow
- [ ] Test becoming an organiser
- [ ] Test joining an event with waiver
- [ ] Test legal agreement tracking in database
- [ ] Test emergency contact storage
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### Phase 4: Legal Review (Week 4)
- [ ] Hire qualified solicitor
- [ ] Review all legal documents
- [ ] Update based on solicitor feedback
- [ ] Get insurance recommendations
- [ ] Verify GDPR compliance
- [ ] Update agreement versions if needed

### Phase 5: Deployment (Week 5)
- [ ] Deploy database migrations to production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor error logs
- [ ] Test production flow end-to-end
- [ ] Send email to existing users about new terms

---

## 7. COST ESTIMATES

### Legal Costs
- **Solicitor review:** £1,000 - £3,000 (one-time)
- **Annual legal updates:** £500 - £1,000/year

### Insurance (Recommended for Platform)
- **Platform liability insurance:** £500 - £2,000/year
- **Professional indemnity:** £1,000 - £3,000/year

### Development Time
- **Backend implementation:** 20-30 hours
- **Frontend implementation:** 30-40 hours
- **Testing:** 10-15 hours
- **Total:** 60-85 hours (~2 weeks for 1 developer)

---

## 8. ONGOING MAINTENANCE

### Annual Tasks
- [ ] Review and update legal documents (January)
- [ ] Update agreement versions if laws change
- [ ] Renew platform insurance
- [ ] Audit legal agreement database for compliance
- [ ] Review and respond to legal complaints

### Quarterly Tasks
- [ ] Review incident reports
- [ ] Update insurance recommendations
- [ ] Check for new GDPR requirements

### Monthly Tasks
- [ ] Monitor legal agreement acceptance rates
- [ ] Review waiver data for completeness
- [ ] Check for legal compliance issues

---

## 9. RISK MITIGATION

### High-Risk Scenarios

#### Participant Injury/Death
**Mitigation:**
- Strong waiver language
- Clear risk disclosure
- Organiser insurance requirements
- Emergency contact collection
- Incident reporting system

#### Organiser Negligence Lawsuit
**Mitigation:**
- Organiser Agreement clearly states independence
- Platform NOT liable for organiser actions
- Indemnification clauses
- Insurance recommendations
- Qualification disclosure requirements

#### GDPR Violation
**Mitigation:**
- Comprehensive Privacy Policy
- Cookie consent banner
- Data retention policies
- Right to deletion
- Data breach notification procedures

#### Inadequate Waivers
**Mitigation:**
- Solicitor-reviewed waivers
- Event-specific waivers
- Timestamp and IP logging
- Cannot join without acceptance
- Regular legal updates

---

## 10. CONTACT & SUPPORT

### Legal Questions
**Email:** legal@outmeets.com  
**Response Time:** 48 hours

### Incident Reporting
**Email:** safety@outmeets.com  
**Phone:** [Emergency number]  
**Response Time:** Immediate for emergencies

### Data Protection
**Email:** privacy@outmeets.com  
**DPO:** [Name if required]  
**Response Time:** 30 days (GDPR requirement)

---

## APPENDIX A: AGREEMENT VERSIONS

Track agreement versions for legal compliance:

| Agreement | Current Version | Last Updated | Next Review |
|-----------|----------------|--------------|-------------|
| Terms of Service | 2025-12-09 | Dec 9, 2025 | Dec 9, 2026 |
| Privacy Policy | 2025-12-09 | Dec 9, 2025 | Dec 9, 2026 |
| Organiser Agreement | 2025-12-09 | Dec 9, 2025 | Dec 9, 2026 |
| Event Waiver | 2025-12-09 | Dec 9, 2025 | Dec 9, 2026 |
| Cookie Policy | 2025-12-09 | Dec 9, 2025 | Dec 9, 2026 |

---

## APPENDIX B: SOLICITOR REVIEW CHECKLIST

Questions to ask your solicitor:

- [ ] Are liability limitations enforceable in UK courts?
- [ ] Is the waiver language strong enough for hiking activities?
- [ ] What insurance coverage do we need as a platform?
- [ ] What insurance should we require from organisers?
- [ ] Are we compliant with UK GDPR and ePrivacy Directive?
- [ ] Do we need Adventure Activities Licensing?
- [ ] Are there any missing legal protections?
- [ ] Should we require organisers to have specific qualifications?
- [ ] How should we handle minors (under 18)?
- [ ] What are our obligations for incident reporting?

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Begin Phase 1 (Database & Backend)  
**Estimated Completion:** 5 weeks from start

**⚠️ CRITICAL REMINDER:** Have all documents reviewed by a qualified UK solicitor before deployment!
