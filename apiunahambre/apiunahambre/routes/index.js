var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
var cors = require('cors')
var jsonResult = require('../models/result')
var app = express()
var bodyParser = require('body-parser')
var db = require('../connection/conexion')

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
  destination: path.join(__dirname, 'public/uploadsProfilePics'),
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
  dest : path.join(__dirname, 'public/uploadsProfilePics'),
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
 *Middleware para verificar el jwt enviado por frontend
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
// POST SUBIR IMAGEN
app.post('/upload', (req, res) => {
  let file = req.file;
  const query = `UPDATE Usuario SET Foto_Perfil = ? WHERE idUsuario = ?`;
  db.query(query, file.path, [req.body.idUsuario],
      function (err, result) {
      res.send(file.path); 
  });
});

// FINAL Get Lista Restaurantes
// Devuelve la lista de los restaurantes en la DB
app.get('/api/restaurantes', function (req, res, next) {

    const query = `SELECT * FROM Restaurante`;
    db.query(query,
      function (err, result) {
        console.log(result)
        console.log(err)
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
app.get('/api/menus', cors(), function (req, res, next) {

  const query = `SELECT * FROM Menu`;
  db.query(query,
    function (err, result) {
      respuestaItems(err, result, res)
      // let resultado = jsonResult;
      // resultado.items = result

      // res.send(resultado)
    }
    )
});



/** CVasquez@04MAR2020
 *
 * Se devuelve un arreglo en el campo items con los platillos existentes en la base de datos
 */

app.get('/api/platillos', cors(), function (req, res, next) {

  const query = `SELECT * FROM Platillo`;
  db.query(query,
    function (err, result) {

      let resultado = jsonResult;
      resultado.items = result

      res.send(resultado)
    })
});



/**PRUEBA: Si no existe el usuario la propiedad item irà vacìa, de lo contrario, llevarà una row */
app.post('/api/validarUsuario', cors(), function (req, res, next) {
  const query = 'SELECT "" FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena], 
    function (err, result) {
    res.send(result)
  })
})


//      * CVasquez@02Mar2020
//      *El error llevará el mensaje para la consulta
//      *Indicará si se concede o no el acceso al usuario 
//     */

// POST PARA LOGIN
app.post('/api/login', cors(), function (req, res, next) {
  const query = `CALL SP_LOGIN(?, ?, @id, @Usuario, @Mensaje); SELECT @id as id; SELECT @Usuario as usuario; SELECT @Mensaje as mensaje; SELECT Rol_idRol as Rol FROM Usuario_has_Rol WHERE Usuario_idUsuario = (SELECT @id as id);`;
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

        if (resultado.items[2][0].usuario != undefined ) {
          const payload = {
            check: true,
            nombreUsuario: resultado.items[2][0].usuario,
            idUsuario: resultado.items[1][0].id
          }
          const token = jwt.sign(payload, app.get('llave'), {
            expiresIn: 1440
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



/**PRUEBA: Si no existe el usuario la propiedad item ira vacìa, de lo contrario, llevarà una row */
app.post('/api/obtenerUsuario', cors(), function (req, res, next) {
  const query = 'SELECT * FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena], 
    function (err, rows) {
     let resultado = jsonResult
     if (err) resultado.error = err;
     resultado.items = rows
    res.send(resultado)
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
      if(err) throw err
      
      let resultado = jsonResult
      resultado.items = rows
      res.send(resultado)
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
    user: 'nathan.moore57@ethereal.email',
    pass: 'ZvkZS84TVCHAFumB2r'
  }
});
app.post('/api/checkcorreo', cors(), function (req, res, next) {
  const query = 'CALL SP_VERIFICAR_CORREO(?, @Mensaje); SELECT @MENSAJE AS mensaje';
  db.query(query, [req.body.correo],
    function (err, result) {
      let resultado = jsonResult;
      resultado.error = result

      if (resultado.error[1][0].mensaje != null) {
        // console.log('El correo existe')
        // console.log('LA CONTRASEÑA ES : ' + resultado.error[1][0].mensaje)

        // PROCESO DE ENVIAR CORREO
        // ${ resultado.error[1][0].mensaje }
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
              console.log(error)
          } else {
              console.log('Email enviado: ' + info.response)
          }
          })

        res.send('1')
      } else {
        console.log('El correo no existe')
        res.send('0')
      }
    })
})

/** CVásquez@08MAR2020
 * Devuelve toda la información de usuarios y persona en la DB.
 */
app.get('/api/getusuarios', cors(), function (req, res, next) {
  console.log("recibido")
  const query = `SELECT * FROM Usuario INNER JOIN Persona ON idPersona = Persona_idPersona`;
  db.query(query,
    function (err, result) {
      respuestaItems(err, result, res)
      // let resultado = jsonResult;
      // resultado.items = result

      // res.send(resultado)
    })
});


/** CVásquez@08MAR2020
 * Devuelve los usuarios Filtrados por rol, 0:admin, 1:Propietario local, 2:cliente.
 * Si el parametro idRol es incorrecto, items estará vacio y error indicará que ese rol no existe.
 */
// FILTRO USUARIO POR TIPO ROL
app.post('/api/usuario-rol', cors(), function (req, res, next) {
  const query = `CALL SP_ADMIN_FILTRO_CLIENTES_ROL(?, @MENSAJE);`
  db.query(query, [req.body.idRol], 
    function (err, result) {
      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null;
        res.send(resultado);
      } else {
        if (req.body.idRol > 2) {
          resultado.error = 'No existe el rol ingresado'
          res.send(resultado)
        }else{
          resultado.error = err;
          resultado.items = result;
          res.send(resultado);
        }
      }
      
    })
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
app.put('/api/admin-borrar-local', cors(), function (req, res, next) {
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
app.put('/api/admin/modificar_menus', cors(), function (req, res, next) {
  const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idMenu, req.body.nombreMenu, req.body.foto], 
    function (err, result) {
      let resultado = jsonResult
      // resultado.error = result

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
  console.log('recibido')
  if (req.body.nuevoUsuario == "") req.body.nuevoUsuario = null; 
  if (req.body.celular == "") req.body.celular = null; 
  if (req.body.nuevoNombre == "") req.body.nuevoNombre = null; 
  if (req.body.nuevoApellido == "") req.body.nuevoApellido = null; 


  const query = `CALL SP_CAMBIAR_INFO_USUARIO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idUsuario, req.body.nombreUsuario, req.body.nuevoUsuario, req.body.celular, req.body.nuevoNombre, req.body.nuevoApellido],
    
    function (err, result) {
      respuestaSuccess(err, result, res)
      // let resultado = jsonResult
      // if (err) resultado.error = err;
      // if(result == undefined) {
      //   resultado.items = null
      //   res.send(resultado);

      // } else {
      //   resultado.error = result
      //   resultado.items = null
      //   res.send(resultado)
      // }
    })
})


// JSON a recibir desde frontend
// {
//   "nombreUsuario": "manolo",
//     "password": "holamundo"

// }
// PRueba para jwt 
app.post('/api/autenticar', cors(), (req, res) => {
  let resultado = jsonResult

  if (req.body.nombreUsuario === "manolo" && req.body.password === "holamundo") {
    const payload = {
      check: true,
      nombreUsuario: "Manolito01",
      idUsuario: 23
    }
    const token = jwt.sign(payload, app.get('llave'), {
      expiresIn: 1440
    })
    resultado.error = 'Autenticacion correcta'
    resultado.item = token
    res.send(resultado)
    // res.json({
    //   mensaje: 'Autenticacion correcta',
    //   token: token
    // })

  } else {
    // res.json({ mensaje: "Usuario o contraseña incorrectos"})
    resultado.item = null
    resultado.error = "Usuario o contraseña incorrectos"
    res.send(resultado)
  }
})


// PRUEBA para verificar un jwt recibido desde frontend
// BORRAR LUEGO 
app.get('/datos', router, (req, res) => {
  const datos = [
    {
      id:1, nombre: "Carlos"
    },
    {
      id:2, nombre: "loquesea"
    }
  ]
  res.json(datos)
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
      let resultado = jsonResult
      if (err) resultado.error = err;
      if (result == undefined) {
        resultado.items = null
        res.send(resultado);
      } else {
        resultado.error = null
        resultado.items = result
        res.send(resultado)
      }
    })
})

/** CVásquez@17MAR2020
 *Retorna todos los menus y el restaurante al que pertenecen y el dueño del restaurante
 */
app.get('/api/menusRestaurantesPropietarios', cors(), function (req, res, next) {
  const query = `SELECT idMenu, Tipo_Menu as Nombre_Menu, Fecha_Registro, Foto_Menu, idCategoria, Nombre_Local, Nombre_Usuario as Dueño_Local FROM Menu INNER JOIN Restaurante
            ON Restaurante_idRestaurante = idRestaurante
            INNER JOIN Usuario
            ON idUsuario = Usuario_idUsuario`
  db.query(query,
    function (err, result) {
      respuestaItems(err, result, res)
      // let resultado = jsonResult
      // if (err) resultado.error = err;
      // if (result == undefined) {
      //   resultado.items = null;
      //   res.send(resultado);
      // } else {
      //   resultado.error = null;
      //   resultado.items = result;
      //   res.send(resultado);
      // }

    })
})

/** CVásquez@17MAR2020
 *Retorna todos los platillos y  menus al que pertenecen y el restaurante
 */
app.get('/api/platilloMenuRestaurante', cors(), function(req, res, next) {
  const query = `SELECT * FROM Platillo INNER JOIN Menu
            ON Menu_idMenu = idMenu
            INNER JOIN Restaurante
            ON idRestaurante = Restaurante_idRestaurante;`
  db.query(query, 
    function(err, result) {
      respuestaItems(err, result, res)
      // let resultado = jsonResult
      // if (err) resultado.error = err;
      // if (result == undefined) {
      //   resultado.items = null;
      //   res.send(resultado);
      // } else {
      //   resultado.error = null;
      //   resultado.items = result;
      //   res.send(resultado);
      // }

    })
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
      // let resultado = jsonResult
      // if (err) resultado.error = err;
      // if (result == undefined) {
      //   resultado.success = null
      //   res.send(resultado)
      // } else {
      //   resultado.error = null
      //   resultado.success = result
      //   res.send(resultado)
      // }
    })
})

/**CVásquez@18MAR2020
 * Retorna todos las solicitudes, de registro de restaurantes, existentes
 */
app.get('/api/solicitudes', cors(), function (req, res, next) {
  const query = `SELECT * FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante`
  db.query(query, 
    function (err, result) {
      respuestaItems(err, result, res)
    })
})

/**CVásquez@18MAR2020
 * Retorna las solicitudes que tengan el estadoSolicitud igual al recibido
 * json: {estadoSolicitud: ("En espera", "Aprobada" o "Denegada")}
 */
app.post('/api/filtro-solicitud', cors(), function(req, res, next) {
  const query = `SELECT * FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                WHERE EstadoSolicitud = ?`
  db.query(query, [req.body.estadoSolicitud], 
    function (err, result) {
      respuestaItems(err, result, res)
    })
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
    resultado.items = result
    resultado.error = null
    res. send(resultado)
  }
}

/**
 * Servicio para eliminar menús: LISTO
 * Servico para eliminar usuarios: ?
 * Servicio para cambiar el rol de un usuario : ?
 * Servicio para cambiar datos de un menú, platillo: LISTO
 * Servicio para eliminar local: LISTO
 * Servicion para filtrar restaurante por idUsuario  /api/restauranteUsuario: LISTO
 * Servicio para camniar contraseña : LISTO 
 * Servicio para recuperar contraseña ; LISTO
 * Servicio para cambiar información del usuario: FALTA
 */

module.exports = router; 
