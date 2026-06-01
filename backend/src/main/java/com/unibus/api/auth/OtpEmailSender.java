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
        return """
                <!doctype html>
                <html lang="vi">
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                  </head>
                  <body style="margin:0;background:#f9fafb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                            <tr>
                              <td style="background:#111827;padding:32px;">
                                <div style="font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">UniBus</div>
                                <div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:900;color:#ffffff;">Mã xác thực OTP</div>
                                <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#d1d5db;">Dùng mã bên dưới để %s.</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:32px;">
                                <div style="font-size:14px;line-height:1.7;color:#4b5563;font-weight:600;">Mã xác thực của bạn là:</div>
                                <div style="margin:16px 0 20px;padding:24px;border-radius:16px;background:#f3f4f6;text-align:center;">
                                  <span style="font-family:JetBrains Mono,Consolas,monospace;font-size:36px;letter-spacing:0.3em;font-weight:900;color:#111827;">%s</span>
                                </div>
                                <div style="font-size:14px;line-height:1.7;color:#4b5563;">
                                  Mã này có hiệu lực trong <strong>%d phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo mật tài khoản.
                                </div>
                                <div style="margin-top:24px;padding:16px;border-radius:12px;background:#fef2f2;color:#991b1b;font-size:13px;line-height:1.6;font-weight:500;">
                                  Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này một cách an toàn.
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:20px 32px;background:#ffffff;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;line-height:1.5;">
                                Email này được gửi tự động từ hệ thống UniBus. Vui lòng không trả lời email này.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(action, code, expirationMinutes);
    }
}
