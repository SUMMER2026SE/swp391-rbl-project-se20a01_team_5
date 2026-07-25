package com.unibus.api.student;

import org.springframework.web.multipart.MultipartFile;

public interface OcrDocumentProvider {

    String providerName();

    OcrDocumentResult extract(MultipartFile cardImage);
}
