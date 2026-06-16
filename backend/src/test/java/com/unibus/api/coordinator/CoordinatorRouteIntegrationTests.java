package com.unibus.api.coordinator;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.web.servlet.MockMvc;

import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.StopRepository;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class CoordinatorRouteIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BusRouteRepository busRouteRepository;

    @Autowired
    private StopRepository stopRepository;

    @Autowired
    private RouteStopRepository routeStopRepository;

    private BusRoute testRoute;

    @BeforeEach
    void setup() {
        routeStopRepository.deleteAll();
        stopRepository.deleteAll();
        busRouteRepository.deleteAll();

        // Tạo sẵn một Tuyến xe để test
        BusRoute route = new BusRoute();
        route.setRouteName("Test Route");
        route.setStatus(RouteStatus.ACTIVE);
        route.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        testRoute = busRouteRepository.save(route);
    }

    @Test
    void rejectsRequestsWithoutAuthentication() throws Exception {
        // Không đăng nhập -> 401 Unauthorized
        mockMvc.perform(get("/api/v1/coordinator/routes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void rejectsRequestsWithWrongRole() throws Exception {
        // Có đăng nhập nhưng sai role (STUDENT) -> 403 Forbidden
        mockMvc.perform(get("/api/v1/coordinator/routes"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void getRoutesReturnsCorrectListForDispatcher() throws Exception {
        mockMvc.perform(get("/api/v1/coordinator/routes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(testRoute.getId()))
                .andExpect(jsonPath("$.data[0].routeName").value("Test Route"));
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void dispatcherCanAddAndRetrieveStops() throws Exception {
        // Thêm Trạm 1
        String req1 = "{\"stopName\": \"Trạm A\", \"address\": \"A\", \"longitude\": 10.0, \"latitude\": 10.0, \"stopOrder\": 1, \"minutesFromPreviousStop\": 0}";
        mockMvc.perform(post("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(req1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stopName").value("Trạm A"));

        // Thêm Trạm 2
        String req2 = "{\"stopName\": \"Trạm B\", \"address\": \"B\", \"longitude\": 10.0, \"latitude\": 10.0, \"stopOrder\": 2, \"minutesFromPreviousStop\": 15}";
        mockMvc.perform(post("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(req2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stopName").value("Trạm B"));

        // Lấy danh sách trạm
        mockMvc.perform(get("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].stopName").value("Trạm A"))
                .andExpect(jsonPath("$.data[0].minutesFromPreviousStop").value(0))
                .andExpect(jsonPath("$.data[1].stopName").value("Trạm B"))
                .andExpect(jsonPath("$.data[1].minutesFromPreviousStop").value(15));
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void dispatcherCanUpdateStop() throws Exception {
        // Setup 1 trạm có sẵn
        Stop stop = new Stop();
        stop.setStopName("Old Name");
        stop.setStatus(RouteStatus.ACTIVE);
        stop.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        stop = stopRepository.save(stop);

        RouteStop rs = new RouteStop();
        rs.setRoute(testRoute);
        rs.setStop(stop);
        rs.setStopOrder(1);
        rs.setMinutesFromPreviousStop(0);
        routeStopRepository.save(rs);

        // Đổi tên trạm
        String req = "{\"id\": " + rs.getId() + ", \"stopId\": " + stop.getId() + ", \"stopName\": \"New Name\", \"stopOrder\": 1, \"minutesFromPreviousStop\": 0}";
        mockMvc.perform(put("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops/" + rs.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(req))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stopName").value("New Name"));
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void dispatcherCanDeleteStop() throws Exception {
        // Setup 1 trạm có sẵn
        Stop stop = new Stop();
        stop.setStopName("To Be Deleted");
        stop.setStatus(RouteStatus.ACTIVE);
        stop.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        stop = stopRepository.save(stop);

        RouteStop rs = new RouteStop();
        rs.setRoute(testRoute);
        rs.setStop(stop);
        rs.setStopOrder(1);
        rs.setMinutesFromPreviousStop(0);
        routeStopRepository.save(rs);

        // Xóa trạm
        mockMvc.perform(delete("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops/" + rs.getId()))
                .andExpect(status().isOk());

        // Kiểm tra danh sách rỗng
        mockMvc.perform(get("/api/v1/coordinator/routes/" + testRoute.getId() + "/stops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }
}