package com.unibus.api.auth.model;

import java.time.OffsetDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VerificationCode {

    private Long id;

    private String email;

    private VerificationPurpose purpose;

    private String codeHash;

    private OffsetDateTime createdAt;

    private OffsetDateTime expiresAt;

    private OffsetDateTime consumedAt;

    private int attemptCount;
}
