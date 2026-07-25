package com.unibus.api.student;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

final class OcrTextNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");

    private OcrTextNormalizer() {
    }

    static String normalized(String value) {
        if (value == null) {
            return "";
        }
        return withoutDiacritics(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    static String compactCode(String value) {
        if (value == null) {
            return "";
        }
        return withoutDiacritics(value)
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
    }

    static Set<String> tokens(String value) {
        String normalized = normalized(value);
        if (normalized.isBlank()) {
            return Set.of();
        }
        return new LinkedHashSet<>(Arrays.asList(normalized.split(" ")));
    }

    static BigDecimal similarity(String left, String right) {
        String a = normalized(left);
        String b = normalized(right);
        if (a.isBlank() || b.isBlank()) {
            return BigDecimal.ZERO;
        }
        if (a.equals(b)) {
            return BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP);
        }
        int max = Math.max(a.length(), b.length());
        int distance = levenshtein(a, b);
        double editScore = max == 0 ? 0 : 1.0 - ((double) distance / max);

        Set<String> leftTokens = tokens(left);
        Set<String> rightTokens = tokens(right);
        long overlap = leftTokens.stream().filter(rightTokens::contains).count();
        int tokenMax = Math.max(leftTokens.size(), rightTokens.size());
        double tokenScore = tokenMax == 0 ? 0 : (double) overlap / tokenMax;

        double score = Math.max(0, Math.min(1, (editScore * 0.65) + (tokenScore * 0.35)));
        return BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP);
    }

    private static String withoutDiacritics(String value) {
        return DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD))
                .replaceAll("")
                .replace('Đ', 'D')
                .replace('đ', 'd');
    }

    private static int levenshtein(String left, String right) {
        int[] previous = new int[right.length() + 1];
        int[] current = new int[right.length() + 1];
        for (int j = 0; j <= right.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= left.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= right.length(); j++) {
                int cost = left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                        Math.min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + cost);
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[right.length()];
    }
}
