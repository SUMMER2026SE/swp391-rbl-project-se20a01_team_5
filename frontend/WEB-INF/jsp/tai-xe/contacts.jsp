<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Lien he dieu phoi</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Lien he dieu phoi vien</h1>
<p>Ma chuyen xe: ${maChuyenXe}</p>
<table>
<tr><th>Vai tro</th><th>Ma nguoi dung</th><th>Ho ten</th><th>So dien thoai</th></tr>
<c:forEach items="${contacts}" var="c">
    <tr><td>${c.vaiTro()}</td><td>${c.maNguoiDung()}</td><td>${c.hoTen()}</td><td>${c.soDienThoai()}</td></tr>
</c:forEach>
</table>
</body></html>
