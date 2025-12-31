-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_event_id BIGINT,
    related_group_id BIGINT,
    related_comment_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT fk_notification_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_event FOREIGN KEY (related_event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_group FOREIGN KEY (related_group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_comment FOREIGN KEY (related_comment_id) REFERENCES event_comments(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_member ON notifications(member_id);
CREATE INDEX idx_notification_type ON notifications(notification_type);
CREATE INDEX idx_notification_is_read ON notifications(is_read);
CREATE INDEX idx_notification_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_member_unread ON notifications(member_id, is_read) WHERE is_read = FALSE;

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for events and comments';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: NEW_EVENT, NEW_COMMENT, EVENT_UPDATE, etc.';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
