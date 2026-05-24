package com.unibus.api.user.model;

public enum UserRole {
   STUDENT,
   DRIVER,
   CONDUCTOR,
   DISPATCHER,
   ADMIN;

   // $FF: synthetic method
   private static UserRole[] $values() {
      return new UserRole[]{STUDENT, DRIVER, CONDUCTOR, DISPATCHER, ADMIN};
   }
}
