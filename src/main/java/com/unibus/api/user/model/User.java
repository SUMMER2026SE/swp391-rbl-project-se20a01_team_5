package com.unibus.api.user.model;

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
   name = "users"
)
public class User {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "user_id"
   )
   private Integer id;
   @Column(
      nullable = false,
      unique = true,
      length = 100
   )
   private String email;
   @Column(
      name = "password_hash",
      nullable = false
   )
   private String passwordHash;
   @Column(
      name = "full_name",
      nullable = false,
      length = 100
   )
   private String fullName;
   @Column(
      name = "phone_number",
      length = 15
   )
   private String phoneNumber;
   private String address;
   @Column(
      name = "avatar_url",
      length = 500
   )
   private String avatarUrl;
   @Enumerated(EnumType.STRING)
   @Column(
      nullable = false,
      length = 20
   )
   private UserRole role;
   @Enumerated(EnumType.STRING)
   @Column(
      nullable = false,
      length = 10
   )
   private UserStatus status;
   @Column(
      name = "lock_reason",
      length = 500
   )
   private String lockReason;
   @Column(
      name = "created_at",
      nullable = false
   )
   private OffsetDateTime createdAt;
   @Column(
      name = "updated_at"
   )
   private OffsetDateTime updatedAt;

   @Generated
   public Integer getId() {
      return this.id;
   }

   @Generated
   public String getEmail() {
      return this.email;
   }

   @Generated
   public String getPasswordHash() {
      return this.passwordHash;
   }

   @Generated
   public String getFullName() {
      return this.fullName;
   }

   @Generated
   public String getPhoneNumber() {
      return this.phoneNumber;
   }

   @Generated
   public String getAddress() {
      return this.address;
   }

   @Generated
   public String getAvatarUrl() {
      return this.avatarUrl;
   }

   @Generated
   public UserRole getRole() {
      return this.role;
   }

   @Generated
   public UserStatus getStatus() {
      return this.status;
   }

   @Generated
   public String getLockReason() {
      return this.lockReason;
   }

   @Generated
   public OffsetDateTime getCreatedAt() {
      return this.createdAt;
   }

   @Generated
   public OffsetDateTime getUpdatedAt() {
      return this.updatedAt;
   }

   @Generated
   public void setId(final Integer id) {
      this.id = id;
   }

   @Generated
   public void setEmail(final String email) {
      this.email = email;
   }

   @Generated
   public void setPasswordHash(final String passwordHash) {
      this.passwordHash = passwordHash;
   }

   @Generated
   public void setFullName(final String fullName) {
      this.fullName = fullName;
   }

   @Generated
   public void setPhoneNumber(final String phoneNumber) {
      this.phoneNumber = phoneNumber;
   }

   @Generated
   public void setAddress(final String address) {
      this.address = address;
   }

   @Generated
   public void setAvatarUrl(final String avatarUrl) {
      this.avatarUrl = avatarUrl;
   }

   @Generated
   public void setRole(final UserRole role) {
      this.role = role;
   }

   @Generated
   public void setStatus(final UserStatus status) {
      this.status = status;
   }

   @Generated
   public void setLockReason(final String lockReason) {
      this.lockReason = lockReason;
   }

   @Generated
   public void setCreatedAt(final OffsetDateTime createdAt) {
      this.createdAt = createdAt;
   }

   @Generated
   public void setUpdatedAt(final OffsetDateTime updatedAt) {
      this.updatedAt = updatedAt;
   }
}
