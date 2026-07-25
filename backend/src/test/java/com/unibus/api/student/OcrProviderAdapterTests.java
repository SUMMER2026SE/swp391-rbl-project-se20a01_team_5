package com.unibus.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

class OcrProviderAdapterTests {

    @Test
    void googleAndAwsAdaptersExposeSameProviderContract() {
        assertThat(OcrDocumentProvider.class).isAssignableFrom(GoogleVisionStudentCardOcrService.class);
        assertThat(OcrDocumentProvider.class).isAssignableFrom(AwsTextractStudentCardOcrService.class);
        assertThat(OcrDocumentProvider.class).isAssignableFrom(OcrSpaceStudentCardOcrService.class);

        assertThat(GoogleVisionStudentCardOcrService.class.getMethods())
                .filteredOn(method -> method.getName().equals("extract"))
                .allMatch(method -> method.getParameterCount() == 1);
        assertThat(AwsTextractStudentCardOcrService.class.getMethods())
                .filteredOn(method -> method.getName().equals("extract"))
                .allMatch(method -> method.getParameterCount() == 1);
        assertThat(OcrSpaceStudentCardOcrService.class.getMethods())
                .filteredOn(method -> method.getName().equals("extract"))
                .allMatch(method -> method.getParameterCount() == 1);
    }

    @Test
    void ocrSpaceAdapterReadsParsedTextBlocks() {
        OcrSpaceStudentCardOcrService provider = new OcrSpaceStudentCardOcrService(
                true, true, "test-key", "https://api.ocr.space/parse/image", "vnm", "2");

        String rawText = provider.extractRawText(Map.of(
                "ParsedResults", List.of(
                        Map.of("ParsedText", "THE SINH VIEN\nMSSV: DE2222"),
                        Map.of("ParsedText", "Dai hoc Duy Tan"))));

        assertThat(rawText).isEqualTo("THE SINH VIEN\nMSSV: DE2222\nDai hoc Duy Tan");
        assertThat(provider.linesFromRawText(rawText)).hasSize(3);
    }

    @Test
    void ocrSpaceAdapterReadsProcessingErrors() {
        OcrSpaceStudentCardOcrService provider = new OcrSpaceStudentCardOcrService(
                true, true, "test-key", "https://api.ocr.space/parse/image", "vnm", "2");

        String message = provider.extractErrorMessage(Map.of(
                "IsErroredOnProcessing", true,
                "ErrorMessage", List.of("File failed validation"),
                "ErrorDetails", "Unsupported image"));

        assertThat(message).isEqualTo("File failed validation");
    }

    @Test
    void googleConfidenceKeepsProviderScaleAndIgnoresNulls() throws Exception {
        GoogleVisionStudentCardOcrService provider = new GoogleVisionStudentCardOcrService(
                new ObjectMapper(), false, true, "");
        Method method = GoogleVisionStudentCardOcrService.class.getDeclaredMethod("averageConfidence", Map.class);
        method.setAccessible(true);

        Map<String, Object> response = Map.of("responses", List.of(Map.of(
                "fullTextAnnotation", Map.of("text", "hello"),
                "textAnnotations", List.of(
                        Map.of("description", "hello", "confidence", 0.95),
                        Map.of("description", "")))));

        assertThat((BigDecimal) method.invoke(provider, response)).isEqualByComparingTo("0.9500");
    }

    @Test
    void awsConfidenceConvertsPercentOnlyOnceAndIgnoresEmptyLines() throws Exception {
        AwsTextractStudentCardOcrService provider = new AwsTextractStudentCardOcrService(false, "ap-southeast-1");
        Method normalize = AwsTextractStudentCardOcrService.class.getDeclaredMethod("normalizeAwsConfidence", Float.class);
        normalize.setAccessible(true);
        Method average = AwsTextractStudentCardOcrService.class.getDeclaredMethod("averageConfidence", List.class);
        average.setAccessible(true);

        BigDecimal lineConfidence = (BigDecimal) normalize.invoke(provider, 95.0f);
        BigDecimal averageConfidence = (BigDecimal) average.invoke(provider, List.of(
                new OcrTextLine("student", lineConfidence, 0),
                new OcrTextLine("", BigDecimal.ZERO, 1)));

        assertThat(lineConfidence).isEqualByComparingTo("0.9500");
        assertThat(averageConfidence).isEqualByComparingTo("0.9500");
    }

    @Test
    void missingConfidenceRemainsNull() throws Exception {
        AwsTextractStudentCardOcrService provider = new AwsTextractStudentCardOcrService(false, "ap-southeast-1");
        Method normalize = AwsTextractStudentCardOcrService.class.getDeclaredMethod("normalizeAwsConfidence", Float.class);
        normalize.setAccessible(true);

        assertThat(normalize.invoke(provider, new Object[] { null })).isNull();
    }
}
