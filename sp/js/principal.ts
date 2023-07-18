var URL_API : string = "http://localhost:2023/";
var URL_BASE : string = "http://localhost/lab_3/sp/";

$(()=>{

    VerificarJWT();
    AdministrarListar();
    AdministrarAgregar();
});

function VerificarJWT() 
{    
    let jwt = localStorage.getItem("jwt");

    $.ajax({
        type: 'GET',
        url: URL_API + "login",
        dataType: "json",
        data: {},
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (obj_rta:any) {

        console.log(obj_rta);

        if(obj_rta.exito)
        {
            $("#nombre_usuario").html(obj_rta.payload.usuario.nombre);
        }
        else
        {
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1000);
        }
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {

        let retorno = JSON.parse(jqXHR.responseText);
        alert(retorno.mensaje);
        console.log(retorno.mensaje);
    });    
}

function ObtenerListadoProductos() 
{   
    $("#divTablaIzq").html("");

    let jwt = localStorage.getItem("jwt");

    $.ajax(
    {
        type: 'GET',
        url: URL_API + "listarJuguetesBD",
        dataType: "json",
        data: {},
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (resultado:any) 
    {
        if(!resultado.exito)
        {
            console.log(resultado.mensaje);
            alert(resultado.mensaje);
            if(resultado.status == 403)
            {
                setTimeout(() => {
                    $(location).attr('href', URL_BASE + "login.html");
                }, 1500);
            }
        }
        else
        {
            let tabla:string = ArmarTablaJuguetes(JSON.parse(resultado.dato));

            $("#divTablaIzq").html(tabla).show();
        }
    });
    
    function ArmarTablaJuguetes(juguetes:[]) : string 
    {   
        let tabla:string = '<table class="table table-dark table-hover">';
        tabla += '<tr><th>ID</th><th>MARCA</th><th>PRECIO</th><th>FOTO</th><th style="width:110px">ACCIONES</th></tr>';

        if(juguetes.length == 0)
        {
            tabla += '<tr><td>---</td><td>---</td><td>---</td><td>---</td><th>---</td></tr>';
        }
        else
        {
            juguetes.forEach((jugue : any) => {

                tabla += "<tr><td>"+jugue.id+"</td><td>"+jugue.marca+"</td><td>"+jugue.precio+"</td>"+
                "<td><img src='"+URL_API+jugue.path_foto+"' width='50px' height='50px'></td><th>"+
                "<a href='#' class='btn' data-action='modificar' data-obj_prod='"+JSON.stringify(jugue)+"' title='Modificar'"+
                " data-toggle='modal' data-target='#ventana_modal_prod' ><span class='fas fa-edit'></span></a>"+
                "<a href='#' class='btn' data-action='eliminar' data-obj_prod='"+JSON.stringify(jugue)+"' title='Eliminar'"+
                " data-toggle='modal' data-target='#ventana_modal_prod' ><span class='fas fa-times'></span></a>"+
                "</td></tr>";
            });
        }

        tabla += "</table>";

        return tabla;
    }
}

function ArmarFormularioAlta()
{
    $("#divTablaDer").html("");
    $("#divTablaDer").html("").show();
}

function AdministrarListar() 
{
    $("#listado_juguetes").on("click", ()=>
    {
        ObtenerListadoProductos();
    });
}

function AdministrarAgregar() 
{
    $("#alta_juguete").on("click", ()=>
    {
        ArmarFormularioAlta();
    });
}