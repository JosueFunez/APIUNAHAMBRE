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
// app.use(express.json());
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

/**PRUEBA: Si no existe el usuario la propiedad item irà vacìa, de lo contrario, llevarà una row */
router.post('/api/validarUsuario', cors(), function(req,res,next){
  usuario.validarUsuario(req, function(err, result){
      let resultado = jsonResult;
      resultado.item = result;
      res.send(resultado)
  })
})
/*Validar usuario con nombreUsuario o correo */
router.post('/api/loginUsuario', cors(), function (req, res, next) {
  usuario.loginUsuario(req, function (err, result) {
    let resultado = jsonResult;
    resultado.item = result;
    res.send(resultado)
  })
})




app.listen(3001, function () {
  console.log('CORS-enabled web server listening on port 3001')
})

// FINAL POST 
app.post('/api/prueba', function (req, res, next) {
  // const query = `SELECT * FROM Menu WHERE Restaurante_idRestaurante = 4`;
  const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
  db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
    function (err, resultado) {
      res.send(resultado[1]);
    }

  );
});
/**
//      * CVasquez@29Feb2020
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
        res.send(result);
      }

    );
});

// FINAL getMenus
app.get('/api/menus', cors(), function (req, res, next) {

  const query = `SELECT * FROM Menu`;
  db.query(query,
    function (err, rows) {
      console.log(rows)
      res.send(rows)
    })
});



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


module.exports = router; 
