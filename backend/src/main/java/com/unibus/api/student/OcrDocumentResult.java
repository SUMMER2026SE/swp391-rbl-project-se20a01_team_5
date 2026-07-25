package com.unibus.api.student;

import java.math.BigDecimal;
import java.util.List;

public record OcrDocumentResult(
        String rawText,
        BigDecimal averageConfidence,
        List<OcrTextLine> lines,
        String provider,
        OcrProcessingStatus status,
        String errorCode,
        String errorMessage) {

    public OcrDocumentResult(String rawText, BigDecimal averageConfidence, List<OcrTextLine> lines, String provider) {
        this(rawText, averageConfidence, lines, provider, OcrProcessingStatus.COMPLETED, null, null);
    }

    public OcrDocumentResult {
        rawText = rawText == null ? "" : rawText.trim();
        lines = lines == null ? List.of() : List.copyOf(lines);
        provider = provider == null ? "" : provider.trim();
        status = status == null ? OcrProcessingStatus.COMPLETED : status;
        errorCode = errorCode == null || errorCode.isBlank() ? null : errorCode.trim();
        errorMessage = errorMessage == null || errorMessage.isBlank() ? null : errorMessage.trim();
    }
}
