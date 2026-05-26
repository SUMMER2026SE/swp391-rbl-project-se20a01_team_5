<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Ket thuc chuyen xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Ket thuc chuyen xe</h1>
<form method="post" action="/tai-xe/ket-thuc-chuyen/${maChuyenXe}">
    <input type="hidden" name="maTaiXe" value="${maTaiXe}">
    <label>Kinh do <input name="kinhDo" value="108.23"></label>
    <label>Vi do <input name="viDo" value="16.08"></label>
    <label>Toc do <input name="tocDo" value="0"></label>
    <label>Ghi chu <input name="ghiChu" value="Hoan thanh chuyen"></label>
    <button class="button" type="submit">Xac nhan ket thuc</button>
</form>
</body></html>
