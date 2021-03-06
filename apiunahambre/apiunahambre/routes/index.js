var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
var cors = require('cors')
var jsonResult = require('../models/result')
var app = express()
var bodyParser = require('body-parser')
var db = require('../connection/conexion')
const cloudinary  = require('cloudinary');
const fs = require('fs-extra');

/**Robindroide
 * Credenciales de cloudinary
*/
cloudinary.config({
  cloud_name: 'dkg9y8rh6',
  api_key: '136891711785884',
  api_secret: 'dI7OazasJmUiSg27rrtVSJUB0iM'
});

/** JFunez@20032020
 * Azure tiene una política en que dado un cierto tiempo en que una conexión no hace solicitudes fuerza su desconexión
 * debido a esto es necesario mantener la conexión por medio de pings.
 */

function ping(){
  return db.ping(function(err) {
  if (err) {
  console.error('Ocurrió un error conectandose a Azure: ' + err.stack);
  return false;
  }
  });
  }

setInterval(ping, 20000);

const jwt = require('jsonwebtoken')
const config = require('../configs/config')
const multer = require('multer');//Modulo para gestion de imagenes
const uuid = require('uuid/v4');//Modulo para gestion de id de imagenes
const path = require('path');
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploadsProfilePics'),
  filename: (req, file, cb) => {
      cb(null, uuid() + path.extname(file.originalname).toLocaleLowerCase());
  }
}); //Almacenamiento de imagenes de perfil


var nodemailer = require('nodemailer')


app.set('llave', config.llave)
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors())
app.use(bodyParser())
app.use(multer({
  storage : storage,
  dest : path.join(__dirname, '../public/uploadsProfilePics'),
  limits : {fileSize: 10000000},
  fileFilter : (rq, file, cb) => {
      const filetypes = /jpeg|jpg|png/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname));
      if(mimetype && extname) {
          return cb(null, true);
      }
      cb("Error: Archivo debe ser imagen valida");
  }
}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
/*JFunez@13Feb2020

Index.js

En este momento el index.js es la página de inicio desde donde se redirige a todos los servicios,
en otro sprint se crearán rutas únicas para cada página de frontend.

JFunez@16Feb2020

Agregada funcionalidad CORS para gestión de acceso.
*/



/* Las siguientes funciones hacen uso de los servicios que se encuentran en cada modelo, 
todas las funciones router.get o post reciben como parámetro la dirección que enviará el frontend
y la respuesta (callback) que nosotros enviaremos*/


/* La función callback recibe como parámetros:
req: representa la petición (Request)
res: representa la respuesta a enviar (Result)
next: representa la siguiente funciíon callback a llamar (Uso del middleware) en próximos sprint haremos uso de este parámetro
*/




/** CVasquez@04MAR2020
 *
 * Obtiene el puerto asignado por el servicio de nube o se le asigna el puerto 3001
 */
app.set('port', process.env.PORT || 3001);

// app.listen(3001, )

app.listen(app.get('port'), function () {
  console.log('CORS-enabled web server listening on port ',app.get('port'));
});

/** CVasquez@16MAR2020
 *Middleware para verificar el jwt enviado desde frontend
 * Se respondera con un mensaje si el token no fue proveído o no es valído 
 */
router.use((req, res, next) => {
  const token = req.headers['access-token'];
  if (token) {
    jwt.verify(token, app.get('llave'), (err, decoded) => {
      if (err) {
        return res.json({ mensaje: 'token invalida' })

      } else {
        req.decoded = decoded
        next()
      }
    })
  } else {
    res.send({
      mensaje: 'token no proveida.'
    })
  }
})
/**
* CVasquez@02Mar2020
*Si el mensaje está vacio entonces el usuario se registro correctamente, sino entonces el mensaje
*no estará vacio.
* De esta forma debe acceder frontend al error, si el error es nulo el sp se ejecutò correctamente
* sino, que gestionen la excepciòn
*/
// FINAL POST Registrar usuarios
app.post('/api/insertuser', function (req, res, next) {
  const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
  db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
    function (err, result, rows) {
      
      let resultado = jsonResult;
      resultado.error = result

      res.send(resultado);
    }

  );
});
/* POST Insertar Platillo */
app.post('/api/insertar-platillo', function (req, res, next) {
  const query = `CALL SP_INSERTAR_PLATILLO(?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
  db.query(query, [req.body.descripcion, req.body.idMenu, req.body.nombre, req.body.precio, req.body.tipoPlatillo],
    function (err, result, rows) {
      
      let resultado = jsonResult;
      resultado.error = result

      res.send(resultado);
    }

  );
});
/* POST Insertar Menu */
app.post('/api/insertar-menu', function (req, res, next) {
  const query = `CALL SP_INSERTAR_MENU(?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
  db.query(query, [req.body.tipoMenu, req.body.idRestaurante, req.body.fotoMenu, req.body.idCategoria],
    function (err, result, rows) {
      
      let resultado = jsonResult;
      resultado.error = result

      res.send(resultado);
    }

  );
});
/**Robindroide 
POST PARA SUBIR UNA IMAGEN DE PERFIL*/
app.post('/api/upload-profile-pic', async (req, res) => {
  let file = req.file;
  const id = req.headers['idusuario'];
  const result = await cloudinary.v2.uploader.upload(file.path);
  const query = `UPDATE Usuario SET Foto_Perfil = ? WHERE idUsuario = ?`;
  db.query(query, [result.url, id],
      function (err, result) {
      console.log('Image Uploaded'); 
  });
  await fs.unlink(file.path);
  console.log(result.url);
  res.send(result.url);
});

// FINAL Get Lista Restaurantes
// Devuelve la lista de los restaurantes en la DB
/**
 * /api/g_mostrar_restaurantes
 * /api/restaurantes
 */
app.get('/api/g_mostrar_restaurantes', function (req, res, next) {

  const query = `SELECT idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, Usuario_idUsuario, EstadoRestaurante, Nombre_Usuario FROM Restaurante
INNER JOIN usuario
WHERE idUsuario = Usuario_idUsuario`
    // `SELECT * FROM Restaurante`;
    db.query(query,
      function (err, result) {
        let resultado = jsonResult;
        resultado.items = result;
        resultado.error = err;

        res.send(resultado);
      }

    );
});

app.post('/api/restauranteUsuario', function (req, res, next) {
  const query = `SELECT * FROM Restaurante WHERE Usuario_idUsuario = `+req.body.idUsuario;
  db.query(query,
    function (err, result) {
      let resultado = jsonResult;
      if (err) resultado.error = err;
      if(result==undefined){
        resultado.items = null;
        res.send(resultado);
      } else {
        resultado.error = null;
        resultado.items = result;
        res.send(resultado);
      }
    }

  );
});

// FINAL getMenus
//Retorna todos los menus en la base
app.get('/api/g_mostrar_menus', cors(), function (req, res, next) {

  const query = `SELECT * FROM Menu`;
  db.query(query,
    function (err, result) {
      respuestaItems(err, result, res)
     
    }
    )
});

app.get('/api/tipo-platillos', cors(), function(req,res,next){
  const query = `SELECT * FROM tipo_platillo`;
  db.query(query,
    function (err, result) {
      respuestaItems(err, result, res)
    }
    )

})


/** CVasquez@04MAR2020
 *
 * Se devuelve un arreglo en el campo items con los platillos existentes en la base de datos
 */

app.get('/api/g_mostrar_platillos', cors(), function (req, res, next) {

  const query = `SELECT * FROM Platillo`;
  db.query(query,
    function (err, result) {

      let resultado = jsonResult;
      resultado.items = result

      res.send(resultado)
    })
});

//      * CVasquez@02Mar2020
//      *El error llevará el mensaje para la consulta
//      *Indicará si se concede o no el acceso al usuario 
//     */

// POST PARA LOGIN
app.post('/api/login', cors(), function (req, res, next) {
  const query = `CALL SP_LOGIN(?, ?, @id, @Usuario, @Mensaje); SELECT @id as id; SELECT @Usuario as usuario; SELECT @Mensaje as mensaje; SELECT Rol_idRol as Rol FROM Usuario_has_Rol WHERE Usuario_idUsuario = (SELECT @id as id);`;
  // console.log(req.body.usuario, req.body.contrasena)
  db.query(query, [req.body.usuario, req.body.contrasena], 
    function (err, result) {

      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null
        res.send(resultado)
      } else {
        resultado.error = null
        resultado.items = result
        // console.log('Este es el rol del usuario: ', resultado.items[4][0].Rol )
        // console.log(resultado.items[2][0].usuario)
        if (resultado.items[2][0].usuario != undefined ) {
          const payload = {
            check: true,
            Usuario: resultado.items[2][0].usuario,
            id: resultado.items[1][0].id,
            rol: resultado.items[4][0].Rol

          }
          const token = jwt.sign(payload, app.get('llave'), {
            expiresIn: 60 * 60 * 24
          })
          resultado.item = token
          res.send(resultado)

        } else {
          resultado.error = 'Usuario o contraseña incorrecta'
          resultado.item = null
          res.send(resultado)
        }

      }
    })
})

/** JFunez@03MAR2020
 * 
 * Se devuelve un arreglo en el campo items si el usuario tiene privilegio para dicha acción, de lo contrario, items.length = 0
 */ 

app.post('/api/validarPrivilegio', cors(), function(req,res,next){
  const query = "SELECT * FROM Rol_Privilegio RP INNER JOIN Usuario_has_Rol UR ON RP.Rol_idRol = UR.Rol_idRol WHERE UR.Usuario_idUsuario = ? AND RP.Privilegio_idPrivilegios = ? AND RP.Rol_idRol = ?"
  db.query(query, [req.body.idUsuario, req.body.idPrivilegio, req.body.idRol],
    function(err, rows){
      respuestaItems(err, rows, res)
      // if(err) throw err
      
      // let resultado = jsonResult
      // resultado.items = rows
      // res.send(resultado)
    }
    )
})



/** CVásquez@08MAR2020
 * RECUPERAR CONTRASEÑA
 * Si el correo ingresado existe, entonces se le enviará la contraseña al usuario a dicho correo
 * devuelve un 1 o 0  para frontend
 */
// Se crea el objeto transporte 
var transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'edd.leannon63@ethereal.email',
    pass: 'ZKUbPQNv8crwmEwT9J'
  }
});
app.post('/api/checkcorreo', cors(), function (req, res, next) {
  const query = 'CALL SP_VERIFICAR_CORREO(?, @Mensaje); SELECT @MENSAJE AS mensaje';
  db.query(query, [req.body.correo],
    function (err, result) {
      let resultado = jsonResult;
      resultado.error = result

      if (resultado.error[1][0].mensaje != null) {
        var mensaje = `
              <div style="background-color: #dcd6f7; width: 50%; height: 100%; text-align: center; justify-content: center; border-radius: 1rem; padding: 1rem;">
                  <div>
                      <h3>Tu contraseña Unahambre</h3>
                      <p>Has solicitado recuperar tu contraseña</p>
                      <p style="justify-content: center;">
                          Tu contraseña es:
                      </p>
                      <div">
                          
                          <h4 style="padding: 1rem; background-color: azure;">${ resultado.error[1][0].mensaje }</h4>

                      </div>
                    
                      <div>
                          <a href="http://127.0.0.1:5500/login.html" style="text-decoration: none; background-color: #f8615a; padding: .5rem; color: white; border-radius: 0.4rem;">Login UNAHAMBRE</a>
                      </div>
                      <p>Servicios UNAHAMBRE.</p>
                      <P>Gracias.</P>
                  </div>
              </div>
        `;

        var mailOptions = {
          from: 'soporte.unahambre@gmail.com',
          to: req.body.correo,
          subject: 'Soporte UNAHAMBRE',
          text: mensaje,
          html: mensaje
        }
        
      transporter.sendMail(mailOptions, function(error, info){
          if(error) {
              // console.log(error)
            res.send('no se pudo completar')
          } else {
              // console.log('Email enviado: ' + info.response)
          }
          })

        res.send('1')
      } else {
        // console.log('El correo no existe')
        res.send('0')
      }
    })
})

/** CVásquez@08MAR2020
 * Devuelve toda la información de usuarios y persona en la DB.
 */
app.get('/api/admin_global_mostrar_usuarios', cors(), router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `SELECT * FROM Usuario INNER JOIN Persona ON idPersona = Persona_idPersona`;
    db.query(query,
      function (err, result) {
        respuestaItems(err, result, res)
      })
  }
});


/** CVásquez@08MAR2020
 * Devuelve los usuarios Filtrados por rol, 0:admin, 1:Propietario local, 2:cliente.
 * Si el parametro idRol es incorrecto, items estará vacio y error indicará que ese rol no existe.
 */
// FILTRO USUARIO POR TIPO ROL
app.post('/api/admin_global_usuario_filtro_rol', cors(),router ,function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ADMIN_FILTRO_CLIENTES_ROL(?, @MENSAJE);`
    db.query(query, [req.body.idRol], 
      function (err, result) {
        if (req.body.idRol > 2) {
          let resultado = jsonResult
          resultado.error = 'No existe el rol ingresado'
          res.send(resultado)
        } else {
          respuestaItems(err, result, res)
        }     
      })
  }
})


/** CVásquez@08MAR2020
 * Cambio de contraseña para los usuarios, recibe: usuario, contrasena, nueva_contrasena
 *Si se logro el completar el cambio entonces el mensaje en el error sera null, caso contrario el mensaje no estará null
 *También se comprueba si la contraseña actual es la correcta, sino el cambio no se realiza
 *error. mensaje llevará la respuesta para frontend.
 */
app.post('/api/cambiar-contrasena', cors(), function (req, res, next) {
  const query = `CALL SP_CAMBIAR_CONTRASENA(?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`

  db.query(query, [req.body.usuario, req.body.contrasena, req.body.nueva_contrasena],
    function (err, result) {

      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.error = err
        resultado.items = null
        res.send("error al cambiar la contraseña"+resultado)
      } else {
        resultado.items = null
        resultado.error = result
       res.send(resultado)
      }
      
    })
})


/** CVásquez@13MAR2020
 *Se borra el local asi como los menús y platillos que dicho local tenga.
 *Se recibe el idRestaurante.
 *El error llevará la respuesta, si error.mensaje no está null, entonces ocurrió un problema y no se borro el local.
 */
app.put('/api/g-borrar-local', cors(), function (req, res, next) {
  const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idRestaurante], 
    function (err, result) {
      let resultado = jsonResult

      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null;
        res.send(resultado);
      } else {
        resultado.error = result;
        resultado.items = null;
        res.send(resultado);

      }
    })
})


/** CVásquez@10MAR2020
*Un admin puede desde la pagina de administración de usuarios modificar un menu
*resultado.error llevará los datos del resultado de la query
* Recibe como parametros idMenu, nombreMenu y foto, dichos parametros pueden ser nulos si no se
* desea cambiar algo del menú.
*/
app.put('/api/admin_global_modificar_menus', cors(), router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idMenu, req.body.nombreMenu, req.body.foto], 
      function (err, result) {
       respuestaError(err, result, res)
      })
  }
})
/**Robindroide
MODIFICAR PLATILLOS PARA ADMIN
*/
app.put('/api/admin_local_modificar-platillo', cors(), function (req, res, next) {
  const query = `CALL SP_LOCAL_EDITAR_PLATILLO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.descripcion, req.body.nombrePlatillo, req.body.precio, req.body.fotoPlatillo ,req.body.idMenu, req.body.idTipoPlatillo], 
    function (err, result) {
      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null;
        res.send(resultado);
      } else {
        resultado.error = result;
        resultado.items = null;
        res.send(resultado);
      }
    })
})
/**Robindroide
MODIFICAR RESTAURANTE
*/
app.put('/api/admin_global_modificar-local', cors(), router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ADMIN_EDITAR_RESTAURANTE(?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.nombreRestaurante, req.body.telefono, req.body.ubicacion, req.body.idUsuario], 
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})
/**Robindroide
* Eliminar un platillo, recibe el idPlatillo*/
app.post('/api/g-eliminar-platillo', cors(), function (req, res, next) {
  const query = `CALL SP_ELIMINAR_PLATILLO(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idPlatillo], 
    function (err, result) {
      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null;
        res.send(resultado);
      } else {
        resultado.error = result;
        resultado.items = null;
        res.send(resultado);
      }
    })
})

/** CVásquez@13MAR2020
 * Eliminar un menú, recibe el idMenu
 *En el error irá la respuesta de la petición para frontend, si error.mensaje != null entonces ocurrió un problema
 * y no se borro el menú.
 */
app.post('/api/eliminar-menu', cors(), function (req, res, next) {
  const query = `CALL SP_ELIMINAR_MENU(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idMenu], 
    function (err, result) {
      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null;
        res.send(resultado);
      } else {
        resultado.error = result;
        resultado.items = null;
        res.send(resultado);
      }
    })
})

/** CVásquez@13MAR2020
 *Cambiar nombreUsuario, Celular de un usuario
 *Parametros del JSON a recibir, idUsuario, nombreUsuario, nuevoNombre, celular.
 *La respuesta, error.mensaje, irá null si los cambios se completaron con exito.
 */
/**
 * Ejemplo del json a recibir
 * {
	"idUsuario": 1,
	"nombreUsuario": "sujeto",
	"nuevoUsuario": "Sujeto0",
	"celular": "",
	"nuevoNombre": "",
  "nuevoApellido": "Primero" }
 */
app.put('/api/cambiar-info-usuario', cors(), function (req, res, next) {
  if (req.body.nuevoUsuario == "") req.body.nuevoUsuario = null; 
  if (req.body.celular == "") req.body.celular = null; 
  if (req.body.nuevoNombre == "") req.body.nuevoNombre = null; 
  if (req.body.nuevoApellido == "") req.body.nuevoApellido = null; 
  const query = `CALL SP_CAMBIAR_INFO_USUARIO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idUsuario, req.body.nombreUsuario, req.body.nuevoUsuario, req.body.celular, req.body.nuevoNombre, req.body.nuevoApellido],
    function (err, result) {
      respuestaSuccess(err, result, res)
    })
})


/**
 * CVásquez@23MAR2020
 * Ruta exclusiva para página de admin usuarios
 * en success irá la respuesta si mensaje está null todo funciono correctamente sino hubo algun error y el cambio no se hizo
 */
app.post('/api/admin_global_editar_usuario', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    if (req.body.usuario == "") req.body.usuario = null;
    if (req.body.nombre == "") req.body.nombre = null;
    if (req.body.apellido == "") req.body.apellido = null;
    const query = `CALL SP_ADMIN_EDITAR_USUARIO(?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idUsuario, req.body.usuario, req.body.nombre, req.body.apellido],
  
      function (err, result) {
        respuestaSuccess(err, result, res)
      })
  }
})

/** CVásquez@17MAR2020
 *Obtener la información del usuario que ya está debidamente logueado
 *Se recibe desde frontend el idUsuario
 *Se retorna la info de las tablas usurio y persona
 */
app.post('/api/info-user', cors(), function (req, res, next) {
  console.log(req.body.idUsuario)
  const query = `SELECT Nombre, Apellidos, Nombre_Usuario, Celular, Sexo, Numero_Identidad, Correo  FROM Usuario
                INNER JOIN Persona 
                ON Persona_idPersona = idPersona
                WHERE idUsuario = ?`
  db.query(query, [req.body.idUsuario],
    function (err, result) {
     respuestaItems(err, result, res)
    })
})

app.post('/api/menusRestaurante', cors(), function(req,res,next){
  const query = `SELECT * FROM menu 
  INNER JOIN restaurante ON menu.Restaurante_idRestaurante = restaurante.idRestaurante
  WHERE restaurante.idRestaurante = ?`
  db.query(query, [req.body.idRestaurante], function(err,result){
    respuestaItems(err,result,res)
  })
})

/** CVásquez@17MAR2020
 *Retorna todos los menus y el restaurante al que pertenecen y el dueño del restaurante
 */
app.get('/api/admin_global_menus_restaurante', cors(), router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `SELECT idMenu, Tipo_Menu as Nombre_Menu, Fecha_Registro, Foto_Menu, idCategoria, Nombre_Local, Nombre_Usuario as Dueño_Local FROM Menu INNER JOIN Restaurante
              ON Restaurante_idRestaurante = idRestaurante
              INNER JOIN Usuario
              ON idUsuario = Usuario_idUsuario`
    db.query(query,
      function (err, result) {
        respuestaItems(err, result, res)
      })
  }
})

app.post('/api/platillosRestaurante', cors(), function(req,res,next){
  const query = `SELECT * FROM platillo 
  INNER JOIN menu ON platillo.Menu_idMenu = menu.idMenu
  INNER JOIN restaurante ON menu.Restaurante_idRestaurante = restaurante.idRestaurante
  WHERE restaurante.idRestaurante = ?`
  db.query(query, [req.body.idRestaurante], function(err, result){
    respuestaItems(err,result,res)
  })
})
/** CVásquez@17MAR2020
 *Retorna todos los platillos que pertenecen a un menu a si como también
 el que pertenecen y el restaurante
 */
app.get('/api/admin_global_platillos_menu', cors(), router, function(req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `SELECT * FROM Platillo INNER JOIN Menu
              ON Menu_idMenu = idMenu
              INNER JOIN Restaurante
              ON idRestaurante = Restaurante_idRestaurante;`
    db.query(query, 
      function(err, result) {
        respuestaItems(err, result, res)
      })
  }
})

/** CVásquez@17MAR2020
 * Recibe como parametros del JSON:
 *      idUsuario,rolUsuario nombreRestaurante, telefono, correo, ubicacion
 * el data.success llevará el mensaje de éxito o fracaso 
 */
app.post('/api/insert-restaurante', cors(), function (req, res, next) {
  const query = `CALL SP_INSERT_RESTAURANTE(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idUsuario, req.body.rolUsuario, req.body.nombreRestaurante, req.body.telefono, req.body.correo, req.body.ubicacion], 
    function (err, result) {
      respuestaSuccess(err, result, res)
    })
})



// CVásquez@18MAR2020
/***************************Servicios admin global**************************** */
/**CVásquez@18MAR2020
 * Retorna todos las solicitudes, de registro de restaurantes, existentes
 */
app.get('/api/admin_global_mostrar_solicitudes', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
   if (rol === 0) {
      const query = `SELECT idsolicitud, Restaurante_idRestaurante, Descripcion, EstadoSolicitud,
      FechaSolicitud, idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, EstadoRestaurante,
      Usuario_idUsuario, Nombre_Usuario
      FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                        INNER JOIN usuario ON Usuario_idUsuario = idUsuario;`
     db.query(query,
       function (err, result) {
         respuestaItems(err, result, res)
       })
   }
  })

/**
* CVasquez@28Mar2020
*Si el mensaje está null entonces el usuario se registro correctamente, sino entonces el mensaje
*no estará vacio.
*/
app.post('/api/admin_global_insertar_usuario', cors(), router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
    db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
      function (err, result) {
        respuestaError(err, result, res)
      }
  
    );
  }
});

/**
 * CVasquez@30Mar2020
 *
{
  "idRestaurante":
}
 */
app.post('/api/admin_global_eliminar_restaurante', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.idRestaurante],
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})

/**
{
  "idUsuario": 
}
 */
/**
 * CVasquez@28Mar2020
 * Eliminar usuarios desde la página de admin usuarios, mensaje = null : se borró el usuario
 */
app.post('/api/admin_global_eliminar_usuario', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ELIMINAR_USUARIO(?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.idUsuario],
      function (err, result){
        respuestaError(err, result, res)
      })
  }
})


/**CVásquez@18MAR2020
 * Retorna las solicitudes que tengan el estadoSolicitud igual al recibido
 * json: {estadoSolicitud: ("En espera", "Aprobada" o "Denegada")}
 */
app.post('/api/admin_gobal_solicitud_filtro_estado', cors(),router, function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `SELECT * FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                  WHERE EstadoSolicitud = ?`
    db.query(query, [req.body.estadoSolicitud],
      function (err, result) {
        respuestaItems(err, result, res)
      })
  }
})
// CRUD PARA MENÚS

/**
 * `(
{
"nombreMenu": ,
"idRestaurante": ,
"foto":  ,
"idCategoria": 
}
 */


app.post('/api/admin_global_agregar_menu', cors(),router , function (req, res, next) {  
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_INSERTAR_MENU(?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.nombreMenu, req.body.idRestaurante, req.body.foto, req.body.idCategoria], 
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})
/**
 * {
 * "idMenu": ,
 * "nombre": ,
 * "foto": 
 * }
 */
app.post('/api/admin_global_editar_menu', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
    db.query(query, [req.body.idMenu, req.body.nombre, req.body.foto], 
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})
/**{
 * "idMenu":
 * } */
app.post('/api/admin_global_borrar_menu', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_ELIMINAR_MENU(?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.idMenu], 
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})

// CRUD PARA PLATILLOS
/**
 * 
    {
      
      "idMenu" , 
      "nombre" ,
      "descripcion" , 
      "precio" , 
      "tipoPlatillo" 
    }
)
 */
app.post('/api/admin_global_agregar_platillo', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_INSERTAR_PLATILLO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.descripcion, req.body.idMenu, req.body.nombre, req.body.precio, req.body.tipoPlatillo],
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})

/**
 *
{   
  "idPlatillo":  , 
  "nombre":  , 
  "descripcion":  , 
  "precio": , 
  "idTipoPlatillo": 
}
 */
app.post('/api/admin_global_editar_platillo', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `CALL SP_EDITAR_PLATILLO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
    db.query(query, [req.body.idPlatillo, req.body.nombre, req.body.descripcion, req.body.precio, req.body.idTipoPlatillo], 
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})
/**
 * {
 * "idPlatillo":
 * }
 */
// error.affectedRows": si es igual a 1 entonces se logro borrar el platillo si es cero no se borró.
app.post('/api/admin_global_borrar_platillo', cors(),router , function (req, res, next) {
  const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
  if (rol === 0) {
    const query = `DELETE FROM platillo WHERE idPlatillo = ?`
    db.query(query, [req.body.idPlatillo],
      function (err, result) {
        respuestaError(err, result, res)
      })
  }
})


/******************************************************************************** */

// CVásquez@1ABR2020
// VERIFICAR LOS DATOS DE UN USUARIO CUANDO NAVEGA POR LAS PAGINAS
app.post('/api/g_verficar_datos_de_usuario_logueado', cors(), router, function(req, res, next) {
  const { id, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
if( (req.body.id === undefined) || (req.body.rol === undefined)) {
  res.send({mensaje: 'error al verificar el usuario'})
} else {
  if((id == req.body.id) && (rol == req.body.rol)) {
    res.send({mensaje: null})
  } else {
    res.send({ mensaje: 'error al verificar el usuario' })
  }
}

})


/**
 * 
 * <!---Estándar a usar cuando la respuesta no incluye datos
 *  Solo mensaje de exíto o fallo en la petición --->
 */

function respuestaSuccess(err, result,res) {
  let resultado = jsonResult
  if (err) resultado.error = err;
  if (result == undefined) {
    resultado.success = null
    res.send(resultado)
  } else {
    resultado.success = result
    resultado.error = null
    res.send(resultado)
  }
}

function respuestaError(err, result, res){
  let resultado = jsonResult
  if (err) resultado.error = err;
  if (result == undefined) {
    resultado.error = null
    res.send(resultado)
  } else {
    resultado.item = null
    resultado.items = null
    resultado.error = result
    res.send(resultado)
  }

}

/**
 * 
 *Estándar a usar para cuando la respuesta incluya datos
 */
function respuestaItems(err, result, res) {
  let resultado = jsonResult
  if (err) resultado.error = err;
  if (result == undefined) {
    resultado.items = null
    res.send(resultado)
  } else {
    resultado.item = null
    resultado.items = result
    resultado.error = null
    res.send(resultado)
  }
}

// CVásquez@1ABR2020
// Sacar el id y rol del usuario adminUsuario que la petición. 
function decodedJWT_admin_usuarios(token, res){
  const token_decoded = jwt.verify(token, app.get('llave'))
  const id = token_decoded.id
  const rol = token_decoded.rol
  if (rol != 0) {
    let resultado = jsonResult
    resultado.error = 'usuario no autorizado'
    // 401 Unauthorized
    res.status(401).send(resultado)
    
  }
  return {id, rol}
}
// CVásquez@1ABR2020
// Sacar el id y rol del usuario que hace la petición. 
function decodedJWT_all_usuarios(token) {
  const token_decoded = jwt.verify(token, app.get('llave'))
  const id = token_decoded.id
  const rol = token_decoded.rol
  return { id, rol }
}


/**--------------PRUEBAS----------------- */

/**PRUEBA: Si no existe el usuario la propiedad item irà vacìa, de lo contrario, llevarà una row */
app.post('/api/validarUsuario', cors(), function (req, res, next) {
  const query = 'SELECT "" FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena],
    function (err, result) {
      res.send(result)
    })
})

/**
 * Servicio para eliminar menús: LISTO
 * Servico para eliminar usuarios: ?
 * Servicio para cambiar el rol de un usuario : ?
 * Servicio para cambiar datos de un menú, platillo, restaurante: LISTO
 * Servicio para eliminar local: LISTO
 * Servicion para filtrar restaurante por idUsuario  /api/restauranteUsuario: LISTO
 * Servicio para camniar contraseña : LISTO 
 * Servicio para recuperar contraseña ; LISTO
 * Servicio para cambiar información del usuario: FALTA
 */

module.exports = router; 
