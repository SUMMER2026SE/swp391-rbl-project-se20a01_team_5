package com.unibus.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class StudentCardOcrParserTests {

    private final StudentCardOcrParser parser = new StudentCardOcrParser();
    private final List<String> universityVariants = List.of(
            "Truong Dai hoc FPT Da Nang",
            "FPTU",
            "FPT University");

    @Test
    void extractsFullNameOnSameLine() {
        StudentCardOcrParser.Result result = parse("THE SINH VIEN\nHO VA TEN: NGUYEN VAN AN\nMSSV: 001234");

        assertThat(result.fullName()).isEqualTo("NGUYEN VAN AN");
    }

    @Test
    void extractsFullNameFromNextLine() {
        StudentCardOcrParser.Result result = parse("FULL NAME\nNguyen Van An\nSTUDENT ID: SE00123");

        assertThat(result.fullName()).isEqualTo("Nguyen Van An");
    }

    @Test
    void doesNotUseCardTitleFacultyOrUniversityAsName() {
        StudentCardOcrParser.Result result = parse("""
                THE SINH VIEN
                Truong Dai hoc FPT Da Nang
                KHOA CONG NGHE THONG TIN
                MSSV: SE00123
                """);

        assertThat(result.fullName()).isBlank();
        assertThat(result.nameCandidates()).isEmpty();
    }

    @Test
    void doesNotCopyExpectedNameBecauseParserDoesNotReceiveIt() {
        StudentCardOcrParser.Result result = parse("STUDENT CARD\nMSSV: 001234");

        assertThat(result.fullName()).isBlank();
    }

    @Test
    void extractsStudentCodeAndKeepsLeadingZero() {
        StudentCardOcrParser.Result result = parse("MSSV: 001234\nHO VA TEN: NGUYEN VAN AN");

        assertThat(result.studentCode()).isEqualTo("001234");
    }

    @Test
    void extractsStudentCodeFromNextLineAndKeepsLetters() {
        StudentCardOcrParser.Result result = parse("MA SINH VIEN\nSE-00123\nHO TEN: NGUYEN VAN AN");

        assertThat(result.studentCode()).isEqualTo("SE-00123");
    }

    @Test
    void rejectsBirthDateSchoolYearAndPhoneAsStudentCode() {
        StudentCardOcrParser.Result result = parse("""
                NGAY SINH: 01/02/2004
                NIEN KHOA: 2020-2024
                PHONE: 0905123456
                """);

        assertThat(result.studentCode()).isBlank();
        assertThat(result.studentCodeCandidates()).isEmpty();
    }

    @Test
    void reportsMultipleStudentCodeCandidates() {
        StudentCardOcrParser.Result result = parse("""
                MSSV: SE00123
                CARD NO: AB98765
                """);

        assertThat(result.studentCodeCandidates()).contains("SE00123", "AB98765");
    }

    @Test
    void extractsUniversityFromOfficialShortOrEnglishVariant() {
        assertThat(parse("Truong Dai hoc FPT Da Nang\nMSSV: SE00123").university())
                .isEqualTo("Truong Dai hoc FPT Da Nang");
        assertThat(parse("FPTU\nSTUDENT ID: SE00123").university())
                .isEqualTo("FPTU");
        assertThat(parse("FPT University\nSTUDENT ID: SE00123").university())
                .isEqualTo("FPT University");
    }

    @Test
    void extractsUniversityFromShortenedVietnameseNameWithoutPrefix() {
        UniversityOcrLookupService lookup = new UniversityOcrLookupService(null);
        List<String> variants = lookup.variantsForTesting("Truong Dai hoc Duy Tan", List.of("DTU"));

        StudentCardOcrParser.Result result = parser.parse(
                document("DTU rd\nDai hoc Duy Tan\nTHE SINH VIEN\nMSSV: 052204016105"),
                variants);

        assertThat(result.university()).isEqualTo("dai hoc duy tan");
    }

    @Test
    void doesNotDetectUnrelatedUniversity() {
        StudentCardOcrParser.Result result = parse("Another University\nSTUDENT ID: SE00123");

        assertThat(result.university()).isEqualTo("Another University");
        assertThat(result.universityCandidates()).contains("Another University");
    }

    private StudentCardOcrParser.Result parse(String rawText) {
        return parser.parse(document(rawText), universityVariants);
    }

    private OcrDocumentResult document(String rawText) {
        List<OcrTextLine> lines = rawText.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(line -> new OcrTextLine(line, null, 0))
                .toList();
        return new OcrDocumentResult(rawText, null, lines, "test");
    }
}
