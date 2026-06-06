package com.unibus.api.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.unibus.api.common.ApiException;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String keyPrefix;

    public S3FileStorageService(
            @Value("${app.aws.region:ap-southeast-1}") String region,
            @Value("${app.storage.s3.bucket}") String bucket,
            @Value("${app.storage.s3.prefix:}") String keyPrefix) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("S3_UPLOAD_BUCKET must be configured when STORAGE_PROVIDER=s3");
        }
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
        this.bucket = bucket.trim();
        this.keyPrefix = normalizePrefix(keyPrefix);
    }

    @Override
    public String store(String key, byte[] content, String contentType) {
        String normalizedKey = normalizeKey(key);
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(normalizedKey))
                    .contentType(contentType == null || contentType.isBlank()
                            ? "application/octet-stream"
                            : contentType)
                    .build();
            s3Client.putObject(request, RequestBody.fromBytes(content));
            return normalizedKey;
        } catch (S3Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded file");
        }
    }

    @Override
    public StoredFile load(String key) {
        String normalizedKey = normalizeKey(key);
        try {
            ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(normalizedKey))
                    .build());
            String contentType = response.response().contentType();
            return new StoredFile(
                    normalizedKey,
                    fileName(normalizedKey),
                    contentType == null || contentType.isBlank() ? "application/octet-stream" : contentType,
                    response.asByteArray());
        } catch (NoSuchKeyException exception) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
        } catch (S3Exception exception) {
            if (exception.statusCode() == 404) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
            }
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read uploaded file");
        }
    }

    @Override
    public void delete(String key) {
        String normalizedKey = normalizeKey(key);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(normalizedKey))
                    .build());
        } catch (S3Exception exception) {
            if (exception.statusCode() != 404) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to delete uploaded file");
            }
        }
    }

    private String objectKey(String key) {
        return keyPrefix.isBlank() ? key : keyPrefix + "/" + key;
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        String normalized = prefix.trim().replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
        }
        String normalized = key.trim().replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.startsWith("uploads/")) {
            normalized = normalized.substring("uploads/".length());
        }
        for (String part : normalized.split("/")) {
            if (part.isBlank() || part.equals(".") || part.equals("..")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid uploaded file path");
            }
        }
        return normalized;
    }

    private String fileName(String key) {
        int slash = key.lastIndexOf('/');
        return slash < 0 ? key : key.substring(slash + 1);
    }
}
