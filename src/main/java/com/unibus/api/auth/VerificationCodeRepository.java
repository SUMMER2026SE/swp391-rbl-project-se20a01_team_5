package com.unibus.api.auth;

import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
   Optional<VerificationCode> findTopByEmailIgnoreCaseAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(String email, VerificationPurpose purpose);
}
