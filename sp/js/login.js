"use strict";
var URL_API = "http://localhost:2023/";
var URL_BASE = "http://localhost/lab_3/sp/";
$(function () {
    $("#btnEnviar").on("click", function (e) {
        e.preventDefault();
        var correo = $("#correo").val();
        var clave = $("#clave").val();
        var dato = {};
        dato.correo = correo;
        dato.clave = clave;
        $.ajax({
            type: 'POST',
            url: URL_API + "login",
            dataType: "json",
            data: dato,
            async: true
        })
            .done(function (respuesta) {
            console.log(respuesta);
            if (respuesta.exito) {
                localStorage.setItem("jwt", respuesta.jwt);
                alert(respuesta.mensaje + " redirigiendo al principal.php...");
                console.log(respuesta.mensaje + " redirigiendo al principal.php...");
                setTimeout(function () {
                    $(location).attr('href', URL_BASE + "principal.html");
                }, 1000);
            }
            else {
                alert(respuesta.mensaje);
                console.log(respuesta.mensaje);
            }
        });
    });
});
//# sourceMappingURL=login.js.map