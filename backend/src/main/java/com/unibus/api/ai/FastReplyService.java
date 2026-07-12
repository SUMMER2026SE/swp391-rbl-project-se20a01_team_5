package com.unibus.api.ai;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class FastReplyService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Bangkok");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final IntentRouter intentRouter;

    public FastReplyService(IntentRouter intentRouter) {
        this.intentRouter = intentRouter;
    }

    public Optional<String> reply(String message) {
        String normalized = intentRouter.normalize(message);
        if (!intentRouter.isSmallTalk(message)) {
            return Optional.empty();
        }
        if (containsAny(normalized, "cam on", "thanks", "thank you")) {
            return Optional.of("Không có gì nha. Cần tra tuyến, vé hay lịch chạy thì cứ hỏi mình.");
        }
        if (containsAny(normalized, "ban la ai", "ten gi")) {
            return Optional.of("Mình là UniBus Copilot, trợ lý AI giúp bạn tra tuyến, giá vé, lịch chạy và hướng dẫn mua vé.");
        }
        if (containsAny(normalized, "hom nay la ngay may", "hom nay ngay may", "ngay hom nay", "bay gio la ngay may")) {
            LocalDate today = LocalDate.now(VN_ZONE);
            return Optional.of("Hôm nay là ngày " + today.format(DATE_FORMAT) + " theo múi giờ Asia/Bangkok.");
        }
        if (containsAny(normalized, "khoe khong", "ban khoe")) {
            return Optional.of("Mình ổn, đang sẵn sàng tra dữ liệu UniBus cho bạn đây.");
        }
        if (containsAny(normalized, "ok", "oke")) {
            return Optional.of("Rõ rồi. Khi cần, bạn gửi điểm đi và điểm đến để mình gợi ý tuyến phù hợp nhé.");
        }
        return Optional.of("Xin chào. Bạn muốn mình tìm tuyến, tra giá vé hay xem lịch chạy hôm nay?");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
