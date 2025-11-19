# Comment & Reply Feature - Implementation Guide

## Overview
Added a complete comment and reply system to event pages, inspired by Meetup.com's design. Users can now engage in threaded conversations on event pages.

## Backend Changes (Java Spring Boot)

### New Entities Created
1. **EventComment.java** - Main comment entity
   - Fields: id, event, member, content, edited, createdAt, updatedAt
   - Relationships: ManyToOne with Event and Member, OneToMany with replies
   - Location: `backend/src/main/java/com/organiser/platform/model/`

2. **EventCommentReply.java** - Reply entity
   - Fields: id, comment, member, content, edited, createdAt, updatedAt
   - Relationships: ManyToOne with EventComment and Member
   - Location: `backend/src/main/java/com/organiser/platform/model/`

### New Repositories
1. **EventCommentRepository.java** - Comment data access
2. **EventCommentReplyRepository.java** - Reply data access
   - Location: `backend/src/main/java/com/organiser/platform/repository/`

### New DTOs
1. **CommentDTO.java** - Comment response object
2. **ReplyDTO.java** - Reply response object
3. **CreateCommentRequest.java** - Comment creation request
4. **CreateReplyRequest.java** - Reply creation request
   - Location: `backend/src/main/java/com/organiser/platform/dto/`

### New Service
**EventCommentService.java**
- Methods:
  - `getEventComments(Long eventId)` - Get all comments for an event
  - `createComment(Long eventId, CreateCommentRequest, Long memberId)`
  - `updateComment(Long commentId, CreateCommentRequest, Long memberId)`
  - `deleteComment(Long commentId, Long memberId)`
  - `createReply(Long commentId, CreateReplyRequest, Long memberId)`
  - `updateReply(Long replyId, CreateReplyRequest, Long memberId)`
  - `deleteReply(Long replyId, Long memberId)`
- Location: `backend/src/main/java/com/organiser/platform/service/`

### New Controller
**EventCommentController.java**
- REST Endpoints:
  ```
  GET    /api/v1/events/{eventId}/comments              - Get all comments (public)
  POST   /api/v1/events/{eventId}/comments              - Create comment (authenticated)
  PUT    /api/v1/events/comments/{commentId}            - Update comment (authenticated)
  DELETE /api/v1/events/comments/{commentId}            - Delete comment (authenticated)
  POST   /api/v1/events/comments/{commentId}/replies    - Create reply (authenticated)
  PUT    /api/v1/events/replies/{replyId}               - Update reply (authenticated)
  DELETE /api/v1/events/replies/{replyId}               - Delete reply (authenticated)
  ```
- Location: `backend/src/main/java/com/organiser/platform/controller/`

## Frontend Changes (React + Vite)

### New Component
**CommentSection.jsx**
- Full-featured comment section with:
  - Comment creation with rich textarea
  - Threaded replies with visual indentation
  - Inline editing for comments and replies
  - Delete functionality with confirmation
  - User avatars with gradient backgrounds
  - Relative timestamps ("2 hours ago")
  - Edit indicators
  - Empty state message
  - Login prompt for guests
- Location: `frontend/src/components/`

### Updated Files
1. **api.js** - Added `commentsAPI` object with all comment/reply endpoints
2. **EventDetailPage.jsx** - Integrated CommentSection component

## Database Schema

The following tables will be automatically created by JPA:

### event_comments
```sql
CREATE TABLE event_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    INDEX idx_comment_event (event_id),
    INDEX idx_comment_member (member_id),
    INDEX idx_comment_created (created_at)
);
```

### event_comment_replies
```sql
CREATE TABLE event_comment_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES event_comments(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    INDEX idx_reply_comment (comment_id),
    INDEX idx_reply_member (member_id),
    INDEX idx_reply_created (created_at)
);
```

## Design Features

### Visual Style (Meetup-inspired)
- **Color Palette**: Purple-pink-orange gradients (HikeHub brand colors)
- **User Avatars**: 
  - Comments: Purple-to-pink gradient circles
  - Replies: Pink-to-orange gradient circles
- **Cards**: Glassmorphism with backdrop blur
- **Animations**: Smooth transitions, hover effects
- **Icons**: Lucide React icons (MessageCircle, Send, Edit2, Trash2, CornerDownRight)

### User Experience
- **Threaded Conversations**: Replies are visually nested under comments
- **Inline Editing**: Click edit to modify content without navigation
- **Permission Controls**: Only comment/reply authors can edit/delete
- **Real-time Updates**: React Query automatically refreshes data
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Semantic HTML, keyboard navigation support

## Testing the Feature

### Backend Testing
1. Start the backend server
2. The new tables will be created automatically via JPA
3. Test endpoints using Postman or curl:
   ```bash
   # Get comments (no auth needed)
   GET http://localhost:8080/api/v1/events/1/comments
   
   # Create comment (auth required)
   POST http://localhost:8080/api/v1/events/1/comments
   Headers: Authorization: Bearer {token}
   Body: {"content": "Great hike!"}
   ```

### Frontend Testing
1. Navigate to any event detail page
2. Scroll to the comment section at the bottom
3. If logged in:
   - Post a comment
   - Reply to a comment
   - Edit your own comments/replies
   - Delete your own content
4. If logged out:
   - View existing comments
   - See login prompt instead of comment form

## Security Notes
- All write operations (create, update, delete) require authentication
- Users can only edit/delete their own comments and replies
- Comment reading is public (no authentication required)
- JWT token validation handled by existing auth middleware

## Future Enhancements (Optional)
- Like/reaction system for comments
- Mention other users with @username
- Comment notifications
- Rich text formatting (markdown support)
- Image attachments in comments
- Comment moderation tools for event organizers
- Pagination for large comment threads
- Sort options (newest first, oldest first, most liked)

## Files Modified/Created

### Backend (8 new files)
- `model/EventComment.java`
- `model/EventCommentReply.java`
- `repository/EventCommentRepository.java`
- `repository/EventCommentReplyRepository.java`
- `dto/CommentDTO.java`
- `dto/ReplyDTO.java`
- `dto/CreateCommentRequest.java`
- `dto/CreateReplyRequest.java`
- `service/EventCommentService.java`
- `controller/EventCommentController.java`

### Frontend (2 files)
- `components/CommentSection.jsx` (new)
- `lib/api.js` (updated - added commentsAPI)
- `pages/EventDetailPage.jsx` (updated - integrated CommentSection)

---

**Implementation Date**: October 2025  
**Status**: ✅ Complete and Ready for Testing
