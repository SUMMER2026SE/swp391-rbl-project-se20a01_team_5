package com.unibus.api.auth;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Repository;

import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;

@Repository
public class VerificationCodeRepository {

    private final AtomicLong ids = new AtomicLong(0);
    private final ConcurrentMap<Long, VerificationCode> storage = new ConcurrentHashMap<>();

    public VerificationCode save(VerificationCode code) {
        if (code.getId() == null) {
            code.setId(ids.incrementAndGet());
        }
        storage.put(code.getId(), copy(code));
        return copy(code);
    }

    public Optional<VerificationCode> findById(Long id) {
        return Optional.ofNullable(storage.get(id)).map(this::copy);
    }

    public List<VerificationCode> findAll() {
        return storage.values().stream()
                .sorted(Comparator.comparing(VerificationCode::getId))
                .map(this::copy)
                .toList();
    }

    public long count() {
        return storage.size();
    }

    public void deleteAll() {
        storage.clear();
    }

    public Optional<VerificationCode> findTopByEmailIgnoreCaseAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email, VerificationPurpose purpose) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        OffsetDateTime minCreatedAt = OffsetDateTime.MIN;
        return storage.values().stream()
                .filter(code -> code.getEmail() != null && code.getEmail().trim().equalsIgnoreCase(normalizedEmail))
                .filter(code -> code.getPurpose() == purpose)
                .filter(code -> code.getConsumedAt() == null)
                .max(Comparator.comparing(
                        code -> code.getCreatedAt() == null ? minCreatedAt : code.getCreatedAt()))
                .map(this::copy);
    }

    private VerificationCode copy(VerificationCode source) {
        VerificationCode copy = new VerificationCode();
        copy.setId(source.getId());
        copy.setEmail(source.getEmail());
        copy.setPurpose(source.getPurpose());
        copy.setCodeHash(source.getCodeHash());
        copy.setCreatedAt(source.getCreatedAt());
        copy.setExpiresAt(source.getExpiresAt());
        copy.setConsumedAt(source.getConsumedAt());
        copy.setAttemptCount(source.getAttemptCount());
        return copy;
    }
}
