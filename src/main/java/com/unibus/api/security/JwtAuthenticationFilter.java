package com.unibus.api.security;

import com.unibus.api.auth.JwtTokenService;
import com.unibus.api.auth.LoginSessionRepository;
import com.unibus.api.auth.model.LoginSession;
import com.unibus.api.common.ApiException;
import com.unibus.api.user.model.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
   private final JwtTokenService jwtTokenService;
   private final LoginSessionRepository loginSessionRepository;

   public JwtAuthenticationFilter(JwtTokenService jwtTokenService, LoginSessionRepository loginSessionRepository) {
      this.jwtTokenService = jwtTokenService;
      this.loginSessionRepository = loginSessionRepository;
   }

   protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
      String authorization = request.getHeader("Authorization");
      if (authorization != null && authorization.startsWith("Bearer ")) {
         this.authenticate(authorization.substring(7));
      }

      filterChain.doFilter(request, response);
   }

   private void authenticate(String token) {
      try {
         JwtTokenService.TokenClaims claims = this.jwtTokenService.parseAccessToken(token);
         LoginSession session = this.loginSessionRepository.findByIdAndActiveTrue(claims.sessionId()).orElse(null);
         if (session == null || !session.getUser().getId().equals(claims.userId()) || session.getUser().getStatus() != UserStatus.ACTIVE || session.getExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            return;
         }

         CurrentUser currentUser = new CurrentUser(session.getUser().getId(), session.getUser().getEmail(), session.getUser().getRole(), session.getId());
         UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(currentUser, (Object)null, List.of(new SimpleGrantedAuthority("ROLE_" + currentUser.role().name())));
         SecurityContextHolder.getContext().setAuthentication(authentication);
      } catch (ApiException var6) {
         SecurityContextHolder.clearContext();
      }

   }
}
