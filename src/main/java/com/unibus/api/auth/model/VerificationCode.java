package com.unibus.api.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Generated;

@Entity
@Table(
   name = "verification_codes"
)
public class VerificationCode {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "verification_code_id"
   )
   private Long id;
   @Column(
      nullable = false,
      length = 100
   )
   private String email;
   @Enumerated(EnumType.STRING)
   @Column(
      nullable = false,
      length = 20
   )
   private VerificationPurpose purpose;
   @Column(
      name = "code_hash",
      nullable = false
   )
   private String codeHash;
   @Column(
      name = "created_at",
      nullable = false
   )
   private OffsetDateTime createdAt;
   @Column(
      name = "expires_at",
      nullable = false
   )
   private OffsetDateTime expiresAt;
   @Column(
      name = "consumed_at"
   )
   private OffsetDateTime consumedAt;
   @Column(
      name = "attempt_count",
      nullable = false
   )
   private int attemptCount;

   @Generated
   public Long getId() {
      return this.id;
   }

   @Generated
   public String getEmail() {
      return this.email;
   }

   @Generated
   public VerificationPurpose getPurpose() {
      return this.purpose;
   }

   @Generated
   public String getCodeHash() {
      return this.codeHash;
   }

   @Generated
   public OffsetDateTime getCreatedAt() {
      return this.createdAt;
   }

   @Generated
   public OffsetDateTime getExpiresAt() {
      return this.expiresAt;
   }

   @Generated
   public OffsetDateTime getConsumedAt() {
      return this.consumedAt;
   }

   @Generated
   public int getAttemptCount() {
      return this.attemptCount;
   }

   @Generated
   public void setId(final Long id) {
      this.id = id;
   }

   @Generated
   public void setEmail(final String email) {
      this.email = email;
   }

   @Generated
   public void setPurpose(final VerificationPurpose purpose) {
      this.purpose = purpose;
   }

   @Generated
   public void setCodeHash(final String codeHash) {
      this.codeHash = codeHash;
   }

   @Generated
   public void setCreatedAt(final OffsetDateTime createdAt) {
      this.createdAt = createdAt;
   }

   @Generated
   public void setExpiresAt(final OffsetDateTime expiresAt) {
      this.expiresAt = expiresAt;
   }

   @Generated
   public void setConsumedAt(final OffsetDateTime consumedAt) {
      this.consumedAt = consumedAt;
   }

   @Generated
   public void setAttemptCount(final int attemptCount) {
      this.attemptCount = attemptCount;
   }
}
