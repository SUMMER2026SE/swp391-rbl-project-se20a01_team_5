package com.unibus.api.student;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.unibus.api.common.ApiException;

@Component
public class UniversityCatalog {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");

    private static final List<String> DA_NANG_UNIVERSITIES = List.of(
            "Đại học Đà Nẵng",
            "Trường Đại học Bách khoa - Đại học Đà Nẵng",
            "Trường Đại học Kinh tế - Đại học Đà Nẵng",
            "Trường Đại học Sư phạm - Đại học Đà Nẵng",
            "Trường Đại học Ngoại ngữ - Đại học Đà Nẵng",
            "Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng",
            "Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn",
            "Trường Đại học Duy Tân",
            "Trường Đại học Đông Á",
            "Trường Đại học Kiến trúc Đà Nẵng",
            "Trường Đại học FPT Đà Nẵng",
            "Trường Đại học Greenwich Việt Nam - Cơ sở Đà Nẵng",
            "Trường Cao đẳng FPT Polytechnic Đà Nẵng",
            "Trường Cao đẳng Bách khoa Đà Nẵng",
            "Trường Cao đẳng Kinh tế - Kế hoạch Đà Nẵng",
            "Trường Cao đẳng Thương mại Đà Nẵng",
            "Trường Cao đẳng Du lịch Đà Nẵng",
            "Trường Cao đẳng Lương thực - Thực phẩm");

    public List<String> list() {
        return DA_NANG_UNIVERSITIES;
    }

    public String requireAllowed(String value) {
        String normalized = normalize(value);
        return DA_NANG_UNIVERSITIES.stream()
                .filter(university -> normalize(university).equals(normalized))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "University must be selected from the Da Nang university list"));
    }

    public String detectInText(String text) {
        String normalizedText = normalize(text);
        return DA_NANG_UNIVERSITIES.stream()
                .filter(university -> normalizedText.contains(normalize(university)))
                .findFirst()
                .orElse("");
    }

    public boolean textMentions(String text, String university) {
        String normalizedText = normalize(text);
        String normalizedUniversity = normalize(university);
        return !normalizedText.isBlank() && !normalizedUniversity.isBlank()
                && normalizedText.contains(normalizedUniversity);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String withoutDiacritics = DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD))
                .replaceAll("");
        return withoutDiacritics
                .replace('Đ', 'D')
                .replace('đ', 'd')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
