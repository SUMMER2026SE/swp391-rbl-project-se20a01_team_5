<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Chuyen duoc phan cong</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Chuyen duoc phan cong</h1>
<form method="get" action="/tai-xe/chuyen-duoc-phan-cong">
    <label>Ma tai xe <input name="maTaiXe" value="${maTaiXe}"></label>
    <label>Tu ngay <input name="from" value="${from}"></label>
    <label>Den ngay <input name="to" value="${to}"></label>
    <button class="button" type="submit">Loc</button>
</form>
<table>
<tr><th>Ma chuyen</th><th>Ngay</th><th>Tuyen</th><th>Xe</th><th>Phu xe</th><th>Trang thai</th><th>Thao tac</th></tr>
<c:forEach items="${trips}" var="t">
    <tr>
        <td>${t.maChuyenXe()}</td><td>${t.ngayChay()}</td><td>${t.tenTuyen()}</td><td>${t.bienSo()}</td><td>${t.tenPhuXe()}</td><td>${t.trangThai()}</td>
        <td><a href="/tai-xe/bat-dau-chuyen/${t.maChuyenXe()}?maTaiXe=${maTaiXe}">Bat dau</a> | <a href="/tai-xe/ket-thuc-chuyen/${t.maChuyenXe()}?maTaiXe=${maTaiXe}">Ket thuc</a> | <a href="/tai-xe/tuyen-duoc-phan-cong/${t.maChuyenXe()}">Tuyen</a> | <a href="/tai-xe/lien-he-dieu-phoi/${t.maChuyenXe()}">Lien he</a></td>
    </tr>
</c:forEach>
</table>
</body></html>
