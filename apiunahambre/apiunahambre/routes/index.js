var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')



//gets que redirigen a la ruta del servicio

router.get('/', function(req, res, next) {   
  usuario.insertUser(function (err, result){ 
        
    res.send(result)
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
