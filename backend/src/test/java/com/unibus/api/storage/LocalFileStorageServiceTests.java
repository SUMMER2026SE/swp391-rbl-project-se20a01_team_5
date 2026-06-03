package com.unibus.api.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;

import com.unibus.api.common.ApiException;

class LocalFileStorageServiceTests {

    @TempDir
    private Path tempDir;

    @Test
    void storesLoadsAndDeletesFileByRelativeKey() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());

        String key = storage.store("student-verifications/card.jpg", "image-bytes".getBytes(), "image/jpeg");
        StoredFile loaded = storage.load(key);

        assertThat(key).isEqualTo("student-verifications/card.jpg");
        assertThat(loaded.fileName()).isEqualTo("card.jpg");
        assertThat(loaded.contentType()).isEqualTo("image/jpeg");
        assertThat(new String(loaded.content())).isEqualTo("image-bytes");

        storage.delete(key);
        assertThatThrownBy(() -> storage.load(key))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void acceptsLegacyPathInsideConfiguredBaseDirectory() throws Exception {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());
        Path legacyFile = tempDir.resolve("profile-avatars/user-7.jpg");
        Files.createDirectories(legacyFile.getParent());
        Files.writeString(legacyFile, "legacy-avatar");

        StoredFile loaded = storage.load(legacyFile.toString());

        assertThat(loaded.key()).isEqualTo("profile-avatars/user-7.jpg");
        assertThat(new String(loaded.content())).isEqualTo("legacy-avatar");
    }

    @Test
    void rejectsPathTraversal() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());

        assertThatThrownBy(() -> storage.store("../outside.jpg", new byte[] { 1 }, "image/jpeg"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
