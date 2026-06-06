package com.unibus.api.registration.model;

public enum RegistrationStatus {
   PENDING,
   APPROVED,
   CANCELLED;

   // $FF: synthetic method
   private static RegistrationStatus[] $values() {
      return new RegistrationStatus[]{PENDING, APPROVED, CANCELLED};
   }
}
