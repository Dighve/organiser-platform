CREATE TABLE member_setting (
    member_id   BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    key         VARCHAR(100) NOT NULL,
    value       VARCHAR(255) NOT NULL,
    PRIMARY KEY (member_id, key)
);

CREATE INDEX idx_member_setting_member_id ON member_setting(member_id);
