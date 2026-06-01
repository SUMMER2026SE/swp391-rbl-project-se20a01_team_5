package com.unibus.api.auth;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class OtpEmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(OtpEmailSender.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;
    private final String fromName;
    private final long expirationMinutes;

    public OtpEmailSender(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.enabled}") boolean enabled,
            @Value("${app.mail.from}") String from,
            @Value("${app.mail.from-name}") String fromName,
            @Value("${app.otp.expiration-minutes}") long expirationMinutes) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from == null ? "" : from.trim();
        this.fromName = fromName == null || fromName.isBlank() ? "UniBus" : fromName.trim();
        this.expirationMinutes = expirationMinutes;
    }

    public void send(String email, VerificationPurpose purpose, String code) {
        if (!enabled) {
            LOGGER.debug("SMTP email is disabled; OTP email was not sent to {}", email);
            return;
        }
        if (from.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "OTP email sender is not configured");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "OTP email sender is not available");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(from, fromName);
            helper.setTo(email);
            helper.setSubject(subject(purpose));
            helper.setText(textBody(purpose, code), htmlBody(purpose, code));
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            LOGGER.warn("Unable to send OTP email to {}", email, exception);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to send OTP email");
        } catch (java.io.UnsupportedEncodingException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "OTP email sender name is invalid");
        }
    }

    private String subject(VerificationPurpose purpose) {
        return switch (purpose) {
            case REGISTER -> "Mã OTP đăng ký UniBus";
            case RESET_PASSWORD -> "Mã OTP đặt lại mật khẩu UniBus";
        };
    }

    private String actionText(VerificationPurpose purpose) {
        return switch (purpose) {
            case REGISTER -> "hoàn tất đăng ký tài khoản";
            case RESET_PASSWORD -> "đặt lại mật khẩu";
        };
    }

    private String textBody(VerificationPurpose purpose, String code) {
        return """
                Mã OTP UniBus của bạn là: %s

                Dùng mã này để %s. Mã có hiệu lực trong %d phút.
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
                """.formatted(code, actionText(purpose), expirationMinutes);
    }

    private String htmlBody(VerificationPurpose purpose, String code) {
        String action = actionText(purpose);
        // Insert spaces between characters for the UNiDAYS look (e.g., "1 2 3 4 5 6")
        String spacedCode = String.join(" ", code.split(""));
        
        return """
                <!doctype html>
                <html lang="vi">
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                  </head>
                  <body style="margin:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;text-align:center;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
                      <tr>
                        <td align="center" style="padding:60px 20px;">
                          <div style="max-width:600px;margin:0 auto;">
                            <!-- Logo / Brand -->
                            <div style="font-size:32px;font-weight:900;letter-spacing:-0.02em;margin-bottom:24px;color:#000000;">
                              UniBus
                            </div>
                            
                            <!-- Title -->
                            <div style="font-size:22px;font-weight:700;margin-bottom:40px;color:#000000;">
                              Mã xác thực OTP
                            </div>
                            
                            <!-- Code -->
                            <div style="font-size:48px;font-weight:500;color:#1d4ed8;margin:40px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:4px;">
                              %s
                            </div>
                            
                            <!-- Instructions -->
                            <div style="font-size:16px;color:#4b5563;line-height:1.6;margin-bottom:40px;">
                              Dùng mã này để %s.<br>
                              Mã sẽ hết hạn trong %d phút.
                            </div>
                            
                            <!-- Divider -->
                            <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px auto;max-width:400px;">
                            
                            <!-- Footer -->
                            <div style="font-size:14px;color:#6b7280;line-height:1.6;">
                              Nếu bạn cần hỗ trợ về tài khoản UniBus, vui lòng liên hệ <a href="mailto:support@unibus.vn" style="color:#1d4ed8;text-decoration:underline;">bộ phận hỗ trợ</a>.
                              <br><br>
                              <span style="font-size:12px;color:#9ca3af;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email một cách an toàn.</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(spacedCode, action, expirationMinutes);
    }
}
