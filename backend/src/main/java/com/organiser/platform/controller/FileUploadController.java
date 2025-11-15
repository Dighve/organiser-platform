package com.organiser.platform.controller;

import com.organiser.platform.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload an event feature photo
     * @param file The image file to upload
     * @param authentication User authentication
     * @return Response with the uploaded image URL
     */
    @PostMapping(value = "/upload/event-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadEventPhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            log.info("Received file upload request: {} (size: {} bytes)", 
                    file.getOriginalFilename(), file.getSize());

            // Upload to Cloudinary in "events" folder
            String imageUrl = fileUploadService.uploadImage(file, "hikehub/events");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imageUrl", imageUrl);
            response.put("message", "Image uploaded successfully");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to upload file", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error during file upload", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Upload a group banner photo
     * @param file The image file to upload
     * @param authentication User authentication
     * @return Response with the uploaded image URL
     */
    @PostMapping(value = "/upload/group-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadGroupBanner(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            log.info("Received group banner upload request: {} (size: {} bytes)", 
                    file.getOriginalFilename(), file.getSize());

            // Upload to Cloudinary in "groups" folder
            String imageUrl = fileUploadService.uploadImage(file, "hikehub/groups");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imageUrl", imageUrl);
            response.put("message", "Group banner uploaded successfully");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to upload group banner", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error during group banner upload", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Delete an image
     * @param imageUrl The URL of the image to delete
     * @param authentication User authentication
     * @return Response indicating success or failure
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteImage(
            @RequestParam("imageUrl") String imageUrl,
            Authentication authentication
    ) {
        try {
            fileUploadService.deleteImage(imageUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Image deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete image", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete image");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
