package com.unibus.api.ai;

import java.text.Normalizer;
import java.util.Locale;

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
        if (containsAny(normalized, "tuyen", "duong", "di toi", "di den", "goi y", "nhanh", "re")
                || (normalized.contains("di tu") && normalized.contains("den"))) {
            return AiIntent.ROUTE_SUGGESTION;
        }
        if (isGeneralAdvisory(normalized)) {
            return AiIntent.OTHER;
        }
        if (containsAny(normalized, "gia", "bao nhieu tien", "ve thang", "ve le")) {
            return AiIntent.FARE_LOOKUP;
        }
        if (containsAny(normalized, "lich", "may gio", "eta", "chuyen")) {
            return AiIntent.SCHEDULE_LOOKUP;
        }
        if (containsAny(normalized, "xac minh", "truong cua toi", "mssv")) {
            return AiIntent.VERIFICATION;
        }
        if (isSmallTalk(message)) {
            return AiIntent.SMALL_TALK;
        }
        if (containsAny(normalized, "giup", "help", "ho tro")) {
            return AiIntent.HELP;
        }
        return AiIntent.OTHER;
    }

    public boolean isSmallTalk(String message) {
        String normalized = normalize(message);
        if (normalized.length() > 120) {
            return false;
        }
        return containsAny(normalized,
                "xin chao",
                "hello",
                "hi",
                "chao",
                "ban khoe khong",
                "khoe khong",
                "cam on",
                "thanks",
                "thank you",
                "ban la ai",
                "ten gi",
                "ok",
                "oke");
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
}
