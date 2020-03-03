var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
var cors = require('cors')
var jsonResult = require('../models/result')
var app = express()
var bodyParser = require('body-parser')
var db = require('../connection/conexion')

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

router.get('/api/filtroplatillo', cors(), function(req, res, next) {   
  
  menu.getPlatillosFiltro('p', function(err, result){

    res.send(result)
  });
});



app.listen(3001, function () {
  console.log('CORS-enabled web server listening on port 3001')
})

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
    const query = `SELECT idRestaurante, Nombre_Local FROM Restaurante`;
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

/**PRUEBA: Si no existe el usuario la propiedad item irà vacìa, de lo contrario, llevarà una row */
app.post('/api/validarUsuario', cors(), function (req, res, next) {
  const query = 'SELECT "" FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena], 
    function (err, result) {
    res.send(result)
  })
})


// INSERTAR USUARIO
// router.post('/api/insertuser', cors(), function (req, res, next) {
//   connsole.log("asd")
//   usuario.postInsertarUsuario(req, function (err, result) {
//     let resultado = jsonResult;
//     resultado.error = result
//     /** 
//      * JFunez@27Feb2020
//      * (resultado.error[0].mensaje) 
//      * De esta forma debe acceder frontend al error, si el error es nulo el sp se ejecutò correctamente
//      * sino, que gestionen la excepciòn
//     */
//   //  

//     res.send(resultado)

    
//   });
// });
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




/**PRUEBA: Si no existe el usuario la propiedad item irà vacìa, de lo contrario, llevarà una row */
app.post('/api/validarUsuario', cors(), function (req, res, next) {
  const query = 'SELECT "" FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena], 
    function (err, result) {
    res.send(result)
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




module.exports = router; 
