package com.unibus.api.security;

import com.unibus.api.common.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
   @Bean
   PasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder();
   }

   @Bean
   SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) throws Exception {
      return (SecurityFilterChain)httpSecurity.csrf((csrf) -> csrf.disable()).sessionManagement((session) -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests((authorize) -> ((AuthorizeHttpRequestsConfigurer.AuthorizedUrl)((AuthorizeHttpRequestsConfigurer.AuthorizedUrl)authorize.requestMatchers(new String[]{"/api/v1/auth/register/**", "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/forgot-password/**", "/error"})).permitAll().anyRequest()).authenticated()).exceptionHandling((exceptions) -> exceptions.authenticationEntryPoint((request, response, exception) -> writeError(response, objectMapper, HttpStatus.UNAUTHORIZED, "Authentication required")).accessDeniedHandler((request, response, exception) -> writeError(response, objectMapper, HttpStatus.FORBIDDEN, "Access denied"))).addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class).build();
   }

   private static void writeError(HttpServletResponse response, ObjectMapper objectMapper, HttpStatus status, String message) throws IOException {
      response.setStatus(status.value());
      response.setContentType("application/json");
      objectMapper.writeValue(response.getWriter(), new ApiResponse(false, message, (Object)null));
   }
}
