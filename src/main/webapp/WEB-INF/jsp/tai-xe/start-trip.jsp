<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html><html><head><title>Bat dau chuyen xe</title></head><body>
<%@ include file="_layout.jspf" %>
<h1>Bat dau chuyen xe</h1>
<form method="post" action="/tai-xe/bat-dau-chuyen/${maChuyenXe}">
    <input type="hidden" name="maTaiXe" value="${maTaiXe}">
    <label>Kinh do <input name="kinhDo" value="108.22"></label>
    <label>Vi do <input name="viDo" value="16.07"></label>
    <label>Toc do <input name="tocDo" value="0"></label>
    <button class="button" type="submit">Xac nhan bat dau</button>
</form>
</body></html>
