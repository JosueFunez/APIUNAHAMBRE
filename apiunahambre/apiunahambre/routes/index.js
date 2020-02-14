var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')

/*JFunez@13Feb2020

Index.js

En este momento el index.js es la página de inicio desde donde se redirige a todos los servicios,
en otro sprint se crearán rutas únicas para cada página de frontend.
*/



/* Las siguientes funciones hacen uso de los servicios que se encuentran en cada modelo, 
todas las funciones router.get o post reciben como parámetro la dirección que enviará el frontend
y la respuesta (callback) que nosotros enviaremos*/


/* La función callback recibe como parámetros:
req: representa la petición (Request)
res: representa la respuesta a enviar (Result)
next: representa la siguiente funciíon callback a llamar (Uso del middleware) en próximos sprint haremos uso de este parámetro
*/
router.get('/', function(req, res, next) {  //Dirección recibida desde frontend (/) y función callback  
  usuario.insertUser(function (err, result){ //Llamado a la función insertUser del modelo usuario
        
    res.send(result) //Envío a frontend del resultado obtenido por la función insertUser
  });
});

router.get('/api/gets', function(req, res, next) {   
 
  usuario.getUsuarios(function (err, result){ 
         
     res.send(result)

  });
});

router.get('/api/filtroplatillo', function(req, res, next) {   
  
  menu.getPlatillosFiltro('p', function(err, result){

    res.send(result)
  });
});

module.exports = router; 
