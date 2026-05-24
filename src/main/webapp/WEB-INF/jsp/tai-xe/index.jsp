<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Tai xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Tai xe - use case pages</h1>
<p class="muted">Simple JSP pages for driver scope.</p>
<div class="panel">
    <ul>
        <li><a href="/tai-xe/dang-nhap">Dang nhap tai xe</a></li>
        <li><a href="/tai-xe/lich-chay?maTaiXe=1">Xem lich chay xe</a></li>
        <li><a href="/tai-xe/chuyen-duoc-phan-cong?maTaiXe=1">Xem chuyen duoc phan cong</a></li>
        <li><a href="/tai-xe/bat-dau-chuyen/1?maTaiXe=1">Bat dau chuyen xe</a></li>
        <li><a href="/tai-xe/ket-thuc-chuyen/1?maTaiXe=1">Ket thuc chuyen xe</a></li>
        <li><a href="/tai-xe/tuyen-duoc-phan-cong/1">Xem tuyen duong duoc phan cong</a></li>
        <li><a href="/tai-xe/lien-he-dieu-phoi/1">Lien he dieu phoi vien</a></li>
    </ul>
</div>
</body></html>
