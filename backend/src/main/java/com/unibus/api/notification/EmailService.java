package com.unibus.api.notification;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Generic email service for transactional notifications: account lock/unlock,
 * payment receipts, fare change notices, complaint status updates.
 *
 * <p>Reuses the same {@link JavaMailSender} as {@code OtpEmailSender}. When
 * {@code app.mail.enabled=false}, all sends are logged and silently skipped so
 * the calling service can stay fire-and-forget.
 */
@Service
public class EmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;
    private final String fromName;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.enabled}") boolean enabled,
            @Value("${app.mail.from}") String from,
            @Value("${app.mail.from-name}") String fromName) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from == null ? "" : from.trim();
        this.fromName = fromName == null || fromName.isBlank() ? "UniBus" : fromName.trim();
    }

    public void sendAccountLockNotice(String email, String fullName, String lockReason) {
        if (!enabled || email == null || email.isBlank()) return;
        String subject = "Tài khoản UniBus của bạn đã bị khóa";
        String body = """
                Xin chào %s,

                Tài khoản UniBus của bạn (email: %s) đã bị khóa vào lúc %s.

                Lý do: %s

                Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ để được hỗ trợ.

                Trân trọng,
                UniBus
                """.formatted(fullName == null ? "bạn" : fullName, email,
                        LocalDateTime.now().format(DATE_FMT),
                        lockReason == null ? "Không nêu rõ" : lockReason);
        sendPlain(email, subject, body);
    }

    public void sendAccountUnlockNotice(String email, String fullName) {
        if (!enabled || email == null || email.isBlank()) return;
        String subject = "Tài khoản UniBus của bạn đã được mở khóa";
        String body = """
                Xin chào %s,

                Tài khoản UniBus của bạn (email: %s) đã được mở khóa vào lúc %s.
                Bạn có thể đăng nhập lại bình thường.

                Trân trọng,
                UniBus
                """.formatted(fullName == null ? "bạn" : fullName, email,
                        LocalDateTime.now().format(DATE_FMT));
        sendPlain(email, subject, body);
    }

    public void sendPaymentReceipt(String email, String fullName, String transactionCode,
            String invoiceNumber, BigDecimal amount, String method, String description) {
        if (!enabled || email == null || email.isBlank()) return;
        String subject = "Biên lai thanh toán UniBus - " + (invoiceNumber == null ? "" : invoiceNumber);
        String body = """
                Xin chào %s,

                Chúng tôi đã nhận được thanh toán của bạn với các thông tin sau:

                  Mã giao dịch: %s
                  Mã hóa đơn: %s
                  Nội dung: %s
                  Số tiền: %,.0f VND
                  Phương thức: %s
                  Thời gian: %s

                Vé của bạn đã được kích hoạt và sẵn sàng sử dụng. Cảm ơn bạn đã sử dụng UniBus.

                Trân trọng,
                Đội ngũ UniBus
                """.formatted(
                        fullName == null ? "bạn" : fullName,
                        transactionCode == null ? "" : transactionCode,
                        invoiceNumber == null ? "" : invoiceNumber,
                        description == null ? "Thanh toán vé" : description,
                        amount == null ? BigDecimal.ZERO : amount,
                        method == null ? "BANK_TRANSFER" : method,
                        LocalDateTime.now().format(DATE_FMT));
        sendPlain(email, subject, body);
    }

    public void sendFareChangeNotice(String email, String fullName, String routeName,
            BigDecimal oldAmount, BigDecimal newAmount, String effectiveDate) {
        if (!enabled || email == null || email.isBlank()) return;
        String subject = "Thông báo thay đổi giá vé tuyến " + (routeName == null ? "" : routeName);
        String body = """
                Xin chào %s,

                UniBus xin thông báo giá vé cho tuyến "%s" sẽ thay đổi như sau:

                  Giá hiện tại: %,.0f VND
                  Giá mới: %,.0f VND
                  Hiệu lực từ: %s

                Nếu bạn đã mua vé tháng cho tuyến này trước ngày hiệu lực, vé của bạn vẫn có giá trị
                đến khi hết hạn. Vui lòng theo dõi ứng dụng để cập nhật thông tin mới nhất.

                Trân trọng,
                Đội ngũ UniBus
                """.formatted(
                        fullName == null ? "bạn" : fullName,
                        routeName == null ? "" : routeName,
                        oldAmount == null ? BigDecimal.ZERO : oldAmount,
                        newAmount == null ? BigDecimal.ZERO : newAmount,
                        effectiveDate == null ? "ngày mai" : effectiveDate);
        sendPlain(email, subject, body);
    }

    public void sendComplaintStatusUpdate(String email, String fullName, Integer complaintId,
            String subject, String resolution) {
        if (!enabled || email == null || email.isBlank()) return;
        String subjectLine = "Cập nhật khiếu nại UniBus #" + complaintId + " - " + subject;
        String body = """
                Xin chào %s,

                Khiếu nại của bạn (mã #%d) đã được cập nhật.

                Tiêu đề: %s
                Phản hồi: %s

                Cảm ơn bạn đã góp ý để UniBus phục vụ tốt hơn.

                Trân trọng,
                Đội ngũ UniBus
                """.formatted(
                        fullName == null ? "bạn" : fullName,
                        complaintId,
                        subject,
                        resolution == null ? "Đã xử lý" : resolution);
        sendPlain(email, subjectLine, body);
    }

    private void sendPlain(String to, String subject, String text) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                LOGGER.warn("JavaMailSender unavailable - skipping email to {}", to);
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);
            mailSender.send(message);
        } catch (MessagingException | MailException | UnsupportedEncodingException ex) {
            LOGGER.warn("Unable to send email to {} (subject={})", to, subject, ex);
        }
    }
}
