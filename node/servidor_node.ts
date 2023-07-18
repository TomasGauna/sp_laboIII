import 
{
    PORT,
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USER
} from './config.js';

const express = require('express');

const app = express();

app.set('puerto', PORT);

//AGREGO FILE SYSTEM
const fs = require('fs');

//AGREGO JSON
app.use(express.json());

//AGREGO JWT
const jwt = require("jsonwebtoken");

//SE ESTABLECE LA CLAVE SECRETA PARA EL TOKEN
//app.set("key", "cl@ve_secreta");

app.use(express.urlencoded({extended:false}));

//AGREGO MULTER
const multer = require('multer');

//AGREGO MIME-TYPES
const mime = require('mime-types');

//AGREGO STORAGE
const storage = multer.diskStorage({
    destination: "public/juguetes/fotos/",
});

const upload = multer({
    storage: storage
});

const cors = require("cors");

app.use(cors());

app.use(express.static("public"));


const mysql = require('mysql');
const myconn = require('express-myconnection');
const db_options = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
};

app.use(myconn(mysql, db_options, 'single'));

const verificar_jwt = express.Router();

verificar_jwt.use((request:any, response:any, next:any)=>{

    //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
    let token = request.headers["authorization"];
    
    if (!token) 
    {
        response.status(401).send({
            error: "El JWT es requerido!!!"
        });
        return;
    }

    if(token.startsWith("Bearer ")){
        token = token.slice(7, token.length);
    }

    if(token){
        //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
        jwt.verify(token, "Gauna.Tomas", (error:any, decoded:any)=>{

            if(error)
            {
                return response.json({
                    exito: false,
                    mensaje:"El JWT NO es válido!!!",
                    status: 403
                });
            }
            else
            {
                response.jwt = decoded;
                next();
            }
        });
    }
});

//##############################################################################################//
//RUTAS PARA LOS MIDDLEWARES DEL JWT
//##############################################################################################//

const verificar_usuario = express.Router();

verificar_usuario.use((request:any, response:any, next:any)=>{

    let obj = request.body;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from usuarios where correo = ? and clave = ? ", [obj.correo, obj.clave], (err:any, rows:any)=>{

            if(err) throw("Error en consulta de base de datos.");

            if(rows.length == 1){

                response.obj_usuario = rows[0];
                next();
            }
            else{
                response.status(401).json({
                    exito : false,
                    mensaje:"Correo y/o clave incorrectas",
                    jwt : null,
                    status: 403
                });
            }
           
        });
    });
});

//##############################################################################################//
//RUTAS PARA EL SERVIDOR DE AUTENTICACIÓN
//##############################################################################################//

app.post("/login", verificar_usuario, (request:any, response:any, obj:any)=>{

    const user = response.obj_usuario;

    const payload = 
    { 
        usuario: 
        {
            id : user.id,
            correo : user.correo,
            nombre : user.nombre,
            apellido: user.apellido,
            perfil : user.perfil,
            foto: user.foto
        },
        alumno : "Tomas Agustin Gauna",
        dni_alumno: 45751587
    };

    const token = jwt.sign(payload, "Gauna.Tomas", 
    {
        expiresIn : "120s"
    });

    response.json({
        exito : true,
        mensaje : "JWT creado!!!",
        jwt : token
    });

});

app.get("/login", verificar_jwt, (request:any, response:any, obj:any)=>
{
    response.json({exito:true, mensaje: "JWT valido!", payload: response.jwt, status: 200});
})

//##############################################################################################//
//RUTAS PARA EL CRUD - CON BD -
//##############################################################################################//

//LISTAR
app.get('/listarJuguetesBD', verificar_jwt, (request:any, response:any)=>
{
    let respuesta = {"exito":false, "mensaje": "Error al traer listado", dato: null, status: 424};

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from juguetes", (err:any, rows:any)=>
        {
            if(err) throw("Error en consulta de base de datos.");

            let respuesta = {"exito":true, "mensaje": "Listado con exito!", dato: JSON.stringify(rows), status: 200};
            response.send(JSON.stringify(respuesta));
        });
    });

});

//AGREGAR
app.post('/agregarJugueteBD', verificar_jwt, upload.single("foto"), (request:any, response:any)=>{
   
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.juguete_json);
    let path : string = file.destination + obj.marca + "." + extension;
    let respuesta = {"exito":false, "mensaje": "No se pudo agregar a la bd."};
    
    fs.renameSync(file.path, path);
    obj.path_foto = path.split("public/juguetes/fotos/")[1];

    request.getConnection((err:any, conn:any)=>
    {
        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("insert into juguetes set ?", [obj], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            respuesta = {"exito":true,"mensaje":"Juguete agregado a la bd."};
            response.send(JSON.stringify(respuesta));
        });
    });
});

//MODIFICAR
app.post('/toys', verificar_jwt, upload.single("foto"), (request:any, response:any)=>
{    
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.juguete);
    let path : string = file.destination + obj.marca + "_modificacion" + "." + extension;
    let respuesta = {"exito": false, "mensaje": "No se pudo modificar de la bd.", "status": 418};

    fs.renameSync(file.path, path);

    obj.path = path.split("public/juguetes/fotos/")[1];

    let obj_modif : any = {};
    obj_modif.marca = obj.marca;
    obj_modif.precio = obj.precio;
    obj_modif.path_foto = obj.path;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("update juguetes set ? where id = ?", [obj_modif, obj.id_juguete], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            respuesta = {"exito": true, "mensaje": "Juguete modificado en la bd.", "status":200};
            response.send(JSON.stringify(respuesta));
        });
    });
});

//ELIMINAR
app.delete('/toys', verificar_jwt,(request:any, response:any)=>{
   
    let obj = request.body;
    let path_foto : string = "public/juguetes/fotos/";
    let respuesta = {"exito": false, "mensaje": "No se pudo eliminar de la bd.", "status":418};

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select path_foto from juguetes where id = ?", [obj.id_juguete], (err:any, result:any)=>
        {
            if(err) throw("Error en consulta de base de datos.");
            console.log(result[0]);
            path_foto += result[0].path_foto;
        });
    });

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("delete from juguetes where id = ?", [obj.id_juguete], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            fs.unlink(path_foto, (err:any) => 
            {
                if (err) throw err;
                console.log(path_foto + ' fue borrado.');
            });

            respuesta = {"exito": true, "mensaje": "Juguete eliminado de la bd.", "status":200};
            response.send(JSON.stringify(respuesta));
        });
    });
});

app.listen(app.get('puerto'), ()=>{
    console.log('Servidor corriendo sobre puerto:', app.get('puerto'));
});