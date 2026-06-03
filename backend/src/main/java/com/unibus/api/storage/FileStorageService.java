package com.unibus.api.storage;

public interface FileStorageService {

    String store(String key, byte[] content, String contentType);

    StoredFile load(String key);

    void delete(String key);
}
