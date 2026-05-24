package com.unibus.api.auth.model;

import com.unibus.api.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Generated;

@Entity
@Table(
   name = "login_sessions"
)
public class LoginSession {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "session_id"
   )
   private Long id;
   @ManyToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "user_id",
      nullable = false
   )
   private User user;
   @Column(
      name = "token_hash",
      nullable = false
   )
   private String tokenHash;
   @Column(
      length = 200
   )
   private String device;
   @Column(
      name = "ip_address",
      length = 45
   )
   private String ipAddress;
   @Column(
      name = "signed_in_at",
      nullable = false
   )
   private OffsetDateTime signedInAt;
   @Column(
      name = "expires_at",
      nullable = false
   )
   private OffsetDateTime expiresAt;
   @Column(
      name = "signed_out_at"
   )
   private OffsetDateTime signedOutAt;
   @Column(
      name = "is_active",
      nullable = false
   )
   private boolean active;

   @Generated
   public Long getId() {
      return this.id;
   }

   @Generated
   public User getUser() {
      return this.user;
   }

   @Generated
   public String getTokenHash() {
      return this.tokenHash;
   }

   @Generated
   public String getDevice() {
      return this.device;
   }

   @Generated
   public String getIpAddress() {
      return this.ipAddress;
   }

   @Generated
   public OffsetDateTime getSignedInAt() {
      return this.signedInAt;
   }

   @Generated
   public OffsetDateTime getExpiresAt() {
      return this.expiresAt;
   }

   @Generated
   public OffsetDateTime getSignedOutAt() {
      return this.signedOutAt;
   }

   @Generated
   public boolean isActive() {
      return this.active;
   }

   @Generated
   public void setId(final Long id) {
      this.id = id;
   }

   @Generated
   public void setUser(final User user) {
      this.user = user;
   }

   @Generated
   public void setTokenHash(final String tokenHash) {
      this.tokenHash = tokenHash;
   }

   @Generated
   public void setDevice(final String device) {
      this.device = device;
   }

   @Generated
   public void setIpAddress(final String ipAddress) {
      this.ipAddress = ipAddress;
   }

   @Generated
   public void setSignedInAt(final OffsetDateTime signedInAt) {
      this.signedInAt = signedInAt;
   }

   @Generated
   public void setExpiresAt(final OffsetDateTime expiresAt) {
      this.expiresAt = expiresAt;
   }

   @Generated
   public void setSignedOutAt(final OffsetDateTime signedOutAt) {
      this.signedOutAt = signedOutAt;
   }

   @Generated
   public void setActive(final boolean active) {
      this.active = active;
   }
}
