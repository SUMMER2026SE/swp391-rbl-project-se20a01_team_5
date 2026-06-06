package com.unibus.api.driver;

import com.unibus.api.driver.dto.DriverDtos.DriverActionResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverContact;
import com.unibus.api.driver.dto.DriverDtos.DriverContactPage;
import com.unibus.api.driver.dto.DriverDtos.DriverDashboard;
import com.unibus.api.driver.dto.DriverDtos.DriverProfile;
import com.unibus.api.driver.dto.DriverDtos.DriverSchedule;
import com.unibus.api.driver.dto.DriverDtos.DriverStop;
import com.unibus.api.driver.dto.DriverDtos.DriverTrip;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DriverService {
    private static final String CURRENT_TRIP_ID = "ITER1-TRIP-01";

    public DriverDashboard dashboard() {
        DriverTrip trip = currentTrip();
        return new DriverDashboard(trip, nextSchedules(), trip.status());
    }

    public DriverTrip currentTrip() {
        return new DriverTrip(
                CURRENT_TRIP_ID,
                "ITER1 - Campus Loop",
                "IN_PROGRESS",
                "43B-ITER1-01",
                "Nguyen Minh Tai",
                "Tran Phu Xe",
                "0901234567",
                "Le Dieu Phoi",
                "0909988776",
                "07:15",
                "08:00",
                32,
                28,
                45,
                98,
                "Khong co canh bao",
                List.of(
                        new DriverStop(1, "Ky tuc xa phia Dong", "07:15", "passed"),
                        new DriverStop(2, "Dai hoc Bach khoa", "07:26", "passed"),
                        new DriverStop(3, "Cau Rong", "07:38", "current"),
                        new DriverStop(4, "Dai hoc Kinh te", "07:50", "upcoming"),
                        new DriverStop(5, "Ben xe trung tam", "08:00", "upcoming")));
    }

    public List<DriverSchedule> nextSchedules() {
        return List.of(
                new DriverSchedule("SCH-01", "09:00 - 09:45", "ITER1 - City Connector", "UPCOMING"),
                new DriverSchedule("SCH-02", "14:00 - 14:45", "ITER1 - Campus Loop", "UPCOMING"));
    }

    public DriverContactPage contacts() {
        DriverContact dispatcher = new DriverContact("Le Dieu Phoi", "DISPATCHER", "0909988776", "ONLINE");
        return new DriverContactPage(
                dispatcher,
                List.of(
                        dispatcher,
                        new DriverContact("Tran Phu Xe", "CONDUCTOR", "0901234567", "ON_TRIP")),
                List.of("TECHNICAL", "TRAFFIC_JAM", "MEDICAL_EMERGENCY", "OTHER"));
    }

    public DriverProfile profile() {
        return new DriverProfile(
                "DRV-ITER1-01",
                "Nguyen Minh Tai",
                "0905551234",
                "driver.iter1@unibus.vn",
                "Da Nang",
                128,
                64,
                98,
                "E",
                LocalDate.of(2028, 12, 31),
                "VALID");
    }

    public DriverActionResponse startTrip(String tripId) {
        return action("STARTED", "Chuyen xe da bat dau", currentTrip());
    }

    public DriverActionResponse endTrip(String tripId) {
        return action("COMPLETED", "Chuyen xe da ket thuc", currentTrip());
    }

    public DriverActionResponse reportIncident(String incidentType) {
        String type = incidentType == null || incidentType.isBlank() ? "OTHER" : incidentType;
        return action("REPORTED", "Da gui bao cao su co: " + type, currentTrip());
    }

    public DriverActionResponse sendMessage(String message) {
        return action("SENT", "Tin nhan da gui", currentTrip());
    }

    private DriverActionResponse action(String status, String message, DriverTrip trip) {
        return new DriverActionResponse(status, message, trip);
    }
}
