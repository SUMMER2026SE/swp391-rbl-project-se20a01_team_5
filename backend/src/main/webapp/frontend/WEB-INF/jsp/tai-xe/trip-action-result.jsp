<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Ket qua chuyen xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>${action} trip</h1>
<div class="panel">
    <p><b>Ma chuyen:</b> ${trip.maChuyenXe()}</p>
    <p><b>Tuyen:</b> ${trip.tenTuyen()}</p>
    <p><b>Xe:</b> ${trip.bienSo()}</p>
    <p><b>Trang thai:</b> ${trip.trangThai()}</p>
    <p><b>Gio khoi hanh:</b> ${trip.gioKhoiHanh()}</p>
    <p><b>Gio ket thuc:</b> ${trip.gioKetThuc()}</p>
</div>
</body></html>
