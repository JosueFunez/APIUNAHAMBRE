var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
var cors = require('cors')
var jsonResult = require('../models/result')
var app = express()
var bodyParser = require('body-parser')
var db = require('../connection/conexion')

var nodemailer = require('nodemailer')


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
router.get('/', cors(), function(req, res, next) {  //Dirección recibida desde frontend (/) y función callback  
  usuario.insertUser(function (err, result){ //Llamado a la función insertUser del modelo usuario
        
    res.send(result) //Envío a frontend del resultado obtenido por la función insertUser
  });
});

router.get('/api/gets', cors(), function(req, res, next) {   
 
  usuario.getUsuarios(function (err, result){ 
         
     res.send(result)

  });
});

//Ejemplo de una petición POST en la cual podemos manipular la información enviada por el cliente por medio del parámetro "req"

router.post('/api/getUsuario', cors(),  function(req,res,next){

  usuario.getUsuario(req.body.Usuario, function(err, result){

    res.send(result);
})

});



/** CVasquez@04MAR2020
 *
 * Obtiene el puerto asignado por el servicio de nube o se le asigna el puerto 3001
 */
app.set('port', process.env.PORT || 3001);

// app.listen(3001, )

app.listen(app.get('port'), function () {
  console.log('CORS-enabled web server listening on port ',app.get('port'));
});

// FINAL POST 
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
/**
//      * CVasquez@02Mar2020
//      *Si el mensaje está vacio entonces el usuario se registro correctamente, sino entonces el mensaje 
//      *no estará vacio.
//      * De esta forma debe acceder frontend al error, si el error es nulo el sp se ejecutò correctamente
//      * sino, que gestionen la excepciòn
//     */


//FINAL Get Lista Restaurantes
// Devuelve la lista de los restaurantes en la DB
app.get('/api/restaurantes', function (req, res, next) {
  // Get Restaurantes
  // Se envia la lista de los restaurantes registrados
    const query = `SELECT * FROM Restaurante`;
    db.query(query,
      function (err, result) {

        let resultado = jsonResult;
        resultado.items = result

        res.send(resultado);
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


// POST PARA LOGIN
app.post('/api/login', cors(), function (req, res, next) {
  const query = 'CALL SP_LOGIN(?, ?, @Mensaje); SELECT @Mensaje AS mensaje;';
  db.query(query, [req.body.usuario, req.body.contrasena], 
    function (err, result) {

      let resultado = jsonResult;
      resultado.error = result

      res.send(resultado)
    })
})
//      * CVasquez@02Mar2020
//      *El error llevará el mensaje para la consulta
//      *Indicará si se concede o no el acceso al usuario 
//     */


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
 *
 * Si el correo ingresado existe, entonces se le enviará la contraseña al usuario a dicho correo
 * devuelve un 1 o 0  para frontend
 */
//  RECUPERAR CONTRASEÑA
// Se crea el objeto transporte 
var transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'kali.wilderman@ethereal.email',
    pass: 'Ra8PP1PutCW4ZSyvnt'
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

// PRUEBA PARA MARIO::: Retorna todos los usuario en la base de datos 
app.get('/api/getusuarios', cors(), function (req, res, next) {

  const query = `SELECT * FROM Usuario`;
  db.query(query,
    function (err, result) {

      let resultado = jsonResult;
      resultado.items = result

      res.send(resultado)
    })
});


module.exports = router; 
