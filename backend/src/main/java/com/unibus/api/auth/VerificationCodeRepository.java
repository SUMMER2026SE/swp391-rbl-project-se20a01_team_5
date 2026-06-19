package com.unibus.api.auth;

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

    private final AtomicLong sequence = new AtomicLong(1);
    private final ConcurrentMap<Long, VerificationCode> codes = new ConcurrentHashMap<>();

    public VerificationCode save(VerificationCode code) {
        if (code.getId() == null) {
            code.setId(sequence.getAndIncrement());
        }
        codes.put(code.getId(), code);
        return code;
    }

    public Optional<VerificationCode> findById(Long id) {
        return Optional.ofNullable(codes.get(id));
    }

    public List<VerificationCode> findAll() {
        return codes.values().stream()
                .sorted(Comparator.comparing(VerificationCode::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public long count() {
        return codes.size();
    }

    public void deleteAll() {
        codes.clear();
    }

    public Optional<VerificationCode> findTopByEmailIgnoreCaseAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email,
            VerificationPurpose purpose) {
        return codes.values().stream()
                .filter(code -> code.getConsumedAt() == null)
                .filter(code -> code.getPurpose() == purpose)
                .filter(code -> code.getEmail() != null && code.getEmail().equalsIgnoreCase(email))
                .max(Comparator.comparing(VerificationCode::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    }
}
