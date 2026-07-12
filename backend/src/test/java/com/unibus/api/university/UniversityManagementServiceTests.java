package com.unibus.api.university;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.university.UniversityDtos.ImportBatchView;
import com.unibus.api.university.UniversityDtos.RosterImportPreviewView;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmRequest;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmView;
import com.unibus.api.university.UniversityDtos.RosterImportCommitRequest;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityManagementRepository.RosterMatch;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@SpringBootTest
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class UniversityManagementServiceTests {

    @Autowired
    private UniversityManagementService service;

    @Autowired
    private UniversityManagementRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Integer universityId;
    private User universityAdmin;

    @BeforeEach
    void setUp() {
        createUniversityTables();
        jdbcTemplate.update("DELETE FROM audit_logs");
        jdbcTemplate.update("DELETE FROM university_import_errors");
        jdbcTemplate.update("DELETE FROM university_student_rosters");
        jdbcTemplate.update("DELETE FROM university_import_batches");
        jdbcTemplate.update("DELETE FROM university_admins");
        jdbcTemplate.update("DELETE FROM university_domains");
        jdbcTemplate.update("DELETE FROM subsidy_policies");
        jdbcTemplate.update("DELETE FROM route_universities");
        jdbcTemplate.update("DELETE FROM campuses");
        jdbcTemplate.update("DELETE FROM universities");
        studentRepository.deleteAll();
        userRepository.deleteAll();

        universityId = insertUniversity("UNI-TEST", "UniBus Test University");
        jdbcTemplate.update("""
                INSERT INTO university_domains(university_id, domain, status, verified_at)
                VALUES (?, 'unitest.edu.vn', 'ACTIVE', CURRENT_TIMESTAMP)
                """, universityId);
        universityAdmin = userRepository.save(user("admin@unitest.edu.vn", "University Admin", UserRole.UNIVERSITY_ADMIN));
    }

    @Test
    void importRosterStoresValidRowsAndRowErrors() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                Student.One@unitest.edu.vn,SE001,Student One,Software Engineering,2024,ACTIVE
                ,SE002,Missing Email,Software Engineering,2024,ACTIVE
                """.getBytes());

        ImportBatchView batch = service.importRoster(currentUser(), universityId, file);

        assertThat(batch.totalRows()).isEqualTo(2);
        assertThat(batch.successRows()).isEqualTo(1);
        assertThat(batch.errorRows()).isEqualTo(1);
        assertThat(batch.status()).isEqualTo("COMPLETED_WITH_ERRORS");
        assertThat(batch.errors()).hasSize(1);
        assertThat(batch.errors().get(0).fieldName()).isEqualTo("email");

        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::email)
                .containsExactly("student.one@unitest.edu.vn");
    }

    @Test
    void importRosterIgnoresLegacyCommentRowsButRejectsDuplicateEmailAndInvalidStatus() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                \uFEFFemail,studentCode,fullName,faculty,academicYear,status
                # Ghi chu: MSSV bat buoc, khong trung MSSV trong cung file
                Student.One@unitest.edu.vn,SE001,Student One,Software Engineering,2024,ACTIVE
                student.one@unitest.edu.vn,SE002,Duplicate Email,Software Engineering,2024,ACTIVE
                student.two@unitest.edu.vn,SE003,Bad Status,Software Engineering,2024,UNKNOWN
                """.getBytes());

        ImportBatchView batch = service.importRoster(currentUser(), universityId, file);

        assertThat(batch.totalRows()).isEqualTo(3);
        assertThat(batch.successRows()).isEqualTo(1);
        assertThat(batch.errorRows()).isEqualTo(2);
        assertThat(batch.errors())
                .extracting(error -> error.fieldName())
                .containsExactly("email", "status");
        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::studentCode)
                .containsExactly("SE001");
    }

    @Test
    void importRosterRejectsChangedHeaders() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,mssv,fullName,faculty,academicYear,status
                student.one@unitest.edu.vn,SE001,Student One,Software Engineering,2024,ACTIVE
                """.getBytes());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(currentUser(), universityId, file))
                .hasMessageContaining("headers");
    }

    @Test
    void importRosterParsesCsvWithBomWhitespaceReorderedHeadersQuotesAndBlankRows() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                \uFEFF studentCode , fullName , email , faculty , academicYear , status

                00123,"Nguyễn ""Văn"", A",STUDENT.ONE@unitest.edu.vn,"Khoa Công nghệ, thông tin",2024.0,active
                # Ghi chu: legacy template note
                """.getBytes(StandardCharsets.UTF_8));

        ImportBatchView batch = service.importRoster(currentUser(), universityId, file);

        assertThat(batch.totalRows()).isEqualTo(1);
        assertThat(batch.successRows()).isEqualTo(1);
        RosterStudentView row = service.listRoster(universityId, null, null).get(0);
        assertThat(row.studentCode()).isEqualTo("00123");
        assertThat(row.fullName()).isEqualTo("Nguyễn \"Văn\", A");
        assertThat(row.email()).isEqualTo("student.one@unitest.edu.vn");
        assertThat(row.faculty()).isEqualTo("Khoa Công nghệ, thông tin");
        assertThat(row.academicYear()).isEqualTo(2024);
        assertThat(row.status()).isEqualTo("ACTIVE");
    }

    @Test
    void importRosterReportsExactRowNumberForInvalidCsvRowAndDoesNotSkipRealHashData() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status

                #not-a-comment@unitest.edu.vn,SE001,Hash Student,Software,2024,ACTIVE
                missing-columns@unitest.edu.vn,SE002
                """.getBytes(StandardCharsets.UTF_8));

        ImportBatchView batch = service.importRoster(currentUser(), universityId, file);

        assertThat(batch.totalRows()).isEqualTo(2);
        assertThat(batch.successRows()).isEqualTo(1);
        assertThat(batch.errorRows()).isEqualTo(1);
        assertThat(batch.errors().get(0).rowNumber()).isEqualTo(4);
        assertThat(batch.errors().get(0).errorMessage()).contains("INVALID_COLUMN_COUNT");
        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::email)
                .containsExactly("#not-a-comment@unitest.edu.vn");
    }

    @Test
    void importRosterRejectsMissingDuplicateUnsupportedAndHeaderOnlyCsv() {
        assertImportRejected("""
                email,studentCode,fullName,faculty,academicYear
                student.one@unitest.edu.vn,SE001,Student One,Software,2024
                """, "MISSING_REQUIRED_HEADER");
        assertImportRejected("""
                email,studentCode,studentCode,fullName,faculty,academicYear,status
                student.one@unitest.edu.vn,SE001,SE002,Student One,Software,2024,ACTIVE
                """, "DUPLICATE_HEADER");
        assertImportRejected("""
                email,studentCode,fullName,faculty,academicYear,status,unknownColumn
                student.one@unitest.edu.vn,SE001,Student One,Software,2024,ACTIVE,x
                """, "UNSUPPORTED_HEADER");
        assertImportRejected("""
                email,studentCode,fullName,faculty,academicYear,status
                """, "EMPTY_FILE");
    }

    @Test
    void importRosterRejectsEmptyWrongExtensionWrongMimeAndTooLargeFile() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(
                        currentUser(),
                        universityId,
                        new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0])))
                .hasMessageContaining("EMPTY_FILE");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(
                        currentUser(),
                        universityId,
                        new MockMultipartFile("file", "roster.txt", "text/plain", "x".getBytes(StandardCharsets.UTF_8))))
                .hasMessageContaining("UNSUPPORTED_FILE_TYPE");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(
                        currentUser(),
                        universityId,
                        new MockMultipartFile("file", "roster.csv", "application/pdf", "x".getBytes(StandardCharsets.UTF_8))))
                .hasMessageContaining("UNSUPPORTED_FILE_TYPE");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(
                        currentUser(),
                        universityId,
                        new MockMultipartFile("file", "roster.csv", "text/csv", new byte[5 * 1024 * 1024 + 1])))
                .hasMessageContaining("FILE_TOO_LARGE");
    }

    @Test
    void importRosterParsesXlsxImportSheetAndRejectsFormulaCell() throws Exception {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            workbook.createSheet("Hướng dẫn").createRow(0).createCell(0).setCellValue("not import");
            Sheet sheet = workbook.createSheet("Danh sách sinh viên");
            sheet.createRow(0);
            sheet.getRow(0).createCell(0).setCellValue("email");
            sheet.getRow(0).createCell(1).setCellValue("studentCode");
            sheet.getRow(0).createCell(2).setCellValue("fullName");
            sheet.getRow(0).createCell(3).setCellValue("faculty");
            sheet.getRow(0).createCell(4).setCellValue("academicYear");
            sheet.getRow(0).createCell(5).setCellValue("status");
            sheet.createRow(1);
            sheet.getRow(1).createCell(0).setCellValue("student.one@unitest.edu.vn");
            sheet.getRow(1).createCell(1).setCellValue("00123");
            sheet.getRow(1).createCell(2).setCellValue("Student One");
            sheet.getRow(1).createCell(3).setCellValue("Software");
            sheet.getRow(1).createCell(4).setCellValue(2024.0);
            sheet.getRow(1).createCell(5).setCellValue("ACTIVE");
            sheet.createRow(2);
            sheet.getRow(2).createCell(0).setCellFormula("\"bad@unitest.edu.vn\"");
            sheet.getRow(2).createCell(1).setCellValue("SE002");
            sheet.getRow(2).createCell(2).setCellValue("Formula Student");
            sheet.getRow(2).createCell(3).setCellValue("Software");
            sheet.getRow(2).createCell(4).setCellValue(2024.0);
            sheet.getRow(2).createCell(5).setCellValue("ACTIVE");
            workbook.write(output);
            bytes = output.toByteArray();
        }

        ImportBatchView batch = service.importRoster(currentUser(), universityId,
                new MockMultipartFile("file", "roster.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes));

        assertThat(batch.totalRows()).isEqualTo(2);
        assertThat(batch.successRows()).isEqualTo(1);
        assertThat(batch.errors().get(0).rowNumber()).isEqualTo(3);
        assertThat(batch.errors().get(0).errorMessage()).contains("UNSAFE_FORMULA_VALUE");
        assertThat(service.listRoster(universityId, null, null).get(0).studentCode()).isEqualTo("00123");
    }

    @Test
    void importRosterRejectsXlsxWhenImportSheetIsMissingInMultiSheetWorkbook() throws Exception {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            workbook.createSheet("Hướng dẫn").createRow(0).createCell(0).setCellValue("not import");
            workbook.createSheet("Danh mục").createRow(0).createCell(0).setCellValue("not import");
            workbook.write(output);
            bytes = output.toByteArray();
        }

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(
                        currentUser(),
                        universityId,
                        new MockMultipartFile("file", "roster.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes)))
                .hasMessageContaining("IMPORT_SHEET_NOT_FOUND");
    }

    @Test
    void previewRosterImportValidatesRowsAndDoesNotWriteDatabase() {
        repository.upsertRoster(
                universityId,
                "existing@unitest.edu.vn",
                "SE999",
                "Existing Student",
                "Software",
                2024,
                "ACTIVE",
                null);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                new@unitest.edu.vn,00123,Nguyen Van A,Software,2024,ACTIVE
                duplicate@unitest.edu.vn,00123,Duplicate Student,Software,2024,ACTIVE
                fake@unitest.edu.vn.evil.com,SE002,Fake Domain,Software,2024,ACTIVE
                existing-other@unitest.edu.vn,SE999,Existing Code,Software,2024,ACTIVE
                existing@unitest.edu.vn,SE005,Existing Email,Software,2024,ACTIVE
                badyear@unitest.edu.vn,SE003,Bad Year,Software,24,ACTIVE
                badstatus@unitest.edu.vn,SE004,Bad Status,Software,2024,UNKNOWN
                """.getBytes(StandardCharsets.UTF_8));

        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);

        assertThat(preview.totalRows()).isEqualTo(7);
        assertThat(preview.validRows()).isEqualTo(2);
        assertThat(preview.errorRows()).isEqualTo(5);
        assertThat(preview.duplicateRows()).isEqualTo(1);
        assertThat(preview.createRows()).isEqualTo(1);
        assertThat(preview.existingRows()).isEqualTo(1);
        assertThat(preview.skippedRows()).isEqualTo(6);
        assertThat(preview.previewRows())
                .extracting(row -> row.studentCode(), row -> row.action())
                .contains(
                        org.assertj.core.api.Assertions.tuple("00123", "CREATE"),
                        org.assertj.core.api.Assertions.tuple("SE999", "SKIP_EXISTING"));
        assertThat(preview.errors())
                .extracting(error -> error.code())
                .contains(
                        "DUPLICATE_STUDENT_CODE_IN_FILE",
                        "INVALID_EMAIL_DOMAIN",
                        "EMAIL_ALREADY_EXISTS",
                        "INVALID_ACADEMIC_YEAR",
                        "INVALID_STATUS");
        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::studentCode)
                .containsExactly("SE999");
    }

    @Test
    void previewTokenIsBoundToCurrentUserAndScope() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                new@unitest.edu.vn,00123,Nguyen Van A,Software,2024,ACTIVE
                """.getBytes(StandardCharsets.UTF_8));
        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);

        assertThat(service.getRosterImportPreview(currentUser(), universityId, preview.previewToken()).previewToken())
                .isEqualTo(preview.previewToken());

        User otherAdmin = userRepository.save(user("other@unitest.edu.vn", "Other Admin", UserRole.UNIVERSITY_ADMIN));
        CurrentUser otherUser = new CurrentUser(otherAdmin.getId(), otherAdmin.getEmail(), otherAdmin.getRole(), 2L);

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        service.getRosterImportPreview(otherUser, universityId, preview.previewToken()))
                .hasMessageContaining("scope");
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        service.getRosterImportPreview(currentUser(), universityId, "missing-token"))
                .hasMessageContaining("not found");
    }

    @Test
    void confirmRosterImportUsesPreviewTokenAndAddNewOnlyPlanWithoutWritingDatabase() {
        repository.upsertRoster(
                universityId,
                "existing@unitest.edu.vn",
                "SE999",
                "Existing Student",
                "Software",
                2024,
                "ACTIVE",
                null);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                new@unitest.edu.vn,00123,Nguyen Van A,Software,2024,ACTIVE
                existing-other@unitest.edu.vn,SE999,Existing Code,Software,2024,ACTIVE
                badstatus@unitest.edu.vn,SE004,Bad Status,Software,2024,UNKNOWN
                """.getBytes(StandardCharsets.UTF_8));
        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);

        RosterImportConfirmView confirmation = service.confirmRosterImport(
                currentUser(),
                universityId,
                new RosterImportConfirmRequest(preview.previewToken(), "ADD_NEW_ONLY"));

        assertThat(confirmation.mode()).isEqualTo("ADD_NEW_ONLY");
        assertThat(confirmation.totalRows()).isEqualTo(3);
        assertThat(confirmation.createRows()).isEqualTo(1);
        assertThat(confirmation.updateRows()).isZero();
        assertThat(confirmation.skippedExistingRows()).isEqualTo(1);
        assertThat(confirmation.errorRows()).isEqualTo(1);
        assertThat(confirmation.importableRows()).isEqualTo(1);
        assertThat(confirmation.canConfirm()).isTrue();
        assertThat(confirmation.confirmLabel()).contains("1");
        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::studentCode)
                .containsExactly("SE999");
    }

    @Test
    void confirmRosterImportRejectsUnsupportedUpdateModeAndBlocksWhenNoNewRows() {
        repository.upsertRoster(
                universityId,
                "existing@unitest.edu.vn",
                "SE999",
                "Existing Student",
                "Software",
                2024,
                "ACTIVE",
                null);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                existing@unitest.edu.vn,SE999,Existing Student,Software,2024,ACTIVE
                """.getBytes(StandardCharsets.UTF_8));
        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);

        RosterImportConfirmView confirmation = service.confirmRosterImport(
                currentUser(),
                universityId,
                new RosterImportConfirmRequest(preview.previewToken(), null));

        assertThat(confirmation.canConfirm()).isFalse();
        assertThat(confirmation.createRows()).isZero();
        assertThat(confirmation.skippedExistingRows()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        service.confirmRosterImport(
                                currentUser(),
                                universityId,
                                new RosterImportConfirmRequest(preview.previewToken(), "UPDATE_EXISTING")))
                .hasMessageContaining("ADD_NEW_ONLY");
    }

    @Test
    void commitRosterImportWritesOnlyNewRowsAndIsIdempotent() {
        repository.upsertRoster(
                universityId,
                "existing@unitest.edu.vn",
                "SE999",
                "Existing Student",
                "Software",
                2024,
                "ACTIVE",
                null);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                new.one@unitest.edu.vn,00123,Nguyen Van A,Software,2024,ACTIVE
                new.two@unitest.edu.vn,00124,Tran Van B,Software,2025,
                existing-other@unitest.edu.vn,SE999,Existing Code,Software,2024,ACTIVE
                badstatus@unitest.edu.vn,SE004,Bad Status,Software,2024,UNKNOWN
                """.getBytes(StandardCharsets.UTF_8));
        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);

        ImportBatchView first = service.commitRosterImport(
                currentUser(),
                universityId,
                new RosterImportCommitRequest(preview.previewToken(), "ADD_NEW_ONLY", "idem-1"));
        ImportBatchView second = service.commitRosterImport(
                currentUser(),
                universityId,
                new RosterImportCommitRequest(preview.previewToken(), "ADD_NEW_ONLY", "idem-1"));

        assertThat(second.importBatchId()).isEqualTo(first.importBatchId());
        assertThat(first.totalRows()).isEqualTo(4);
        assertThat(first.successRows()).isEqualTo(2);
        assertThat(first.errorRows()).isEqualTo(2);
        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::studentCode)
                .containsExactlyInAnyOrder("SE999", "00123", "00124");
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM university_student_rosters
                WHERE university_id = ?
                """, Integer.class, universityId);
        assertThat(count).isEqualTo(3);
    }

    @Test
    void commitRosterImportRejectsOtherUserAndUnsupportedMode() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                new.one@unitest.edu.vn,00123,Nguyen Van A,Software,2024,ACTIVE
                """.getBytes(StandardCharsets.UTF_8));
        RosterImportPreviewView preview = service.previewRosterImport(currentUser(), universityId, file);
        User otherAdmin = userRepository.save(user("other-commit@unitest.edu.vn", "Other Admin", UserRole.UNIVERSITY_ADMIN));
        CurrentUser otherUser = new CurrentUser(otherAdmin.getId(), otherAdmin.getEmail(), otherAdmin.getRole(), 2L);

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        service.commitRosterImport(
                                otherUser,
                                universityId,
                                new RosterImportCommitRequest(preview.previewToken(), "ADD_NEW_ONLY", "idem-2")))
                .hasMessageContaining("scope");
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        service.commitRosterImport(
                                currentUser(),
                                universityId,
                                new RosterImportCommitRequest(preview.previewToken(), "UPDATE_EXISTING", "idem-3")))
                .hasMessageContaining("ADD_NEW_ONLY");
    }

    @Test
    void exportRosterCsvIsScopedEscapedAndKeepsLeadingZeroStudentCode() {
        Integer otherUniversityId = insertUniversity("UNI-OTHER", "Other University");
        repository.upsertRoster(
                universityId,
                "student.one@unitest.edu.vn",
                "00123",
                "Nguyễn \"Văn\", A",
                "Khoa Công nghệ, thông tin",
                2024,
                "ACTIVE",
                null);
        repository.upsertRoster(
                otherUniversityId,
                "student.other@other.edu.vn",
                "OTHER001",
                "Other Student",
                "Other Faculty",
                2024,
                "ACTIVE",
                null);

        UniversityManagementService.RosterExportFile file = service.exportRosterCsv(
                currentUser(),
                universityId,
                null,
                null,
                "csv");
        String csv = new String(file.bytes(), StandardCharsets.UTF_8);

        assertThat(file.fileName()).startsWith("danh-sach-sinh-vien_uni-test_");
        assertThat(csv).startsWith("\uFEFF\"studentCode\"");
        assertThat(csv).contains("\"=\"\"00123\"\"\"");
        assertThat(csv).contains("\"Nguyễn \"\"Văn\"\", A\"");
        assertThat(csv).contains("\"Khoa Công nghệ, thông tin\"");
        assertThat(csv).contains("\"Đang học\"");
        assertThat(csv).doesNotContain("OTHER001");
    }

    @Test
    void exportRosterCsvDoesNotUseRosterScreenLimit() {
        for (int index = 0; index < 205; index++) {
            repository.upsertRoster(
                    universityId,
                    "student" + index + "@unitest.edu.vn",
                    "SE" + String.format("%03d", index),
                    "Student " + index,
                    "Software Engineering",
                    2024,
                    "ACTIVE",
                    null);
        }

        UniversityManagementService.RosterExportFile file = service.exportRosterCsv(
                currentUser(),
                universityId,
                null,
                null,
                "csv");
        String csv = new String(file.bytes(), StandardCharsets.UTF_8);

        assertThat(csv.split("\\r\\n")).hasSize(206);
        assertThat(csv).contains("SE204");
    }

    @Test
    void rosterTemplateWorkbookHasThreeSheetsHeadersValidationAndScopedCatalog() throws Exception {
        Integer otherUniversityId = insertUniversity("UNI-OTHER", "Other University");
        jdbcTemplate.update("""
                INSERT INTO campuses(university_id, code, name, address, status)
                VALUES (?, 'CS1', 'Cơ sở 1', 'Đà Nẵng', 'ACTIVE')
                """, universityId);
        jdbcTemplate.update("""
                INSERT INTO campuses(university_id, code, name, address, status)
                VALUES (?, 'OTHER', 'Other Campus', 'Other', 'ACTIVE')
                """, otherUniversityId);
        repository.upsertRoster(
                universityId,
                "student.one@unitest.edu.vn",
                "SE001",
                "Student One",
                "Công nghệ thông tin",
                2024,
                "ACTIVE",
                null);

        byte[] bytes = service.rosterTemplate(universityId);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(3);
            assertThat(workbook.getSheetName(0)).isEqualTo("Danh sách sinh viên");
            assertThat(workbook.getSheetName(1)).isEqualTo("Hướng dẫn");
            assertThat(workbook.getSheetName(2)).isEqualTo("Danh mục");

            Sheet importSheet = workbook.getSheetAt(0);
            assertThat(importSheet.getRow(0).getCell(0).getStringCellValue()).isEqualTo("email");
            assertThat(importSheet.getRow(0).getCell(1).getStringCellValue()).isEqualTo("studentCode");
            assertThat(importSheet.getRow(0).getCell(2).getStringCellValue()).isEqualTo("fullName");
            assertThat(importSheet.getRow(0).getCell(3).getStringCellValue()).isEqualTo("faculty");
            assertThat(importSheet.getRow(0).getCell(4).getStringCellValue()).isEqualTo("academicYear");
            assertThat(importSheet.getRow(0).getCell(5).getStringCellValue()).isEqualTo("status");
            assertThat(importSheet.getLastRowNum()).isZero();
            assertThat(importSheet.getColumnStyle(1).getDataFormatString()).isEqualTo("@");
            assertThat(importSheet.getDataValidations()).isNotEmpty();
            assertThat(importSheet.getRow(0).getCell(1).getCellComment().getString().getString()).contains("MSSV");

            Sheet catalogSheet = workbook.getSheetAt(2);
            assertThat(catalogSheet.getRow(1).getCell(3).getStringCellValue()).isEqualTo("@unitest.edu.vn");
            assertThat(catalogSheet.getRow(1).getCell(5).getStringCellValue()).isEqualTo("CS1");
            assertThat(catalogSheet.getRow(1).getCell(6).getStringCellValue()).isEqualTo("Cơ sở 1");
            assertThat(catalogSheet.getRow(1).getCell(9).getStringCellValue()).isEqualTo("Công nghệ thông tin");
            assertThat(catalogSheet.getRow(2)).isNotNull();
            assertThat(catalogSheet.getRow(2).getCell(6)).isNull();
        }
    }

    @Test
    void applyGoogleUniversityLinkCreatesVerifiedStudentFromActiveRoster() {
        User studentUser = userRepository.save(user("student.one@unitest.edu.vn", "student.one@unitest.edu.vn", UserRole.STUDENT));
        repository.upsertRoster(
                universityId,
                "student.one@unitest.edu.vn",
                "SE001",
                "Student One",
                "Software Engineering",
                2024,
                "ACTIVE",
                null);

        service.applyGoogleUniversityLink(studentUser);

        User reloaded = userRepository.findById(studentUser.getId()).orElseThrow();
        assertThat(reloaded.getStudentVerificationStatus()).isEqualTo(StudentVerificationStatus.VERIFIED);

        Student student = studentRepository.findByUserId(studentUser.getId()).orElseThrow();
        assertThat(student.getStudentCode()).isEqualTo("SE001");
        assertThat(student.getUniversityId()).isEqualTo(universityId);
        assertThat(student.getUniversity()).isEqualTo("UniBus Test University");

        RosterMatch match = repository.findActiveRosterByEmail("student.one@unitest.edu.vn").orElseThrow();
        Integer matchedUserId = jdbcTemplate.queryForObject("""
                SELECT matched_user_id
                FROM university_student_rosters
                WHERE roster_id = ?
                """, Integer.class, match.rosterId());
        assertThat(matchedUserId).isEqualTo(studentUser.getId());
    }

    private CurrentUser currentUser() {
        return new CurrentUser(universityAdmin.getId(), universityAdmin.getEmail(), universityAdmin.getRole(), 1L);
    }

    private void assertImportRejected(String csv, String code) {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.importRoster(currentUser(), universityId, file))
                .hasMessageContaining(code);
    }

    private User user(String email, String fullName, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("unused");
        user.setFullName(fullName);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return user;
    }

    private Integer insertUniversity(String code, String name) {
        jdbcTemplate.update("""
                INSERT INTO universities(code, name, short_name, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, code, name, "UTU");
        return jdbcTemplate.queryForObject(
                "SELECT university_id FROM universities WHERE code = ?",
                Integer.class,
                code);
    }

    private void createUniversityTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS universities (
                    university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    name VARCHAR(150) NOT NULL UNIQUE,
                    short_name VARCHAR(80),
                    contact_email VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS campuses (
                    campus_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    address VARCHAR(255),
                    latitude NUMERIC(10,8),
                    longitude NUMERIC(11,8),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS route_universities (
                    route_university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    active_from DATE DEFAULT CURRENT_DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS subsidy_policies (
                    subsidy_policy_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    policy_name VARCHAR(150) NOT NULL,
                    subsidy_type VARCHAR(20) NOT NULL,
                    "value" NUMERIC(12,2) NOT NULL,
                    max_amount NUMERIC(12,0),
                    active_from DATE DEFAULT CURRENT_DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_domains (
                    university_domain_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    domain VARCHAR(120) NOT NULL UNIQUE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    verified_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_admins (
                    university_admin_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL UNIQUE,
                    title VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    assigned_by_user_id INTEGER,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_import_batches (
                    import_batch_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    total_rows INTEGER DEFAULT 0 NOT NULL,
                    success_rows INTEGER DEFAULT 0 NOT NULL,
                    error_rows INTEGER DEFAULT 0 NOT NULL,
                    status VARCHAR(30) DEFAULT 'PROCESSING' NOT NULL,
                    imported_by_user_id INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_student_rosters (
                    roster_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    student_code VARCHAR(20) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    faculty VARCHAR(100),
                    academic_year INTEGER,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    matched_user_id INTEGER,
                    imported_batch_id BIGINT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(university_id, email),
                    UNIQUE(university_id, student_code)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_import_errors (
                    import_error_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    import_batch_id BIGINT NOT NULL,
                    row_number INTEGER NOT NULL,
                    field_name VARCHAR(80),
                    raw_value TEXT,
                    error_message VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    audit_log_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    performed_by_user_id INTEGER NOT NULL,
                    university_id INTEGER,
                    action VARCHAR(50) NOT NULL,
                    affected_table VARCHAR(50),
                    affected_record_id VARCHAR(50),
                    result VARCHAR(30),
                    request_id VARCHAR(80),
                    notes VARCHAR(500),
                    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """);
    }
}
