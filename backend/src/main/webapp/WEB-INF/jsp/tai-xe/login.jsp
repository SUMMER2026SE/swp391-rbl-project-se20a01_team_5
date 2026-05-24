<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Dang nhap tai xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Dang nhap tai xe</h1>
<form method="post" action="/tai-xe/dang-nhap">
    <label>Email <input name="email" value="driver@test.com" required></label>
    <label>Mat khau <input name="matKhau" type="password" value="password" required></label>
    <label>Vai tro <input name="vaiTro" value="TAI_XE" required></label>
    <button class="button" type="submit">Dang nhap</button>
</form>
</body></html>
