package com.unibus.api.student;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
public class AwsTextractStudentCardOcrService implements OcrDocumentProvider {

    private static final String PROVIDER = "aws";

    private final TextractClient textractClient;
    private final boolean enabled;

    public AwsTextractStudentCardOcrService(
            @Value("${app.ocr.enabled:false}") boolean enabled,
            @Value("${app.aws.region:ap-southeast-1}") String awsRegion) {
        this.enabled = enabled;
        this.textractClient = TextractClient.builder()
                .region(Region.of(awsRegion == null || awsRegion.isBlank() ? "ap-southeast-1" : awsRegion.trim()))
                .build();
    }

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public OcrDocumentResult extract(MultipartFile cardImage) {
        if (!enabled) {
            return new OcrDocumentResult(
                    "OCR is disabled for this environment.",
                    null,
                    List.of(),
                    PROVIDER,
                    OcrProcessingStatus.DISABLED,
                    null,
                    "OCR is disabled for this environment.");
        }
        try {
            DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
                    .document(Document.builder()
                            .bytes(SdkBytes.fromByteArray(cardImage.getBytes()))
                            .build())
                    .build();
            List<Block> blocks = textractClient.detectDocumentText(request).blocks();
            List<OcrTextLine> lines = toLines(blocks);
            String rawText = lines.stream()
                    .map(OcrTextLine::text)
                    .reduce((left, right) -> left + "\n" + right)
                    .orElse("");
            return new OcrDocumentResult(rawText, averageConfidence(lines), lines, PROVIDER);
        } catch (IOException exception) {
            throw new OcrProviderException("IMAGE_READ_FAILED", "Unable to read the uploaded student card image", exception);
        } catch (TextractException exception) {
            String message = exception.awsErrorDetails() == null
                    ? "AWS Textract OCR request failed"
                    : exception.awsErrorDetails().errorMessage();
            throw new OcrProviderException("AWS_TEXTRACT_REQUEST_FAILED", message, exception);
        } catch (RuntimeException exception) {
            throw new OcrProviderException("AWS_TEXTRACT_UNAVAILABLE", "AWS Textract OCR is unavailable", exception);
        }
    }

    private List<OcrTextLine> toLines(List<Block> blocks) {
        List<OcrTextLine> lines = new ArrayList<>();
        if (blocks == null) {
            return lines;
        }
        int index = 0;
        for (Block block : blocks) {
            if (block.blockType() != BlockType.LINE || block.text() == null || block.text().isBlank()) {
                continue;
            }
            lines.add(new OcrTextLine(block.text(), normalizeAwsConfidence(block.confidence()), index++));
        }
        return lines;
    }

    private BigDecimal averageConfidence(List<OcrTextLine> lines) {
        BigDecimal weightedTotal = BigDecimal.ZERO;
        int totalWeight = 0;
        for (OcrTextLine line : lines) {
            if (line.confidence() == null || line.text().isBlank()) {
                continue;
            }
            int weight = Math.max(1, line.text().length());
            weightedTotal = weightedTotal.add(line.confidence().multiply(BigDecimal.valueOf(weight)));
            totalWeight += weight;
        }
        if (totalWeight == 0) {
            return null;
        }
        return weightedTotal.divide(BigDecimal.valueOf(totalWeight), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeAwsConfidence(Float confidence) {
        if (confidence == null || confidence < 0) {
            return null;
        }
        return BigDecimal.valueOf(confidence.doubleValue())
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
    }
}
