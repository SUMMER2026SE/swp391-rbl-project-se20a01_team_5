package com.unibus.api.auth;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;

/**
 * Dual-mode repository: persists to {@code verification_codes} table when JdbcTemplate
 * is available (production), falls back to an in-memory store when the table is absent
 * (e.g., unit tests with H2 in create-drop mode without Flyway).
 *
 * <p>This keeps OTP challenges across application restarts in production while
 * preserving the test-friendly behavior that the original in-memory implementation
 * provided.
 */
@Repository
public class VerificationCodeRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationCodeRepository.class);

    private final JdbcTemplate jdbcTemplate;
    private final AtomicLong sequence = new AtomicLong(1);
    private final ConcurrentMap<Long, VerificationCode> codes = new ConcurrentHashMap<>();
    private final boolean persistent;

    public VerificationCodeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.persistent = detectPersistenceSupport();
        if (persistent) {
            LOGGER.info("VerificationCodeRepository: persistent mode (verification_codes table detected)");
        } else {
            LOGGER.warn("VerificationCodeRepository: in-memory fallback mode "
                    + "(verification_codes table not present - OTPs will not survive restart)");
        }
    }

    private boolean detectPersistenceSupport() {
        try {
            jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables "
                            + "WHERE table_name = 'verification_codes'",
                    Integer.class);
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables "
                            + "WHERE table_name = 'verification_codes'",
                    Integer.class);
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }

    public VerificationCode save(VerificationCode code) {
        if (persistent) {
            return savePersistent(code);
        }
        if (code.getId() == null) {
            code.setId(sequence.getAndIncrement());
        }
        codes.put(code.getId(), code);
        return code;
    }

    private VerificationCode savePersistent(VerificationCode code) {
        if (code.getId() == null) {
            Long id = jdbcTemplate.queryForObject(
                    "INSERT INTO verification_codes (email, purpose, code_hash, created_at, expires_at, consumed_at, attempt_count) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING verification_code_id",
                    Long.class,
                    code.getEmail(),
                    code.getPurpose().name(),
                    code.getCodeHash(),
                    Timestamp.from(code.getCreatedAt().toInstant()),
                    Timestamp.from(code.getExpiresAt().toInstant()),
                    code.getConsumedAt() == null ? null : Timestamp.from(code.getConsumedAt().toInstant()),
                    code.getAttemptCount());
            code.setId(id);
        } else {
            jdbcTemplate.update(
                    "UPDATE verification_codes SET email = ?, purpose = ?, code_hash = ?, created_at = ?, "
                            + "expires_at = ?, consumed_at = ?, attempt_count = ? WHERE verification_code_id = ?",
                    code.getEmail(),
                    code.getPurpose().name(),
                    code.getCodeHash(),
                    Timestamp.from(code.getCreatedAt().toInstant()),
                    Timestamp.from(code.getExpiresAt().toInstant()),
                    code.getConsumedAt() == null ? null : Timestamp.from(code.getConsumedAt().toInstant()),
                    code.getAttemptCount(),
                    code.getId());
        }
        return code;
    }

    public Optional<VerificationCode> findById(Long id) {
        if (persistent) {
            try {
                return Optional.ofNullable(jdbcTemplate.queryForObject(
                        "SELECT verification_code_id, email, purpose, code_hash, created_at, expires_at, consumed_at, attempt_count "
                                + "FROM verification_codes WHERE verification_code_id = ?",
                        (rs, rowNum) -> mapRow(rs),
                        id));
            } catch (EmptyResultDataAccessException ex) {
                return Optional.empty();
            }
        }
        return Optional.ofNullable(codes.get(id));
    }

    public List<VerificationCode> findAll() {
        if (persistent) {
            return jdbcTemplate.query(
                    "SELECT verification_code_id, email, purpose, code_hash, created_at, expires_at, consumed_at, attempt_count "
                            + "FROM verification_codes ORDER BY created_at",
                    (rs, rowNum) -> mapRow(rs));
        }
        return codes.values().stream()
                .sorted(Comparator.comparing(VerificationCode::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public long count() {
        if (persistent) {
            Long c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM verification_codes", Long.class);
            return c == null ? 0 : c;
        }
        return codes.size();
    }

    public void deleteAll() {
        if (persistent) {
            jdbcTemplate.update("DELETE FROM verification_codes");
            return;
        }
        codes.clear();
    }

    public Optional<VerificationCode> findTopByEmailIgnoreCaseAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email,
            VerificationPurpose purpose) {
        if (persistent) {
            try {
                return Optional.ofNullable(jdbcTemplate.queryForObject(
                        "SELECT verification_code_id, email, purpose, code_hash, created_at, expires_at, consumed_at, attempt_count "
                                + "FROM verification_codes "
                                + "WHERE LOWER(email) = LOWER(?) AND purpose = ? AND consumed_at IS NULL "
                                + "ORDER BY created_at DESC LIMIT 1",
                        (rs, rowNum) -> mapRow(rs),
                        email, purpose.name()));
            } catch (EmptyResultDataAccessException ex) {
                return Optional.empty();
            }
        }
        return codes.values().stream()
                .filter(code -> code.getConsumedAt() == null)
                .filter(code -> code.getPurpose() == purpose)
                .filter(code -> code.getEmail() != null && code.getEmail().equalsIgnoreCase(email))
                .max(Comparator.comparing(VerificationCode::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private VerificationCode mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        VerificationCode code = new VerificationCode();
        code.setId(rs.getLong("verification_code_id"));
        code.setEmail(rs.getString("email"));
        code.setPurpose(VerificationPurpose.valueOf(rs.getString("purpose")));
        code.setCodeHash(rs.getString("code_hash"));
        code.setCreatedAt(toOffsetDateTime(rs.getTimestamp("created_at")));
        code.setExpiresAt(toOffsetDateTime(rs.getTimestamp("expires_at")));
        code.setConsumedAt(toOffsetDateTime(rs.getTimestamp("consumed_at")));
        code.setAttemptCount(rs.getInt("attempt_count"));
        return code;
    }

    private OffsetDateTime toOffsetDateTime(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}
