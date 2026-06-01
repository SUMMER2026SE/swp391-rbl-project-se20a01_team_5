package com.unibus.api.student;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.Block;
import software.amazon.awssdk.services.textract.model.BlockType;
import software.amazon.awssdk.services.textract.model.DetectDocumentTextRequest;
import software.amazon.awssdk.services.textract.model.Document;
import software.amazon.awssdk.services.textract.model.TextractException;

@Service
@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "aws")
public class AwsTextractStudentCardOcrService implements StudentCardOcrService {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern STUDENT_CODE_PATTERN = Pattern.compile(
            "(?:MSSV|MÃ\\s*SỐ\\s*SV|MÃ\\s*SINH\\s*VIÊN|STUDENT\\s*ID)\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9\\-]{4,19})",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern FALLBACK_CODE_PATTERN = Pattern.compile("\\b[A-Z]{1,5}[0-9][A-Z0-9\\-]{4,18}\\b");

    private final UniversityCatalog universityCatalog;
    private final TextractClient textractClient;
    private final boolean enabled;

    public AwsTextractStudentCardOcrService(
            UniversityCatalog universityCatalog,
            @Value("${app.ocr.enabled:false}") boolean enabled,
            @Value("${app.aws.region:ap-southeast-1}") String awsRegion) {
        this.universityCatalog = universityCatalog;
        this.enabled = enabled;
        this.textractClient = TextractClient.builder()
                .region(Region.of(awsRegion == null || awsRegion.isBlank() ? "ap-southeast-1" : awsRegion.trim()))
                .build();
    }

    @Override
    public Result extract(
            MultipartFile cardImage,
            String expectedFullName,
            String expectedStudentCode,
            String expectedUniversity) {
        if (!enabled) {
            return fallback(expectedFullName, expectedStudentCode, expectedUniversity, "OCR is disabled for this environment.");
        }
        try {
            DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
                    .document(Document.builder()
                            .bytes(SdkBytes.fromByteArray(cardImage.getBytes()))
                            .build())
                    .build();
            List<Block> lines = textractClient.detectDocumentText(request).blocks().stream()
                    .filter(block -> block.blockType() == BlockType.LINE)
                    .filter(block -> block.text() != null && !block.text().isBlank())
                    .toList();
            String rawText = lines.stream()
                    .map(Block::text)
                    .reduce((left, right) -> left + "\n" + right)
                    .orElse("");
            if (rawText.isBlank()) {
                return fallback(expectedFullName, expectedStudentCode, expectedUniversity, "AWS Textract did not detect text.");
            }
            return new Result(
                    detectFullName(rawText, expectedFullName),
                    detectStudentCode(rawText, expectedStudentCode),
                    detectUniversity(rawText, expectedUniversity),
                    rawText,
                    averageConfidence(lines));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read the uploaded student card image");
        } catch (TextractException exception) {
            String message = exception.awsErrorDetails() == null
                    ? "AWS Textract OCR request failed"
                    : exception.awsErrorDetails().errorMessage();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, message);
        } catch (RuntimeException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AWS Textract OCR is unavailable");
        }
    }

    private BigDecimal averageConfidence(List<Block> lines) {
        List<Float> values = lines.stream()
                .map(Block::confidence)
                .filter(confidence -> confidence != null && confidence >= 0)
                .toList();
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = values.stream()
                .map(confidence -> BigDecimal.valueOf(confidence.doubleValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
    }

    private String detectFullName(String rawText, String expectedFullName) {
        if (containsNormalized(rawText, expectedFullName)) {
            return expectedFullName;
        }
        return rawText.lines()
                .map(String::trim)
                .filter(line -> line.split("\\s+").length >= 2)
                .filter(line -> !line.matches(".*\\d.*"))
                .filter(line -> universityCatalog.detectInText(line).isBlank())
                .findFirst()
                .orElse("");
    }

    private String detectStudentCode(String rawText, String expectedStudentCode) {
        if (containsNormalized(rawText, expectedStudentCode)) {
            return expectedStudentCode;
        }
        Matcher matcher = STUDENT_CODE_PATTERN.matcher(rawText);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        matcher = FALLBACK_CODE_PATTERN.matcher(rawText.toUpperCase(Locale.ROOT));
        return matcher.find() ? matcher.group().trim() : "";
    }

    private String detectUniversity(String rawText, String expectedUniversity) {
        String detected = universityCatalog.detectInText(rawText);
        if (!detected.isBlank()) {
            return detected;
        }
        return universityCatalog.textMentions(rawText, expectedUniversity) ? expectedUniversity : "";
    }

    private Result fallback(String fullName, String studentCode, String university, String message) {
        return new Result(fullName, studentCode, university, message, BigDecimal.ZERO);
    }

    private boolean containsNormalized(String haystack, String needle) {
        String normalizedNeedle = normalize(needle);
        return !normalizedNeedle.isBlank() && normalize(haystack).contains(normalizedNeedle);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD))
                .replaceAll("")
                .replace('Đ', 'D')
                .replace('đ', 'd')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
