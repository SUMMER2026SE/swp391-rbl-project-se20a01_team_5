package com.unibus.api.common;

public record ApiResponse<T>(boolean success, String message, T data) {
   public static <T> ApiResponse<T> ok(String message, T data) {
      return new ApiResponse<T>(true, message, data);
   }
}
