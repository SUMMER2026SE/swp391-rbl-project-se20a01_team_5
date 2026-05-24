<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Tuyen duong phan cong</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Tuyen duong duoc phan cong</h1>
<p>Ma chuyen xe: ${maChuyenXe}</p>
<table>
<tr><th>Thu tu</th><th>Ma tram</th><th>Ten tram</th><th>Dia chi</th><th>Kinh do</th><th>Vi do</th><th>Phut du kien</th></tr>
<c:forEach items="${stops}" var="s">
    <tr><td>${s.thuTu()}</td><td>${s.maTram()}</td><td>${s.tenTram()}</td><td>${s.diaChi()}</td><td>${s.kinhDo()}</td><td>${s.viDo()}</td><td>${s.thoiGianDuKien()}</td></tr>
</c:forEach>
</table>
</body></html>
