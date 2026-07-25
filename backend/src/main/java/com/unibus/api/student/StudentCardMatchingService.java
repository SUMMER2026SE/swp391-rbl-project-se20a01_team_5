package com.unibus.api.student;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StudentCardMatchingService {

    private final BigDecimal nameMatchedThreshold;
    private final BigDecimal namePartialThreshold;
    private final BigDecimal universityMatchedThreshold;
    private final BigDecimal universityPartialThreshold;

    StudentCardMatchingService() {
        this(BigDecimal.valueOf(0.90), BigDecimal.valueOf(0.70), BigDecimal.valueOf(0.90), BigDecimal.valueOf(0.70));
    }

    @Autowired
    public StudentCardMatchingService(
            @Value("${app.ocr.matching.name.matched-threshold:0.90}") BigDecimal nameMatchedThreshold,
            @Value("${app.ocr.matching.name.partial-threshold:0.70}") BigDecimal namePartialThreshold,
            @Value("${app.ocr.matching.university.matched-threshold:0.90}") BigDecimal universityMatchedThreshold,
            @Value("${app.ocr.matching.university.partial-threshold:0.70}") BigDecimal universityPartialThreshold) {
        this.nameMatchedThreshold = nameMatchedThreshold;
        this.namePartialThreshold = namePartialThreshold;
        this.universityMatchedThreshold = universityMatchedThreshold;
        this.universityPartialThreshold = universityPartialThreshold;
    }

    public MatchResult matchName(String detectedName, String expectedName) {
        if (detectedName == null || detectedName.isBlank()) {
            return new MatchResult(OcrMatchStatus.NOT_DETECTED, BigDecimal.ZERO);
        }
        BigDecimal score = OcrTextNormalizer.similarity(detectedName, expectedName);
        if (score.compareTo(nameMatchedThreshold) >= 0) {
            return new MatchResult(OcrMatchStatus.MATCHED, score);
        }
        if (score.compareTo(namePartialThreshold) >= 0) {
            return new MatchResult(OcrMatchStatus.PARTIAL_MATCH, score);
        }
        return new MatchResult(OcrMatchStatus.NOT_MATCHED, score);
    }

    public MatchResult matchStudentCode(String detectedCode, List<String> candidates, String expectedCode) {
        String detected = OcrTextNormalizer.compactCode(detectedCode);
        String expected = OcrTextNormalizer.compactCode(expectedCode);
        if (detected.isBlank()) {
            return new MatchResult(OcrMatchStatus.NOT_DETECTED, BigDecimal.ZERO);
        }
        if (detected.equals(expected)) {
            return new MatchResult(OcrMatchStatus.MATCHED, BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP));
        }
        if (controlledOcrCodeMatch(detected, expected)) {
            return new MatchResult(OcrMatchStatus.NORMALIZED_MATCH, BigDecimal.valueOf(0.9800).setScale(4));
        }
        Set<String> uniqueCandidates = new LinkedHashSet<>();
        if (candidates != null) {
            candidates.stream()
                    .map(OcrTextNormalizer::compactCode)
                    .filter(candidate -> !candidate.isBlank())
                    .forEach(uniqueCandidates::add);
        }
        if (uniqueCandidates.size() > 1) {
            return new MatchResult(OcrMatchStatus.MULTIPLE_CANDIDATES, codeSimilarity(detected, expected));
        }
        return new MatchResult(OcrMatchStatus.NOT_MATCHED, codeSimilarity(detected, expected));
    }

    public MatchResult matchUniversity(String rawText, String detectedUniversity, List<String> expectedVariants) {
        if ((rawText == null || rawText.isBlank()) && (detectedUniversity == null || detectedUniversity.isBlank())) {
            return new MatchResult(OcrMatchStatus.NOT_DETECTED, BigDecimal.ZERO);
        }
        String haystack = OcrTextNormalizer.normalized((rawText == null ? "" : rawText) + " " + (detectedUniversity == null ? "" : detectedUniversity));
        BigDecimal best = BigDecimal.ZERO;
        for (String variant : expectedVariants == null ? List.<String>of() : expectedVariants) {
            String normalizedVariant = OcrTextNormalizer.normalized(variant);
            if (normalizedVariant.isBlank()) {
                continue;
            }
            if (haystack.contains(normalizedVariant)) {
                return new MatchResult(OcrMatchStatus.MATCHED, BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP));
            }
            best = best.max(OcrTextNormalizer.similarity(detectedUniversity, variant));
        }
        if (best.compareTo(universityMatchedThreshold) >= 0) {
            return new MatchResult(OcrMatchStatus.MATCHED, best);
        }
        if (best.compareTo(universityPartialThreshold) >= 0) {
            return new MatchResult(OcrMatchStatus.PARTIAL_MATCH, best);
        }
        return haystack.isBlank()
                ? new MatchResult(OcrMatchStatus.NOT_DETECTED, BigDecimal.ZERO)
                : new MatchResult(OcrMatchStatus.NOT_MATCHED, best);
    }

    private boolean controlledOcrCodeMatch(String detected, String expected) {
        if (detected.length() != expected.length() || detected.isBlank()) {
            return false;
        }
        int substitutions = 0;
        for (int i = 0; i < detected.length(); i++) {
            char left = detected.charAt(i);
            char right = expected.charAt(i);
            if (left == right) {
                continue;
            }
            if (!isControlledSubstitution(left, right)) {
                return false;
            }
            substitutions++;
        }
        return substitutions > 0 && substitutions <= 2;
    }

    private boolean isControlledSubstitution(char left, char right) {
        return (left == 'O' && right == '0')
                || (left == '0' && right == 'O')
                || (left == 'I' && right == '1')
                || (left == '1' && right == 'I')
                || (left == 'L' && right == '1')
                || (left == '1' && right == 'L');
    }

    private BigDecimal codeSimilarity(String detected, String expected) {
        if (detected.isBlank() || expected.isBlank()) {
            return BigDecimal.ZERO;
        }
        int max = Math.max(detected.length(), expected.length());
        int same = 0;
        for (int i = 0; i < Math.min(detected.length(), expected.length()); i++) {
            if (detected.charAt(i) == expected.charAt(i)) {
                same++;
            }
        }
        return BigDecimal.valueOf((double) same / max).setScale(4, RoundingMode.HALF_UP);
    }

    public record MatchResult(OcrMatchStatus status, BigDecimal similarityScore) {
    }
}
