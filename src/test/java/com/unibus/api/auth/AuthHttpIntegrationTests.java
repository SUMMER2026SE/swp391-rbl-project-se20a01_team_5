package com.unibus.api.auth;

import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(
   classMode = ClassMode.AFTER_CLASS
)
class AuthHttpIntegrationTests {
   @Autowired
   private MockMvc mockMvc;
   @Autowired
   private HashingService hashingService;
   @Autowired
   private VerificationCodeRepository verificationCodeRepository;
   @Autowired
   private LoginSessionRepository loginSessionRepository;
   @Autowired
   private StudentRepository studentRepository;
   @Autowired
   private UserRepository userRepository;

   @BeforeEach
   void cleanDatabase() {
      this.loginSessionRepository.deleteAll();
      this.verificationCodeRepository.deleteAll();
      this.studentRepository.deleteAll();
      this.userRepository.deleteAll();
   }

   @Test
   void protectsStudentEndpointWithoutToken() throws Exception {
      this.mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/students/me/profile", new Object[0])).andExpect(MockMvcResultMatchers.status().isUnauthorized()).andExpect(MockMvcResultMatchers.jsonPath("$.success", new Object[0]).value(false));
   }

   @Test
   void registersAndLogsInThroughHttpContract() throws Exception {
      this.saveOtp("http.student@example.com", "123456");
      this.mockMvc.perform(((MockHttpServletRequestBuilder)MockMvcRequestBuilders.post("/api/v1/auth/register", new Object[0]).contentType(MediaType.APPLICATION_JSON)).content("{\n  \"email\": \"http.student@example.com\",\n  \"otp\": \"123456\",\n  \"password\": \"strong-password\",\n  \"fullName\": \"HTTP Student\",\n  \"studentCode\": \"HTTP001\",\n  \"university\": \"UniBus University\"\n}\n")).andExpect(MockMvcResultMatchers.status().isCreated()).andExpect(MockMvcResultMatchers.jsonPath("$.data.studentCode", new Object[0]).value("HTTP001"));
      this.mockMvc.perform(((MockHttpServletRequestBuilder)MockMvcRequestBuilders.post("/api/v1/auth/login", new Object[0]).contentType(MediaType.APPLICATION_JSON)).content("{\n  \"email\": \"http.student@example.com\",\n  \"password\": \"strong-password\",\n  \"device\": \"mockmvc\"\n}\n")).andExpect(MockMvcResultMatchers.status().isOk()).andExpect(MockMvcResultMatchers.jsonPath("$.data.tokenType", new Object[0]).value("Bearer")).andExpect(MockMvcResultMatchers.jsonPath("$.data.accessToken", new Object[0]).isNotEmpty()).andExpect(MockMvcResultMatchers.jsonPath("$.data.refreshToken", new Object[0]).isNotEmpty());
   }

   private void saveOtp(String email, String rawCode) {
      OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
      VerificationCode code = new VerificationCode();
      code.setEmail(email);
      code.setPurpose(VerificationPurpose.REGISTER);
      code.setCodeHash(this.hashingService.hash(rawCode));
      code.setCreatedAt(now);
      code.setExpiresAt(now.plusMinutes(10L));
      this.verificationCodeRepository.save(code);
   }
}
