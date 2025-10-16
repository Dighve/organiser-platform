package com.organiser.platform.service;

import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {
    
    private final MemberRepository memberRepository;
    
    @Transactional
    public Member promoteToOrganiser(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (Boolean.TRUE.equals(member.getIsOrganiser())) {
            throw new RuntimeException("Member is already an organiser");
        }
        
        member.setIsOrganiser(true);
        return memberRepository.save(member);
    }
    
    public Member getMemberById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }
}
