package com.unibus.api.ai;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

@Service
public class IntentRouter {

    public AiIntent detect(String message) {
        String normalized = normalize(message);
        if (normalized.isBlank()) {
            return AiIntent.OTHER;
        }
        if (containsAny(normalized, "khong can tim tuyen", "khong can tra tuyen")) {
            return AiIntent.OTHER;
        }
        if (isGeneralAdvisory(normalized) && containsAny(normalized, "khong can", "uu nhuoc diem", "tom tat", "dong vai")) {
            return AiIntent.OTHER;
        }
        if (containsAny(normalized, "thanh toan", "sepay", "qr", "mua ve")) {
            return AiIntent.PAYMENT_LOOKUP;
        }
        if (containsAny(normalized, "khong biet bat dau", "bat dau tu dau", "lan dau di", "can huong dan")) {
            return AiIntent.HELP;
        }
        if (isPointToPoint(normalized)) {
            return AiIntent.ROUTE_SUGGESTION;
        }
        if (isGeneralAdvisory(normalized)) {
            return AiIntent.OTHER;
        }
        if (containsAny(normalized, "gia", "bao nhieu tien", "ve thang", "ve le", "ve luot", "tro gia")) {
            return AiIntent.FARE_LOOKUP;
        }
        if (containsAny(normalized, "lich", "may gio", "luc nao", "eta", "chuyen tiep theo")) {
            return AiIntent.SCHEDULE_LOOKUP;
        }
        if (containsAny(normalized, "xac minh", "truong cua toi", "mssv")) {
            return AiIntent.VERIFICATION;
        }
        if (containsAny(normalized, "tuyen", "duong", "di toi", "di den", "di sao", "goi y", "nhanh", "re",
                "muon qua", "sang") || (normalized.contains("di tu") && normalized.contains("den"))) {
            return AiIntent.ROUTE_SUGGESTION;
        }
        if (containsAny(normalized, "giup", "help", "ho tro")) {
            return AiIntent.HELP;
        }
        if (isSmallTalk(message)) {
            return AiIntent.SMALL_TALK;
        }
        return AiIntent.OTHER;
    }

    public boolean isSmallTalk(String message) {
        String normalized = normalize(message);
        if (normalized.length() > 120) {
            return false;
        }
        return containsWholePhrase(normalized,
                "xin chao", "hello", "hi", "chao", "ban khoe khong", "khoe khong", "cam on",
                "thanks", "thank you", "ban la ai", "ten gi", "ok", "oke");
    }

    public String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase(Locale.ROOT).replace('đ', 'd');
        String withoutAccent = Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccent.replaceAll("[^a-z0-9]+", " ").trim();
    }

    private boolean isGeneralAdvisory(String normalized) {
        boolean reasoningRequest = containsAny(normalized,
                "giai thich",
                "phan tich",
                "so sanh",
                "uu nhuoc diem",
                "danh gia",
                "tu van",
                "tom tat",
                "dong vai",
                "nen chon",
                "cach mot sinh vien",
                "khong can tim tuyen",
                "khong can tra tuyen");
        if (!reasoningRequest) {
            return false;
        }
        boolean explicitRouteLookup = normalized.contains(" tu ") && normalized.contains(" den ")
                && containsAny(normalized, "tim tuyen", "goi y tuyen", "tuyen phu hop", "di tu", "di den");
        return !explicitRouteLookup || containsAny(normalized, "khong can tim tuyen", "khong can tra tuyen");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private boolean isPointToPoint(String normalized) {
        String padded = " " + normalized + " ";
        return (containsAny(padded, " tu ", " di tu ") && containsAny(padded, " den ", " toi ", " sang "))
                || (containsAny(normalized, "dang o ", " o ") && containsAny(normalized, "muon qua ", "muon den ", "muon toi "));
    }

    private boolean containsWholePhrase(String text, String... phrases) {
        String padded = " " + text + " ";
        for (String phrase : phrases) {
            if (Pattern.compile("\\s" + Pattern.quote(phrase) + "\\s").matcher(padded).find()) {
                return true;
            }
        }
        return false;
    }
}
