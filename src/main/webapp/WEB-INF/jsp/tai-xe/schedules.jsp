<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Lich chay xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Lich chay xe</h1>
<form method="get" action="/tai-xe/lich-chay">
    <label>Ma tai xe <input name="maTaiXe" value="${maTaiXe}"></label>
    <button class="button" type="submit">Xem</button>
</form>
<table>
<tr><th>Ma lich</th><th>Thu</th><th>Gio di</th><th>Gio den</th><th>Tuyen</th><th>Xe</th><th>Phu xe</th><th>Trang thai</th></tr>
<c:forEach items="${schedules}" var="s">
    <tr><td>${s.maLichTrinh()}</td><td>${s.ngayTrongTuan()}</td><td>${s.gioKhoiHanh()}</td><td>${s.gioKetThuc()}</td><td>${s.tenTuyen()}</td><td>${s.bienSo()}</td><td>${s.tenPhuXe()}</td><td>${s.trangThai()}</td></tr>
</c:forEach>
</table>
</body></html>
