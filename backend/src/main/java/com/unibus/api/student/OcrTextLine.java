package com.unibus.api.student;

import java.math.BigDecimal;

public record OcrTextLine(
        String text,
        BigDecimal confidence,
        int index) {

    public OcrTextLine {
        text = text == null ? "" : text.trim();
    }
}
