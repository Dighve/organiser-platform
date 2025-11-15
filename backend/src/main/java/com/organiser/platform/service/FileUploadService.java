package com.organiser.platform.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final Cloudinary cloudinary;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"};

    /**
     * Upload an image file to Cloudinary
     * @param file The multipart file to upload
     * @param folder The folder in Cloudinary where the image will be stored
     * @return The public URL of the uploaded image
     * @throws IOException if upload fails
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        // Validate file
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String publicId = folder + "/" + UUID.randomUUID().toString();

        log.info("Uploading image to Cloudinary: {} (size: {} bytes)", originalFilename, file.getSize());

        try {
            // Upload to Cloudinary with automatic optimization
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "folder", folder,
                            "resource_type", "image",
                            "quality", "auto:good"
                    ));

            String imageUrl = (String) uploadResult.get("secure_url");
            log.info("Image uploaded successfully: {}", imageUrl);
            return imageUrl;

        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new IOException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    /**
     * Delete an image from Cloudinary
     * @param imageUrl The URL of the image to delete
     */
    public void deleteImage(String imageUrl) {
        try {
            // Extract public ID from URL
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Image deleted from Cloudinary: {} - Result: {}", publicId, result.get("result"));
            }
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary: {}", imageUrl, e);
            // Don't throw exception - deletion failure shouldn't block other operations
        }
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IOException("File size exceeds maximum allowed size of 10MB");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new IOException("Invalid filename");
        }

        String extension = getFileExtension(filename);
        if (!isValidExtension(extension)) {
            throw new IOException("Invalid file type. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Check if file extension is allowed
     */
    private boolean isValidExtension(String extension) {
        for (String allowed : ALLOWED_EXTENSIONS) {
            if (allowed.equalsIgnoreCase(extension)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract public ID from Cloudinary URL
     * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
     * Returns: folder/image
     */
    private String extractPublicIdFromUrl(String imageUrl) {
        try {
            if (imageUrl == null || !imageUrl.contains("cloudinary.com")) {
                return null;
            }
            
            // Split by /upload/ to get the part after version
            String[] parts = imageUrl.split("/upload/");
            if (parts.length < 2) {
                return null;
            }
            
            // Get the part after version (v1234567890/folder/image.jpg)
            String afterUpload = parts[1];
            
            // Remove version prefix (v1234567890/)
            int firstSlash = afterUpload.indexOf('/');
            if (firstSlash != -1) {
                afterUpload = afterUpload.substring(firstSlash + 1);
            }
            
            // Remove file extension
            int lastDot = afterUpload.lastIndexOf('.');
            if (lastDot != -1) {
                afterUpload = afterUpload.substring(0, lastDot);
            }
            
            return afterUpload;
        } catch (Exception e) {
            log.error("Failed to extract public ID from URL: {}", imageUrl, e);
            return null;
        }
    }
}
