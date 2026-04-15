package com.organiser.platform.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberSettingId implements Serializable {

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "key", length = 100)
    private String key;
}
