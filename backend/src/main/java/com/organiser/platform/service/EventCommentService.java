package com.organiser.platform.service;

import com.organiser.platform.dto.CommentDTO;
import com.organiser.platform.dto.CreateCommentRequest;
import com.organiser.platform.dto.CreateReplyRequest;
import com.organiser.platform.dto.ReplyDTO;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.EventComment;
import com.organiser.platform.model.EventCommentReply;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EventCommentReplyRepository;
import com.organiser.platform.repository.EventCommentRepository;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventCommentService {
    
    private final EventCommentRepository commentRepository;
    private final EventCommentReplyRepository replyRepository;
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final GroupService groupService;
    
    /**
     * Get all comments for an event with their replies
     * Requires group membership to view
     */
    @Transactional(readOnly = true)
    public List<CommentDTO> getEventComments(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Check if user is a member of the group
        if (memberId == null || !groupService.isMemberOfGroup(memberId, event.getGroup().getId())) {
            throw new RuntimeException("Access denied. You must be a member of the group to view comments.");
        }
        
        List<EventComment> comments = commentRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        return comments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new comment on an event
     * Requires group membership
     */
    @Transactional
    public CommentDTO createComment(Long eventId, CreateCommentRequest request, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Check if user is a member of the group
        if (!groupService.isMemberOfGroup(memberId, event.getGroup().getId())) {
            throw new RuntimeException("Access denied. You must be a member of the group to comment.");
        }
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        EventComment comment = EventComment.builder()
                .event(event)
                .member(member)
                .content(request.getContent())
                .edited(false)
                .build();
        
        EventComment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }
    
    /**
     * Update an existing comment
     */
    @Transactional
    public CommentDTO updateComment(Long commentId, CreateCommentRequest request, Long memberId) {
        EventComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Verify that the member is the author of the comment
        if (!comment.getMember().getId().equals(memberId)) {
            throw new RuntimeException("You can only edit your own comments");
        }
        
        comment.setContent(request.getContent());
        comment.setEdited(true);
        
        EventComment updatedComment = commentRepository.save(comment);
        return convertToDTO(updatedComment);
    }
    
    /**
     * Delete a comment
     */
    @Transactional
    public void deleteComment(Long commentId, Long memberId) {
        EventComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Verify that the member is the author of the comment
        if (!comment.getMember().getId().equals(memberId)) {
            throw new RuntimeException("You can only delete your own comments");
        }
        
        commentRepository.delete(comment);
    }
    
    /**
     * Create a reply to a comment
     */
    @Transactional
    public ReplyDTO createReply(Long commentId, CreateReplyRequest request, Long memberId) {
        EventComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        EventCommentReply reply = EventCommentReply.builder()
                .comment(comment)
                .member(member)
                .content(request.getContent())
                .edited(false)
                .build();
        
        EventCommentReply savedReply = replyRepository.save(reply);
        return convertReplyToDTO(savedReply);
    }
    
    /**
     * Update a reply
     */
    @Transactional
    public ReplyDTO updateReply(Long replyId, CreateReplyRequest request, Long memberId) {
        EventCommentReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        
        // Verify that the member is the author of the reply
        if (!reply.getMember().getId().equals(memberId)) {
            throw new RuntimeException("You can only edit your own replies");
        }
        
        reply.setContent(request.getContent());
        reply.setEdited(true);
        
        EventCommentReply updatedReply = replyRepository.save(reply);
        return convertReplyToDTO(updatedReply);
    }
    
    /**
     * Delete a reply
     */
    @Transactional
    public void deleteReply(Long replyId, Long memberId) {
        EventCommentReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        
        // Verify that the member is the author of the reply
        if (!reply.getMember().getId().equals(memberId)) {
            throw new RuntimeException("You can only delete your own replies");
        }
        
        replyRepository.delete(reply);
    }
    
    /**
     * Convert EventComment entity to CommentDTO
     */
    private CommentDTO convertToDTO(EventComment comment) {
        List<ReplyDTO> replies = comment.getReplies().stream()
                .map(this::convertReplyToDTO)
                .collect(Collectors.toList());
        
        return CommentDTO.builder()
                .id(comment.getId())
                .eventId(comment.getEvent().getId())
                .memberId(comment.getMember().getId())
                .memberName(comment.getMember().getDisplayName() != null 
                        ? comment.getMember().getDisplayName() 
                        : comment.getMember().getEmail().split("@")[0])
                .memberEmail(comment.getMember().getEmail())
                .memberPhotoUrl(comment.getMember().getProfilePhotoUrl())
                .content(comment.getContent())
                .edited(comment.getEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replyCount(comment.getReplyCount())
                .replies(replies)
                .build();
    }
    
    /**
     * Convert EventCommentReply entity to ReplyDTO
     */
    private ReplyDTO convertReplyToDTO(EventCommentReply reply) {
        return ReplyDTO.builder()
                .id(reply.getId())
                .commentId(reply.getComment().getId())
                .memberId(reply.getMember().getId())
                .memberName(reply.getMember().getDisplayName() != null 
                        ? reply.getMember().getDisplayName() 
                        : reply.getMember().getEmail().split("@")[0])
                .memberEmail(reply.getMember().getEmail())
                .memberPhotoUrl(reply.getMember().getProfilePhotoUrl())
                .content(reply.getContent())
                .edited(reply.getEdited())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .build();
    }
}
