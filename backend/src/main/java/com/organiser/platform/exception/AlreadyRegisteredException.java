package com.organiser.platform.exception;

/**
 * Exception thrown when a user tries to register for an event they're already registered for.
 * This is not an error condition - it's expected behavior when users click "Join" multiple times
 * or refresh the page after joining.
 */
public class AlreadyRegisteredException extends RuntimeException {
    
    public AlreadyRegisteredException(String message) {
        super(message);
    }
    
    public AlreadyRegisteredException(String message, Throwable cause) {
        super(message, cause);
    }
}
