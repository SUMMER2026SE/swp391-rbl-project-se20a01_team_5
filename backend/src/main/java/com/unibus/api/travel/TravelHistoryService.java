package com.unibus.api.travel;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.model.Student;

@Service
public class TravelHistoryService {

    private final StudentRepository studentRepository;
    private final TravelHistoryRepository travelHistoryRepository;

    public TravelHistoryService(StudentRepository studentRepository, TravelHistoryRepository travelHistoryRepository) {
        this.studentRepository = studentRepository;
        this.travelHistoryRepository = travelHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<TravelHistoryRepository.TravelHistoryView> getHistory(CurrentUser currentUser, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be between 1 and 100");
        }
        Student student = studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
        return travelHistoryRepository.findRecentByStudentCode(student.getStudentCode(), size, page * size);
    }
}
