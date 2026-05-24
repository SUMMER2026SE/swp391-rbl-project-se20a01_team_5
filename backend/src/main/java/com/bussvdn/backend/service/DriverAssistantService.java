package com.bussvdn.backend.service;

import com.bussvdn.backend.dto.DriverAssistantDtos.ContactResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.CreatedIdResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.GpsRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.IncidentRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.LostItemRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.MessageRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.MessageResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.RouteStopResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScanTicketRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScanTicketResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScheduleResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.TripResponse;
import com.bussvdn.backend.entity.BaoMatDo;
import com.bussvdn.backend.entity.ChuyenXe;
import com.bussvdn.backend.entity.LichSuChuyenDi;
import com.bussvdn.backend.entity.LichTrinhXe;
import com.bussvdn.backend.entity.NguoiDung;
import com.bussvdn.backend.entity.PhuXe;
import com.bussvdn.backend.entity.SuCo;
import com.bussvdn.backend.entity.TaiXe;
import com.bussvdn.backend.entity.TinNhanNoiBo;
import com.bussvdn.backend.entity.TuyenTram;
import com.bussvdn.backend.entity.VeLuot;
import com.bussvdn.backend.entity.VeThang;
import com.bussvdn.backend.entity.ViTriXe;
import com.bussvdn.backend.exception.ApiException;
import com.bussvdn.backend.repository.BaoMatDoRepository;
import com.bussvdn.backend.repository.ChuyenXeRepository;
import com.bussvdn.backend.repository.LichSuChuyenDiRepository;
import com.bussvdn.backend.repository.LichTrinhXeRepository;
import com.bussvdn.backend.repository.NguoiDungRepository;
import com.bussvdn.backend.repository.PhuXeRepository;
import com.bussvdn.backend.repository.SuCoRepository;
import com.bussvdn.backend.repository.TaiXeRepository;
import com.bussvdn.backend.repository.TinNhanNoiBoRepository;
import com.bussvdn.backend.repository.TuyenTramRepository;
import com.bussvdn.backend.repository.VeLuotRepository;
import com.bussvdn.backend.repository.VeThangRepository;
import com.bussvdn.backend.repository.ViTriXeRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverAssistantService {
    private final TaiXeRepository taiXeRepository;
    private final PhuXeRepository phuXeRepository;
    private final ChuyenXeRepository chuyenXeRepository;
    private final LichTrinhXeRepository lichTrinhXeRepository;
    private final TuyenTramRepository tuyenTramRepository;
    private final VeThangRepository veThangRepository;
    private final VeLuotRepository veLuotRepository;
    private final LichSuChuyenDiRepository lichSuChuyenDiRepository;
    private final BaoMatDoRepository baoMatDoRepository;
    private final SuCoRepository suCoRepository;
    private final TinNhanNoiBoRepository tinNhanNoiBoRepository;
    private final ViTriXeRepository viTriXeRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public DriverAssistantService(
            TaiXeRepository taiXeRepository,
            PhuXeRepository phuXeRepository,
            ChuyenXeRepository chuyenXeRepository,
            LichTrinhXeRepository lichTrinhXeRepository,
            TuyenTramRepository tuyenTramRepository,
            VeThangRepository veThangRepository,
            VeLuotRepository veLuotRepository,
            LichSuChuyenDiRepository lichSuChuyenDiRepository,
            BaoMatDoRepository baoMatDoRepository,
            SuCoRepository suCoRepository,
            TinNhanNoiBoRepository tinNhanNoiBoRepository,
            ViTriXeRepository viTriXeRepository,
            NguoiDungRepository nguoiDungRepository) {
        this.taiXeRepository = taiXeRepository;
        this.phuXeRepository = phuXeRepository;
        this.chuyenXeRepository = chuyenXeRepository;
        this.lichTrinhXeRepository = lichTrinhXeRepository;
        this.tuyenTramRepository = tuyenTramRepository;
        this.veThangRepository = veThangRepository;
        this.veLuotRepository = veLuotRepository;
        this.lichSuChuyenDiRepository = lichSuChuyenDiRepository;
        this.baoMatDoRepository = baoMatDoRepository;
        this.suCoRepository = suCoRepository;
        this.tinNhanNoiBoRepository = tinNhanNoiBoRepository;
        this.viTriXeRepository = viTriXeRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> driverSchedules(Integer maTaiXe) {
        requireDriver(maTaiXe);
        return lichTrinhXeRepository
                .findByTaiXeMaTaiXeAndTrangThaiOrderByNgayTrongTuanAscGioKhoiHanhAsc(maTaiXe, "HOAT_DONG")
                .stream()
                .map(this::toSchedule)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> driverTrips(Integer maTaiXe, LocalDate from, LocalDate to) {
        requireDriver(maTaiXe);
        return chuyenXeRepository
                .findByTaiXeMaTaiXeAndNgayChayBetweenOrderByNgayChayAscGioKhoiHanhAsc(maTaiXe, from, to)
                .stream()
                .map(this::toTrip)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> assistantTrips(Integer maPhuXe, LocalDate from, LocalDate to) {
        requireAssistant(maPhuXe);
        return chuyenXeRepository
                .findByPhuXeMaPhuXeAndNgayChayBetweenOrderByNgayChayAscGioKhoiHanhAsc(maPhuXe, from, to)
                .stream()
                .map(this::toTrip)
                .toList();
    }

    @Transactional
    public TripResponse startTrip(Integer maTaiXe, Integer maChuyenXe, GpsRequest request) {
        ChuyenXe trip = requireDriverTrip(maTaiXe, maChuyenXe);
        if (!"CHUA_BAT_DAU".equals(trip.getTrangThai())) {
            throw new ApiException(HttpStatus.CONFLICT, "Trip cannot start from status " + trip.getTrangThai());
        }
        trip.setTrangThai("DANG_CHAY");
        trip.setGioKhoiHanh(LocalDateTime.now());
        trip.getXeBus().setTrangThai("DANG_CHAY");
        trip.getTaiXe().setTrangThaiHoatDong("DANG_CHAY");
        saveLocationIfPresent(trip, request);
        return toTrip(trip);
    }

    @Transactional
    public TripResponse endTrip(Integer maTaiXe, Integer maChuyenXe, GpsRequest request) {
        ChuyenXe trip = requireDriverTrip(maTaiXe, maChuyenXe);
        if (!"DANG_CHAY".equals(trip.getTrangThai())) {
            throw new ApiException(HttpStatus.CONFLICT, "Trip cannot end from status " + trip.getTrangThai());
        }
        trip.setTrangThai("HOAN_THANH");
        trip.setGioKetThuc(LocalDateTime.now());
        trip.setGhiChu(request == null ? trip.getGhiChu() : request.ghiChu());
        trip.getXeBus().setTrangThai("SAN_SANG");
        trip.getTaiXe().setTrangThaiHoatDong("SAN_SANG");
        saveLocationIfPresent(trip, request);
        return toTrip(trip);
    }

    @Transactional(readOnly = true)
    public List<RouteStopResponse> routeStops(Integer maChuyenXe) {
        ChuyenXe trip = chuyenXeRepository.findById(maChuyenXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        return tuyenTramRepository.findByTuyenXeMaTuyenOrderByThuTuAsc(trip.getTuyenXe().getMaTuyen())
                .stream()
                .map(this::toRouteStop)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> contacts(Integer maChuyenXe) {
        ChuyenXe trip = chuyenXeRepository.findById(maChuyenXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        List<ContactResponse> contacts = new ArrayList<>();
        contacts.add(toContact("TAI_XE", trip.getTaiXe().getNguoiDung()));
        if (trip.getPhuXe() != null) {
            contacts.add(toContact("PHU_XE", trip.getPhuXe().getNguoiDung()));
        }
        Integer maDieuPhoi = trip.getLichTrinhXe() == null ? null : trip.getLichTrinhXe().getMaNguoiPhanCong();
        if (maDieuPhoi != null) {
            nguoiDungRepository.findById(maDieuPhoi).ifPresent(user -> contacts.add(toContact("DIEU_PHOI", user)));
        }
        return contacts;
    }

    @Transactional
    public MessageResponse sendMessage(MessageRequest request) {
        nguoiDungRepository.findById(request.maNguoiGui())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sender not found"));
        nguoiDungRepository.findById(request.maNguoiNhan())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receiver not found"));
        TinNhanNoiBo message = new TinNhanNoiBo();
        message.setMaNguoiGui(request.maNguoiGui());
        message.setMaNguoiNhan(request.maNguoiNhan());
        message.setMaChuyenXe(request.maChuyenXe());
        message.setNoiDung(request.noiDung());
        message.setDaDoc(false);
        message.setNgayGui(LocalDateTime.now());
        TinNhanNoiBo saved = tinNhanNoiBoRepository.save(message);
        return new MessageResponse(saved.getMaTinNhan(), "SENT");
    }

    @Transactional
    public ScanTicketResponse scanTicket(Integer maPhuXe, ScanTicketRequest request) {
        requireAssistantTrip(maPhuXe, request.maChuyenXe());
        LocalDateTime now = LocalDateTime.now();
        return veThangRepository.findByMaQr(request.maQr())
                .map(ticket -> scanMonthlyTicket(maPhuXe, request, ticket, now))
                .orElseGet(() -> veLuotRepository.findByMaQr(request.maQr())
                        .map(ticket -> scanSingleTicket(maPhuXe, request, ticket, now))
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QR ticket not found")));
    }

    @Transactional
    public CreatedIdResponse createLostItem(Integer maPhuXe, LostItemRequest request) {
        PhuXe assistant = requireAssistant(maPhuXe);
        if (request.maChuyenXe() != null) {
            requireAssistantTrip(maPhuXe, request.maChuyenXe());
        }
        BaoMatDo report = new BaoMatDo();
        report.setMaNguoiBao(request.maNguoiBao());
        report.setMaNguoiHoTro(assistant.getNguoiDung().getMaNguoiDung());
        report.setMaChuyenXe(request.maChuyenXe());
        report.setMoTaMonDo(request.moTaMonDo());
        report.setGhiChu(request.ghiChu());
        report.setTrangThai("DANG_TIM");
        report.setNgayBao(LocalDateTime.now());
        return new CreatedIdResponse(baoMatDoRepository.save(report).getMaBaoMatDo(), "CREATED");
    }

    @Transactional
    public CreatedIdResponse createIncident(Integer maPhuXe, IncidentRequest request) {
        requireAssistantTrip(maPhuXe, request.maChuyenXe());
        if (!List.of("QUA_TAI", "KHAN_CAP", "KY_THUAT", "KHAC").contains(request.loaiSuCo())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid incident type");
        }
        SuCo incident = new SuCo();
        incident.setMaPhuXe(maPhuXe);
        incident.setMaChuyenXe(request.maChuyenXe());
        incident.setLoaiSuCo(request.loaiSuCo());
        incident.setMoTa(request.moTa());
        incident.setTrangThai("MOI");
        incident.setNgayBaoCao(LocalDateTime.now());
        return new CreatedIdResponse(suCoRepository.save(incident).getMaSuCo(), "CREATED");
    }

    private ScanTicketResponse scanMonthlyTicket(
            Integer maPhuXe, ScanTicketRequest request, VeThang ticket, LocalDateTime now) {
        ChuyenXe trip = requireAssistantTrip(maPhuXe, request.maChuyenXe());
        if (!"HOAT_DONG".equals(ticket.getTrangThai()) || ticket.getNgayHetHan().isBefore(now.toLocalDate())) {
            return new ScanTicketResponse(false, "VE_THANG", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                    ticket.getTrangThai(), "Monthly ticket expired or inactive");
        }
        if (!ticket.getMaTuyen().equals(trip.getTuyenXe().getMaTuyen())) {
            return new ScanTicketResponse(false, "VE_THANG", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                    ticket.getTrangThai(), "Ticket route does not match trip route");
        }
        ticket.setLanQuetCuoi(now);
        ticket.setSoLanQuetHomNay((ticket.getSoLanQuetHomNay() == null ? 0 : ticket.getSoLanQuetHomNay()) + 1);
        saveTripHistory(ticket.getMaSinhVien(), request, maPhuXe, now);
        return new ScanTicketResponse(true, "VE_THANG", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                ticket.getTrangThai(), "Monthly ticket accepted");
    }

    private ScanTicketResponse scanSingleTicket(
            Integer maPhuXe, ScanTicketRequest request, VeLuot ticket, LocalDateTime now) {
        ChuyenXe trip = requireAssistantTrip(maPhuXe, request.maChuyenXe());
        if (!"CHUA_SU_DUNG".equals(ticket.getTrangThai()) || ticket.getNgayHetHan().isBefore(now)) {
            return new ScanTicketResponse(false, "VE_LUOT", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                    ticket.getTrangThai(), "Single ticket expired or already used");
        }
        if (!ticket.getMaTuyen().equals(trip.getTuyenXe().getMaTuyen())) {
            return new ScanTicketResponse(false, "VE_LUOT", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                    ticket.getTrangThai(), "Ticket route does not match trip route");
        }
        ticket.setTrangThai("DA_SU_DUNG");
        ticket.setMaChuyenXe(request.maChuyenXe());
        ticket.setMaPhuXeQuet(maPhuXe);
        ticket.setLanQuetCuoi(now);
        saveTripHistory(ticket.getMaSinhVien(), request, maPhuXe, now);
        return new ScanTicketResponse(true, "VE_LUOT", ticket.getMaSinhVien(), ticket.getMaTuyen(),
                ticket.getTrangThai(), "Single ticket accepted");
    }

    private void saveTripHistory(String maSinhVien, ScanTicketRequest request, Integer maPhuXe, LocalDateTime now) {
        LichSuChuyenDi history = new LichSuChuyenDi();
        history.setMaSinhVien(maSinhVien);
        history.setMaChuyenXe(request.maChuyenXe());
        history.setMaTramLen(request.maTramLen());
        history.setMaTramXuong(request.maTramXuong());
        history.setThoiGianLen(now);
        history.setPhuongThucXacNhan("QUET_QR");
        history.setMaPhuXeXacNhan(maPhuXe);
        lichSuChuyenDiRepository.save(history);
    }

    private void saveLocationIfPresent(ChuyenXe trip, GpsRequest request) {
        if (request == null || request.kinhDo() == null || request.viDo() == null) {
            return;
        }
        ViTriXe location = new ViTriXe();
        location.setMaXe(trip.getXeBus().getMaXe());
        location.setMaChuyenXe(trip.getMaChuyenXe());
        location.setKinhDo(request.kinhDo());
        location.setViDo(request.viDo());
        location.setTocDo(request.tocDo());
        location.setThoiGianCapNhat(LocalDateTime.now());
        viTriXeRepository.save(location);
    }

    private TaiXe requireDriver(Integer maTaiXe) {
        return taiXeRepository.findById(maTaiXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver not found"));
    }

    private PhuXe requireAssistant(Integer maPhuXe) {
        return phuXeRepository.findById(maPhuXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assistant not found"));
    }

    private ChuyenXe requireDriverTrip(Integer maTaiXe, Integer maChuyenXe) {
        ChuyenXe trip = chuyenXeRepository.findById(maChuyenXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        if (!trip.getTaiXe().getMaTaiXe().equals(maTaiXe)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trip is not assigned to this driver");
        }
        return trip;
    }

    private ChuyenXe requireAssistantTrip(Integer maPhuXe, Integer maChuyenXe) {
        ChuyenXe trip = chuyenXeRepository.findById(maChuyenXe)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        if (trip.getPhuXe() == null || !trip.getPhuXe().getMaPhuXe().equals(maPhuXe)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trip is not assigned to this assistant");
        }
        return trip;
    }

    private ScheduleResponse toSchedule(LichTrinhXe schedule) {
        PhuXe assistant = schedule.getPhuXe();
        return new ScheduleResponse(
                schedule.getMaLichTrinh(),
                schedule.getNgayTrongTuan(),
                schedule.getGioKhoiHanh(),
                schedule.getGioKetThuc(),
                schedule.getTrangThai(),
                schedule.getTuyenXe().getMaTuyen(),
                schedule.getTuyenXe().getTenTuyen(),
                schedule.getXeBus().getMaXe(),
                schedule.getXeBus().getBienSo(),
                assistant == null ? null : assistant.getMaPhuXe(),
                assistant == null ? null : assistant.getNguoiDung().getHoTen());
    }

    private TripResponse toTrip(ChuyenXe trip) {
        return new TripResponse(
                trip.getMaChuyenXe(),
                trip.getNgayChay(),
                trip.getGioKhoiHanh(),
                trip.getGioKetThuc(),
                trip.getTrangThai(),
                trip.getTuyenXe().getMaTuyen(),
                trip.getTuyenXe().getTenTuyen(),
                trip.getXeBus().getMaXe(),
                trip.getXeBus().getBienSo(),
                trip.getTaiXe().getMaTaiXe(),
                trip.getTaiXe().getNguoiDung().getHoTen(),
                trip.getPhuXe() == null ? null : trip.getPhuXe().getMaPhuXe(),
                trip.getPhuXe() == null ? null : trip.getPhuXe().getNguoiDung().getHoTen());
    }

    private RouteStopResponse toRouteStop(TuyenTram tuyenTram) {
        return new RouteStopResponse(
                tuyenTram.getTramDung().getMaTram(),
                tuyenTram.getTramDung().getTenTram(),
                tuyenTram.getTramDung().getDiaChi(),
                tuyenTram.getTramDung().getKinhDo(),
                tuyenTram.getTramDung().getViDo(),
                tuyenTram.getThuTu(),
                tuyenTram.getThoiGianDuKien());
    }

    private ContactResponse toContact(String vaiTro, NguoiDung user) {
        return new ContactResponse(vaiTro, user.getMaNguoiDung(), user.getHoTen(), user.getSoDienThoai());
    }
}
