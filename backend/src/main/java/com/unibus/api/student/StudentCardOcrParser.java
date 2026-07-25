package com.unibus.api.student;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class StudentCardOcrParser {

    private static final List<String> NAME_LABELS = List.of(
            "ho va ten",
            "ho ten",
            "ten sinh vien",
            "full name",
            "student name",
            "name");
    private static final List<String> STUDENT_CODE_LABELS = List.of(
            "mssv",
            "ma sv",
            "ma sinh vien",
            "student id",
            "student no",
            "student number",
            "id no");
    private static final List<String> EXCLUDED_NAME_HINTS = List.of(
            "the sinh vien",
            "student card",
            "truong",
            "university",
            "khoa",
            "faculty",
            "nganh",
            "department",
            "mssv",
            "ma sinh vien",
            "nien khoa",
            "valid until");
    private static final Pattern EMAIL_OR_URL = Pattern.compile("(?i).*(?:@|https?://|www\\.).*");
    private static final Pattern CODE_TOKEN = Pattern.compile("\\b[A-Z0-9][A-Z0-9\\- ]{3,24}[A-Z0-9]\\b");
    private static final Pattern DATE_LIKE = Pattern.compile("\\b\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4}\\b");
    private static final Pattern PHONE_LIKE = Pattern.compile("\\b0\\d{8,10}\\b");
    private static final Pattern SCHOOL_YEAR = Pattern.compile("\\b(?:19|20)\\d{2}\\s*[-/]\\s*(?:19|20)?\\d{2}\\b");

    public Result parse(OcrDocumentResult document, List<String> universityVariants) {
        List<String> safeUniversityVariants = universityVariants == null ? List.of() : universityVariants;
        List<String> lines = document.lines().isEmpty()
                ? document.rawText().lines().map(String::trim).filter(line -> !line.isBlank()).toList()
                : document.lines().stream().map(OcrTextLine::text).filter(line -> !line.isBlank()).toList();
        List<String> nameCandidates = extractNameCandidates(lines, safeUniversityVariants);
        List<String> studentCodeCandidates = extractStudentCodeCandidates(lines);
        List<String> universityCandidates = extractUniversityCandidates(document.rawText(), lines, safeUniversityVariants);
        return new Result(
                first(nameCandidates),
                nameCandidates,
                first(studentCodeCandidates),
                studentCodeCandidates,
                first(universityCandidates),
                universityCandidates);
    }

    private List<String> extractNameCandidates(List<String> lines, List<String> universityVariants) {
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            String normalized = OcrTextNormalizer.normalized(line);
            if (!hasLabel(normalized, NAME_LABELS)) {
                continue;
            }
            addIfValidName(candidates, valueAfterLabel(line, NAME_LABELS), universityVariants);
            if (i + 1 < lines.size()) {
                addIfValidName(candidates, lines.get(i + 1), universityVariants);
            }
        }
        for (String line : lines) {
            addIfValidName(candidates, line, universityVariants);
        }
        return List.copyOf(candidates);
    }

    private List<String> extractStudentCodeCandidates(List<String> lines) {
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            String normalized = OcrTextNormalizer.normalized(line);
            if (!hasLabel(normalized, STUDENT_CODE_LABELS)) {
                continue;
            }
            addCodeCandidate(candidates, valueAfterLabel(line, STUDENT_CODE_LABELS));
            if (i + 1 < lines.size()) {
                addCodeCandidate(candidates, lines.get(i + 1));
            }
        }
        for (String line : lines) {
            Matcher matcher = CODE_TOKEN.matcher(line.toUpperCase(Locale.ROOT));
            while (matcher.find()) {
                addCodeCandidate(candidates, matcher.group());
            }
        }
        return List.copyOf(candidates);
    }

    private List<String> extractUniversityCandidates(String rawText, List<String> lines, List<String> universityVariants) {
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        String normalizedText = OcrTextNormalizer.normalized(rawText);
        for (String variant : universityVariants) {
            String normalizedVariant = OcrTextNormalizer.normalized(variant);
            if (!normalizedVariant.isBlank() && normalizedText.contains(normalizedVariant)) {
                candidates.add(variant.trim());
            }
        }
        for (String line : lines) {
            String normalized = OcrTextNormalizer.normalized(line);
            if ((normalized.contains("truong") || normalized.contains("university"))
                    && !looksLikeNoise(line)) {
                candidates.add(line.trim());
            }
        }
        return List.copyOf(candidates);
    }

    private void addIfValidName(Set<String> candidates, String candidate, List<String> universityVariants) {
        String value = cleanCandidate(candidate);
        if (!isValidName(value, universityVariants)) {
            return;
        }
        candidates.add(value);
    }

    private boolean isValidName(String value, List<String> universityVariants) {
        String normalized = OcrTextNormalizer.normalized(value);
        if (normalized.isBlank()
                || value.split("\\s+").length < 2
                || value.matches(".*\\d.*")
                || EMAIL_OR_URL.matcher(value).matches()
                || looksLikeNoise(value)) {
            return false;
        }
        if (EXCLUDED_NAME_HINTS.stream().anyMatch(normalized::contains)) {
            return false;
        }
        return universityVariants.stream()
                .map(OcrTextNormalizer::normalized)
                .filter(variant -> !variant.isBlank())
                .noneMatch(variant -> normalized.contains(variant) || variant.contains(normalized));
    }

    private void addCodeCandidate(Set<String> candidates, String candidate) {
        String value = cleanCodeCandidate(candidate);
        String compact = OcrTextNormalizer.compactCode(value);
        if (compact.length() < 5 || compact.length() > 20 || !compact.matches(".*\\d.*")) {
            return;
        }
        if (DATE_LIKE.matcher(value).find()
                || PHONE_LIKE.matcher(compact).find()
                || SCHOOL_YEAR.matcher(value).find()) {
            return;
        }
        candidates.add(value);
    }

    private boolean hasLabel(String normalizedLine, List<String> labels) {
        return labels.stream().anyMatch(label ->
                normalizedLine.equals(label)
                        || normalizedLine.startsWith(label + " ")
                        || normalizedLine.contains(" " + label + " "));
    }

    private String valueAfterLabel(String line, List<String> labels) {
        String normalizedLine = OcrTextNormalizer.normalized(line);
        for (String label : labels) {
            int normalizedIndex = normalizedLine.indexOf(label);
            if (normalizedIndex < 0) {
                continue;
            }
            int separator = firstSeparatorAfterLabel(line, label);
            if (separator >= 0 && separator + 1 < line.length()) {
                return line.substring(separator + 1);
            }
            String normalizedRemainder = normalizedLine.substring(normalizedIndex + label.length()).trim();
            if (!normalizedRemainder.isBlank()) {
                return normalizedRemainder;
            }
        }
        return "";
    }

    private int firstSeparatorAfterLabel(String line, String label) {
        String lower = OcrTextNormalizer.normalized(line);
        int labelIndex = lower.indexOf(label);
        if (labelIndex < 0) {
            return -1;
        }
        int colon = line.indexOf(':');
        int dash = line.indexOf('-');
        int separator = colon >= 0 ? colon : dash;
        return separator >= 0 ? separator : -1;
    }

    private String cleanCandidate(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("^[\\s:\\-]+", "")
                .replaceAll("[\\s,;]+$", "")
                .trim();
    }

    private String cleanCodeCandidate(String value) {
        String cleaned = cleanCandidate(value).toUpperCase(Locale.ROOT);
        Matcher matcher = CODE_TOKEN.matcher(cleaned);
        return matcher.find() ? matcher.group().trim() : cleaned;
    }

    private boolean looksLikeNoise(String value) {
        String normalized = OcrTextNormalizer.normalized(value);
        return normalized.isBlank()
                || normalized.length() < 4
                || normalized.matches("[0-9 ]+")
                || normalized.contains("valid until")
                || normalized.contains("ngay sinh")
                || normalized.contains("date of birth");
    }

    private String first(List<String> values) {
        return values.isEmpty() ? "" : values.get(0);
    }

    public record Result(
            String fullName,
            List<String> nameCandidates,
            String studentCode,
            List<String> studentCodeCandidates,
            String university,
            List<String> universityCandidates) {

        public Result {
            nameCandidates = nameCandidates == null ? List.of() : List.copyOf(nameCandidates);
            studentCodeCandidates = studentCodeCandidates == null ? List.of() : List.copyOf(studentCodeCandidates);
            universityCandidates = universityCandidates == null ? List.of() : List.copyOf(universityCandidates);
        }
    }
}
