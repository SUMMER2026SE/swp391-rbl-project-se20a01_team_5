package com.unibus.api.registration.dto;

import com.unibus.api.registration.model.RegistrationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public final class RegistrationDtos {
   private RegistrationDtos() {
   }

   public static record RegistrationRequest(@NotNull Integer routeId, @NotNull Integer boardingStopId, @NotNull Integer alightingStopId, LocalDate effectiveDate) {
   }

   public static record CancellationRequest(@Size(
   max = 500
) String reason) {
   }

   public static record Registration(Integer registrationId, Integer routeId, String routeName, Integer boardingStopId, String boardingStopName, Integer alightingStopId, String alightingStopName, LocalDate effectiveDate, RegistrationStatus status, OffsetDateTime registeredAt) {
   }
}
