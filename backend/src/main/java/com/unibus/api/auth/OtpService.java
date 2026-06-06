package com.unibus.api.auth;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;

@Service
public class OtpService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OtpService.class);
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationCodeRepository verificationCodeRepository;
    private final HashingService hashingService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long expirationMinutes;
    private final boolean logCode;
    private final OtpEmailSender otpEmailSender;

    public OtpService(
            VerificationCodeRepository verificationCodeRepository,
            HashingService hashingService,
            @Value("${app.otp.expiration-minutes}") long expirationMinutes,
            @Value("${app.otp.log-code}") boolean logCode,
            OtpEmailSender otpEmailSender) {
        this.verificationCodeRepository = verificationCodeRepository;
        this.hashingService = hashingService;
        this.expirationMinutes = expirationMinutes;
        this.logCode = logCode;
        this.otpEmailSender = otpEmailSender;
    }

    @Transactional
    public void issue(String rawEmail, VerificationPurpose purpose) {
        String email = rawEmail.trim().toLowerCase();
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setPurpose(purpose);
        verificationCode.setCodeHash(hashingService.hash(code));
        verificationCode.setCreatedAt(now);
        verificationCode.setExpiresAt(now.plusMinutes(expirationMinutes));
        verificationCodeRepository.save(verificationCode);
        otpEmailSender.send(email, purpose, code);
        if (logCode) {
            LOGGER.info("DEV OTP purpose={} email={} code={}", purpose, email, code);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = ApiException.class)
    public void verify(String rawEmail, VerificationPurpose purpose, String code) {
        String email = rawEmail.trim().toLowerCase();
        VerificationCode verificationCode = verificationCodeRepository
                .findTopByEmailIgnoreCaseAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> invalidOtp());
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        verificationCode.setAttemptCount(verificationCode.getAttemptCount() + 1);
        if (verificationCode.getExpiresAt().isBefore(now)
                || verificationCode.getAttemptCount() > MAX_ATTEMPTS
                || !verificationCode.getCodeHash().equals(hashingService.hash(code))) {
            verificationCodeRepository.save(verificationCode);
            throw invalidOtp();
        }
        verificationCode.setConsumedAt(now);
        verificationCodeRepository.save(verificationCode);
    }

    private ApiException invalidOtp() {
        return new ApiException(HttpStatus.BAD_REQUEST, "OTP is invalid or expired");
    }
}
