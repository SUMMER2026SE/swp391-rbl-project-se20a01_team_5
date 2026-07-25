package com.unibus.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

class StudentCardMatchingServiceTests {

    private final StudentCardMatchingService matcher = new StudentCardMatchingService(
            BigDecimal.valueOf(0.90),
            BigDecimal.valueOf(0.70),
            BigDecimal.valueOf(0.90),
            BigDecimal.valueOf(0.70));

    @Test
    void matchesNameWithDiacriticsCaseAndWithoutDiacritics() {
        assertThat(matcher.matchName("NGUYEN VAN AN", "Nguyen Van An").status())
                .isEqualTo(OcrMatchStatus.MATCHED);
        assertThat(matcher.matchName("Nguyen Van An", "Nguyễn Văn An").status())
                .isEqualTo(OcrMatchStatus.MATCHED);
    }

    @Test
    void classifiesPartialAndDifferentName() {
        assertThat(matcher.matchName("Nguyen Van A", "Nguyen Van An").status())
                .isIn(OcrMatchStatus.MATCHED, OcrMatchStatus.PARTIAL_MATCH);
        assertThat(matcher.matchName("Tran Thi B", "Nguyen Van An").status())
                .isEqualTo(OcrMatchStatus.NOT_MATCHED);
    }

    @Test
    void returnsNotDetectedWhenNameMissing() {
        assertThat(matcher.matchName("", "Nguyen Van An").status())
                .isEqualTo(OcrMatchStatus.NOT_DETECTED);
    }

    @Test
    void matchesStudentCodeExactlyAndWithControlledOcrSubstitutions() {
        assertThat(matcher.matchStudentCode("SE00123", List.of("SE00123"), "SE00123").status())
                .isEqualTo(OcrMatchStatus.MATCHED);
        assertThat(matcher.matchStudentCode("SEO0123", List.of("SEO0123"), "SE00123").status())
                .isEqualTo(OcrMatchStatus.NORMALIZED_MATCH);
        assertThat(matcher.matchStudentCode("SEL0123", List.of("SEL0123"), "SE10123").status())
                .isEqualTo(OcrMatchStatus.NORMALIZED_MATCH);
    }

    @Test
    void doesNotTreatDifferentStudentCodeAsMatched() {
        assertThat(matcher.matchStudentCode("SE99123", List.of("SE99123"), "SE00123").status())
                .isEqualTo(OcrMatchStatus.NOT_MATCHED);
    }

    @Test
    void reportsMultipleStudentCodeCandidates() {
        assertThat(matcher.matchStudentCode("SE99123", List.of("SE99123", "SE00123"), "SE00123").status())
                .isEqualTo(OcrMatchStatus.MULTIPLE_CANDIDATES);
    }

    @Test
    void matchesUniversityUsingNormalizedVariants() {
        List<String> variants = List.of("Truong Dai hoc FPT Da Nang", "FPTU", "FPT University");

        assertThat(matcher.matchUniversity("FPT University", "", variants).status())
                .isEqualTo(OcrMatchStatus.MATCHED);
        assertThat(matcher.matchUniversity("FPTU", "", variants).status())
                .isEqualTo(OcrMatchStatus.MATCHED);
        assertThat(matcher.matchUniversity("Another University", "Another University", variants).status())
                .isEqualTo(OcrMatchStatus.NOT_MATCHED);
        assertThat(matcher.matchUniversity("", "", variants).status())
                .isEqualTo(OcrMatchStatus.NOT_DETECTED);
    }
}
