package com.unibus.api.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.unibus.api.common.ApiException;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private final Path baseDir;

    public LocalFileStorageService(@Value("${app.storage.local-base-dir:uploads}") String baseDir) {
        this.baseDir = Path.of(baseDir).toAbsolutePath().normalize();
    }

    @Override
    public String store(String key, byte[] content, String contentType) {
        String normalizedKey = normalizeKey(key);
        Path destination = resolve(normalizedKey);
        try {
            Files.createDirectories(destination.getParent());
            Files.write(destination, content);
            return normalizedKey;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded file");
        }
    }

    @Override
    public StoredFile load(String key) {
        String normalizedKey = normalizeKey(key);
        Path file = resolve(normalizedKey);
        if (!Files.exists(file) || Files.isDirectory(file)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
        }
        try {
            String contentType = Files.probeContentType(file);
            return new StoredFile(
                    normalizedKey,
                    file.getFileName().toString(),
                    contentType == null ? "application/octet-stream" : contentType,
                    Files.readAllBytes(file));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read uploaded file");
        }
    }

    @Override
    public void delete(String key) {
        String normalizedKey = normalizeKey(key);
        try {
            Files.deleteIfExists(resolve(normalizedKey));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to delete uploaded file");
        }
    }

    private Path resolve(String key) {
        Path resolved = baseDir.resolve(key).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid uploaded file path");
        }
        return resolved;
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
        }

        Path rawPath = Path.of(key);
        if (rawPath.isAbsolute()) {
            Path normalized = rawPath.toAbsolutePath().normalize();
            if (!normalized.startsWith(baseDir)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Uploaded file not found");
            }
            return baseDir.relativize(normalized).toString().replace('\\', '/');
        }

        String cleaned = key.trim().replace('\\', '/');
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }

        String baseAsKey = baseDir.toString().replace('\\', '/');
        String lowerCleaned = cleaned.toLowerCase(Locale.ROOT);
        String lowerBase = baseAsKey.toLowerCase(Locale.ROOT);
        if (lowerCleaned.startsWith(lowerBase + "/")) {
            cleaned = cleaned.substring(baseAsKey.length() + 1);
        }

        Path baseName = baseDir.getFileName();
        if (baseName != null) {
            String baseNamePrefix = baseName.toString().replace('\\', '/') + "/";
            if (cleaned.toLowerCase(Locale.ROOT).startsWith(baseNamePrefix.toLowerCase(Locale.ROOT))) {
                cleaned = cleaned.substring(baseNamePrefix.length());
            }
        }

        Path normalized = Path.of(cleaned).normalize();
        if (normalized.isAbsolute() || normalized.startsWith("..")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid uploaded file path");
        }
        return normalized.toString().replace('\\', '/');
    }
}
