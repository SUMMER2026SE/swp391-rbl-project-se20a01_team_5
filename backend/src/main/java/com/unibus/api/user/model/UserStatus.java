package com.unibus.api.user.model;

public enum UserStatus {
   ACTIVE,
   LOCKED;

   // $FF: synthetic method
   private static UserStatus[] $values() {
      return new UserStatus[]{ACTIVE, LOCKED};
   }
}
