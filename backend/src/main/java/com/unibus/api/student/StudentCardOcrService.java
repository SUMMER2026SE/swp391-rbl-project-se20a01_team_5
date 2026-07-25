package com.unibus.api.student;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StudentCardOcrService {

    private final OcrDocumentProvider ocrDocumentProvider;
    private final StudentCardOcrParser parser;
    private final StudentCardMatchingService matchingService;
    private final UniversityOcrLookupService universityLookupService;

    public StudentCardOcrService(
            OcrDocumentProvider ocrDocumentProvider,
            StudentCardOcrParser parser,
            StudentCardMatchingService matchingService,
            UniversityOcrLookupService universityLookupService) {
        this.ocrDocumentProvider = ocrDocumentProvider;
        this.parser = parser;
        this.matchingService = matchingService;
        this.universityLookupService = universityLookupService;
    }

    public Result extract(
            MultipartFile cardImage,
            String expectedFullName,
            String expectedStudentCode,
            String expectedUniversity) {
        OcrDocumentResult document = ocrDocumentProvider.extract(cardImage);
        List<String> universityVariants = universityLookupService.variantsFor(expectedUniversity);
        StudentCardOcrParser.Result parsed = parser.parse(document, universityVariants);

        // Matching is calculated here so the core flow validates parser output without
        // letting provider adapters know about submitted student data.
        StudentCardMatchingService.MatchResult nameMatch =
                matchingService.matchName(parsed.fullName(), expectedFullName);
        StudentCardMatchingService.MatchResult studentCodeMatch =
                matchingService.matchStudentCode(parsed.studentCode(), parsed.studentCodeCandidates(), expectedStudentCode);
        StudentCardMatchingService.MatchResult universityMatch =
                matchingService.matchUniversity(document.rawText(), parsed.university(), universityVariants);

        return new Result(
                parsed.fullName(),
                parsed.studentCode(),
                parsed.university(),
                document.rawText(),
                document.averageConfidence(),
                document.provider(),
                document.status(),
                document.errorCode(),
                document.errorMessage(),
                nameMatch.status(),
                nameMatch.similarityScore(),
                studentCodeMatch.status(),
                studentCodeMatch.similarityScore(),
                universityMatch.status(),
                universityMatch.similarityScore());
    }

    public record Result(
            String fullName,
            String studentCode,
            String university,
            String rawText,
            BigDecimal confidenceScore,
            String provider,
            OcrProcessingStatus status,
            String errorCode,
            String errorMessage,
            OcrMatchStatus nameMatchStatus,
            BigDecimal nameSimilarityScore,
            OcrMatchStatus studentCodeMatchStatus,
            BigDecimal studentCodeSimilarityScore,
            OcrMatchStatus universityMatchStatus,
            BigDecimal universitySimilarityScore) {
    }
}
