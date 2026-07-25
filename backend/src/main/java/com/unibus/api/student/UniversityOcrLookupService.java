package com.unibus.api.student;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UniversityOcrLookupService {

    private final JdbcTemplate jdbcTemplate;

    public UniversityOcrLookupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<String> variantsFor(String selectedUniversity) {
        LinkedHashSet<String> variants = new LinkedHashSet<>();
        if (selectedUniversity != null && !selectedUniversity.isBlank()) {
            variants.add(selectedUniversity.trim());
            addDerivedVariants(variants, selectedUniversity);
        }
        try {
            String normalized = OcrTextNormalizer.normalized(selectedUniversity);
            if (normalized.isBlank()) {
                return List.copyOf(variants);
            }
            List<String> rows = jdbcTemplate.query("""
                    SELECT name, short_name, code
                    FROM universities
                    WHERE status = 'ACTIVE'
                    """, (rs, rowNum) -> List.of(
                    nullToBlank(rs.getString("name")),
                    nullToBlank(rs.getString("short_name")),
                    nullToBlank(rs.getString("code"))))
                    .stream()
                    .flatMap(List::stream)
                    .toList();
            rows.stream()
                    .filter(value -> matchesSelected(value, selectedUniversity))
                    .forEach(value -> {
                        variants.add(value);
                        addDerivedVariants(variants, value);
                    });
        } catch (DataAccessException ignored) {
            return List.copyOf(variants);
        }
        return List.copyOf(variants);
    }

    public List<String> variantsForTesting(String selectedUniversity, List<String> databaseValues) {
        LinkedHashSet<String> variants = new LinkedHashSet<>();
        if (selectedUniversity != null && !selectedUniversity.isBlank()) {
            variants.add(selectedUniversity.trim());
            addDerivedVariants(variants, selectedUniversity);
        }
        new ArrayList<>(databaseValues == null ? List.of() : databaseValues).stream()
                .filter(value -> matchesSelected(value, selectedUniversity))
                .forEach(value -> {
                    variants.add(value);
                    addDerivedVariants(variants, value);
                });
        return List.copyOf(variants);
    }

    private void addDerivedVariants(LinkedHashSet<String> variants, String value) {
        String normalized = OcrTextNormalizer.normalized(value);
        if (normalized.startsWith("truong dai hoc ")) {
            variants.add(normalized.substring("truong ".length()).trim());
        }
        for (String prefix : List.of("truong dai hoc ", "dai hoc ", "university of ")) {
            if (normalized.startsWith(prefix)) {
                variants.add(normalized.substring(prefix.length()).trim());
            }
        }
    }

    private boolean matchesSelected(String value, String selectedUniversity) {
        String candidate = OcrTextNormalizer.normalized(value);
        String selected = OcrTextNormalizer.normalized(selectedUniversity);
        return !candidate.isBlank()
                && !selected.isBlank()
                && (candidate.equals(selected)
                || candidate.contains(selected)
                || selected.contains(candidate)
                || OcrTextNormalizer.similarity(candidate, selected).doubleValue() >= 0.70);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }
}
