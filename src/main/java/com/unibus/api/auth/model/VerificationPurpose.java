package com.unibus.api.auth.model;

public enum VerificationPurpose {
   REGISTER,
   RESET_PASSWORD;

   // $FF: synthetic method
   private static VerificationPurpose[] $values() {
      return new VerificationPurpose[]{REGISTER, RESET_PASSWORD};
   }
}
