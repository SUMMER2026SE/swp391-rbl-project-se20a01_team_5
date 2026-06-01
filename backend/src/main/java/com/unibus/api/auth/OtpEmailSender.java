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
            case REGISTER -> "Ma OTP dang ky UniBus";
            case RESET_PASSWORD -> "Ma OTP dat lai mat khau UniBus";
        };
    }

    private String actionText(VerificationPurpose purpose) {
        return switch (purpose) {
            case REGISTER -> "hoan tat dang ky tai khoan";
            case RESET_PASSWORD -> "dat lai mat khau";
        };
    }

    private String textBody(VerificationPurpose purpose, String code) {
        return """
                Ma OTP UniBus cua ban la: %s

                Dung ma nay de %s. Ma co hieu luc trong %d phut.
                Neu ban khong yeu cau ma nay, vui long bo qua email.
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
                  <body style="margin:0;background:#fff5e6;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#fff5e6;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #f1e4d3;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(17,24,39,0.08);">
                            <tr>
                              <td style="background:#111827;padding:28px 32px;">
                                <div style="font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#fad4c0;">UniBus</div>
                                <div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:900;color:#ffffff;">Ma xac thuc OTP</div>
                                <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#d1d5db;">Dung ma ben duoi de %s.</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:32px;">
                                <div style="font-size:14px;line-height:1.7;color:#4b5563;">Ma xac thuc cua ban la</div>
                                <div style="margin:16px 0 20px;padding:18px 20px;border-radius:18px;background:#fff5e6;border:1px solid #f4dfc7;text-align:center;">
                                  <span style="font-family:JetBrains Mono,Consolas,monospace;font-size:34px;letter-spacing:0.24em;font-weight:900;color:#111827;">%s</span>
                                </div>
                                <div style="font-size:14px;line-height:1.7;color:#4b5563;">
                                  Ma nay co hieu luc trong <strong>%d phut</strong>. Khong chia se ma nay voi bat ky ai.
                                </div>
                                <div style="margin-top:22px;padding:14px 16px;border-radius:16px;background:#eef5fb;color:#304b66;font-size:13px;line-height:1.6;">
                                  Neu ban khong yeu cau ma nay, ban co the bo qua email nay mot cach an toan.
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;line-height:1.5;">
                                Email nay duoc gui tu he thong UniBus. Vui long khong tra loi truc tiep email nay.
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
