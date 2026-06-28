package com.unibus.api.driverRating;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingSummary;
import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingView;
import com.unibus.api.driverRating.DriverRatingDtos.SubmitDriverRatingRequest;
import com.unibus.api.driverRating.DriverRatingRepository.TripReviewContext;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.model.Student;

@Service
public class DriverRatingService {

    private static final String COMPLETED_STATUS = "COMPLETED";

    private final StudentRepository studentRepository;
    private final DriverRatingRepository driverRatingRepository;

    public DriverRatingService(
            StudentRepository studentRepository,
            DriverRatingRepository driverRatingRepository) {
        this.studentRepository = studentRepository;
        this.driverRatingRepository = driverRatingRepository;
    }

    @Transactional
    public DriverRatingView submit(CurrentUser currentUser, SubmitDriverRatingRequest request) {
        Student student = currentStudent(currentUser);
        requireExistingDriver(request.driverId());
        TripReviewContext trip = findTrip(request.tripId());
        requireCompletedTrip(trip);
        requireTripDriver(trip, request.driverId());
        requireStudentTravelled(student.getStudentCode(), request.tripId());
        requireNotRated(student.getStudentCode(), request.tripId());

        DriverRatingView rating = driverRatingRepository.create(
                student.getStudentCode(),
                request.driverId(),
                request.tripId(),
                request.rating(),
                normalizeComment(request.comment()));
        driverRatingRepository.refreshDriverAverageRating(request.driverId());
        return rating;
    }

    @Transactional(readOnly = true)
    public List<DriverRatingView> listByDriver(Integer driverId, int page, int size) {
        validatePage(page, size);
        requireExistingDriver(driverId);
        return driverRatingRepository.findByDriverId(driverId, size, page * size);
    }

    @Transactional(readOnly = true)
    public DriverRatingSummary summarize(Integer driverId) {
        requireExistingDriver(driverId);
        return driverRatingRepository.summarize(driverId);
    }

    private Student currentStudent(CurrentUser currentUser) {
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Only students can rate drivers"));
    }

    private void requireExistingDriver(Integer driverId) {
        if (!driverRatingRepository.driverExists(driverId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Driver not found");
        }
    }

    private TripReviewContext findTrip(Integer tripId) {
        TripReviewContext trip = driverRatingRepository.findTripReviewContext(tripId);
        if (trip == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        return trip;
    }

    private void requireCompletedTrip(TripReviewContext trip) {
        if (!COMPLETED_STATUS.equals(trip.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Driver can be rated only after the trip is completed");
        }
    }

    private void requireTripDriver(TripReviewContext trip, Integer driverId) {
        if (!driverId.equals(trip.driverId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Driver is not assigned to this trip");
        }
    }

    private void requireStudentTravelled(String studentCode, Integer tripId) {
        if (!driverRatingRepository.studentTravelledOnTrip(studentCode, tripId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student did not travel on this trip");
        }
    }

    private void requireNotRated(String studentCode, Integer tripId) {
        if (driverRatingRepository.alreadyRated(studentCode, tripId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Driver already rated for this trip");
        }
    }

    private String normalizeComment(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }
        return comment.trim();
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be between 1 and 100");
        }
    }
}
