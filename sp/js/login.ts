/// <reference path="../node_modules/@types/jquery/index.d.ts" />
var URL_API : string = "http://localhost:2023/";
var URL_BASE : string = "http://localhost/lab_3/sp/";

$(()=>{

    $("#btnEnviar").on("click", (e:any)=>{

        e.preventDefault();

        let correo = $("#correo").val();
        let clave = $("#clave").val();

        let dato:any = {};
        dato.correo = correo;
        dato.clave = clave;

        $.ajax(
        {
            type: 'POST',
            url: URL_API + "login",
            dataType: "json",
            data: dato,
            async: true
        })
        .done(function (respuesta:any) 
        {
            console.log(respuesta);

            if(respuesta.exito)
            {
                localStorage.setItem("jwt", respuesta.jwt);                
                alert(respuesta.mensaje + " redirigiendo al principal.php...");
                console.log(respuesta.mensaje + " redirigiendo al principal.php...");
                setTimeout(() => {
                    $(location).attr('href', URL_BASE + "principal.html");
                }, 1000);
            } 
            else
            {
                alert(respuesta.mensaje);
                console.log(respuesta.mensaje);
            }           
        });
    });

});

