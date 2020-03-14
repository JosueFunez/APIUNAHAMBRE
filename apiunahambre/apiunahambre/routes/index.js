var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
var cors = require('cors')
var jsonResult = require('../models/result')
var app = express()
var bodyParser = require('body-parser')
var db = require('../connection/conexion')

const jwt = require('jsonwebtoken')
const config = require('../configs/config')

var nodemailer = require('nodemailer')


app.set('llave', config.llave)
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors())
app.use(bodyParser())
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



//FINAL Get Lista Restaurantes
// Devuelve la lista de los restaurantes en la DB
app.get('/api/restaurantes', function (req, res, next) {

    const query = `SELECT * FROM Restaurante`;
    db.query(query,
      function (err, result) {

        let resultado = jsonResult;
        resultado.items = result

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
app.get('/api/menus', cors(), function (req, res, next) {

  const query = `SELECT * FROM Menu`;
  db.query(query,
    function (err, result) {

      let resultado = jsonResult;
      resultado.items = result

      res.send(resultado)
    })
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
  const query = 'CALL SP_LOGIN(?, ?, @id, @Usuario @Mensaje); SELECT @id, @Usuario, @Mensaje;';
  db.query(query, [req.body.usuario, req.body.contrasena], 
    function (err, result) {

      let resultado = jsonResult;
      resultado.error = result

      res.send(resultado)
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
    user: 'emmet.mohr@ethereal.email',
    pass: '9tXyaN9gZMcp4mc6Bh'
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
                          <a href="#" style="text-decoration: none; background-color: #f8615a; padding: .5rem; color: white; border-radius: 0.4rem;">Login UNAHAMBRE</a>
                      </div>
                      <p>Servicios UNAHAMBRE.</p>
                      <P>Gracias.</P>
                  </div>
              </div>
        `;

        var mailOptions = {
          from: 'soporte.unahambre@gmail.com',
          to: req.body.correo,
          subject: 'Asunto del correo',
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
 * Devuelve todos los usuarios en la DB.
 */
app.get('/api/getusuarios', cors(), function (req, res, next) {

  const query = `SELECT * FROM Usuario`;
  db.query(query,
    function (err, result) {

      let resultado = jsonResult;
      resultado.items = result

      res.send(resultado)
    })
});


/** CVásquez@08MAR2020
 * Devuelve los usuarios Filtrados por rol, 0:admin, 1:Propietario local, 2:cliente.
 * Si el parametro idRol es incorrecto, items estará vacio y error indicará que ese rol no existe.
 */
// FILTRO USUARIO POR TIPO ROL
app.get('/api/usuario-rol', cors(), function (req, res, next) {
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
 *Si se logro el completar el cambio entonces el mensaje sera null, caso contrario el mensaje no estará null
 *También se comprueba si la contraseña actual es la correcta, sino el cambio no se realiza
 *error. mensaje llevará la respuesta para frontend.
 */
app.post('/api/cambiar-contrasena', cors(), function (req, res, next) {
  const query = `CALL SP_CAMBIAR_CONTRASENA(?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`

  db.query(query, [req.body.usuario, req.body.contrasena, req.body.nueva_contrasena],
    function (err, result) {
      let resultado = jsonResult
      resultado.error = result
      res.send(resultado)
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
app.put('/api/combiar-info-usuario', cors(), function (req, res, next) {
  const query = `CALL SP_CAMBIAR_INFO_USUARIO(?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
  db.query(query, [req.body.idUsuario, req.body.nombreUsuario, req.body.nuevoNombre, req.body.celular],
    function (err, result) {
      let resultado = jsonResult
      if (err) resultado.error = err;
      if(result == undefined) {
        resultado.items = null
      } else {
        resultado.error = result
        resultado.items = null
        res.send(resultado)
      }
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
