package com.unibus.api.storage;

public record StoredFile(
        String key,
        String fileName,
        String contentType,
        byte[] content) {
}
