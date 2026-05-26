<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Ket qua dang nhap</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Dang nhap thanh cong</h1>
<div class="panel">
    <p><b>Ma nguoi dung:</b> ${result.maNguoiDung()}</p>
    <p><b>Ho ten:</b> ${result.hoTen()}</p>
    <p><b>Email:</b> ${result.email()}</p>
    <p><b>Vai tro:</b> ${result.vaiTro()}</p>
    <p><b>Ma tai xe:</b> ${result.maTaiXe()}</p>
</div>
</body></html>
