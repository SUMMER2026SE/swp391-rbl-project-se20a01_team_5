package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.AuthDtos.LoginRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.GpsRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.TripResponse;
import com.bussvdn.backend.service.AuthService;
import com.bussvdn.backend.service.DriverAssistantService;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/tai-xe")
public class TaiXePageController {
    private final AuthService authService;
    private final DriverAssistantService service;

    public TaiXePageController(AuthService authService, DriverAssistantService service) {
        this.authService = authService;
        this.service = service;
    }

    @GetMapping
    public String home() {
        return "tai-xe/index";
    }

    @GetMapping("/dang-nhap")
    public String loginPage() {
        return "tai-xe/login";
    }

    @PostMapping("/dang-nhap")
    public String login(@RequestParam String email, @RequestParam String matKhau, @RequestParam String vaiTro, Model model) {
        model.addAttribute("result", authService.login(new LoginRequest(email, matKhau, vaiTro)));
        return "tai-xe/login-result";
    }

    @GetMapping("/lich-chay")
    public String schedules(@RequestParam(defaultValue = "1") Integer maTaiXe, Model model) {
        model.addAttribute("maTaiXe", maTaiXe);
        model.addAttribute("schedules", service.driverSchedules(maTaiXe));
        return "tai-xe/schedules";
    }

    @GetMapping("/chuyen-duoc-phan-cong")
    public String trips(
            @RequestParam(defaultValue = "1") Integer maTaiXe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Model model) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(7) : to;
        model.addAttribute("maTaiXe", maTaiXe);
        model.addAttribute("from", start);
        model.addAttribute("to", end);
        model.addAttribute("trips", service.driverTrips(maTaiXe, start, end));
        return "tai-xe/trips";
    }

    @GetMapping("/bat-dau-chuyen/{maChuyenXe}")
    public String startTripPage(@RequestParam(defaultValue = "1") Integer maTaiXe, @PathVariable Integer maChuyenXe, Model model) {
        model.addAttribute("maTaiXe", maTaiXe);
        model.addAttribute("maChuyenXe", maChuyenXe);
        return "tai-xe/start-trip";
    }

    @PostMapping("/bat-dau-chuyen/{maChuyenXe}")
    public String startTrip(
            @RequestParam Integer maTaiXe,
            @PathVariable Integer maChuyenXe,
            @RequestParam(required = false) BigDecimal kinhDo,
            @RequestParam(required = false) BigDecimal viDo,
            @RequestParam(required = false) BigDecimal tocDo,
            Model model) {
        TripResponse trip = service.startTrip(maTaiXe, maChuyenXe, new GpsRequest(kinhDo, viDo, tocDo, null));
        model.addAttribute("trip", trip);
        model.addAttribute("action", "Started");
        return "tai-xe/trip-action-result";
    }

    @GetMapping("/ket-thuc-chuyen/{maChuyenXe}")
    public String endTripPage(@RequestParam(defaultValue = "1") Integer maTaiXe, @PathVariable Integer maChuyenXe, Model model) {
        model.addAttribute("maTaiXe", maTaiXe);
        model.addAttribute("maChuyenXe", maChuyenXe);
        return "tai-xe/end-trip";
    }

    @PostMapping("/ket-thuc-chuyen/{maChuyenXe}")
    public String endTrip(
            @RequestParam Integer maTaiXe,
            @PathVariable Integer maChuyenXe,
            @RequestParam(required = false) BigDecimal kinhDo,
            @RequestParam(required = false) BigDecimal viDo,
            @RequestParam(required = false) BigDecimal tocDo,
            @RequestParam(required = false) String ghiChu,
            Model model) {
        TripResponse trip = service.endTrip(maTaiXe, maChuyenXe, new GpsRequest(kinhDo, viDo, tocDo, ghiChu));
        model.addAttribute("trip", trip);
        model.addAttribute("action", "Ended");
        return "tai-xe/trip-action-result";
    }

    @GetMapping("/tuyen-duoc-phan-cong/{maChuyenXe}")
    public String routeStops(@PathVariable Integer maChuyenXe, Model model) {
        model.addAttribute("maChuyenXe", maChuyenXe);
        model.addAttribute("stops", service.routeStops(maChuyenXe));
        return "tai-xe/route-stops";
    }

    @GetMapping("/lien-he-dieu-phoi/{maChuyenXe}")
    public String contacts(@PathVariable Integer maChuyenXe, Model model) {
        model.addAttribute("maChuyenXe", maChuyenXe);
        model.addAttribute("contacts", service.contacts(maChuyenXe));
        return "tai-xe/contacts";
    }
}
