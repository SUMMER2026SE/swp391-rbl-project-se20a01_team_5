package com.unibus.api.transport.model;

public enum RouteStatus {
   ACTIVE,
   SUSPENDED,
   CANCELLED;

   // $FF: synthetic method
   private static RouteStatus[] $values() {
      return new RouteStatus[]{ACTIVE, SUSPENDED, CANCELLED};
   }
}
