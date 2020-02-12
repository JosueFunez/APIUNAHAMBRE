var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario')
var menu = require('../models/menu')
// function getUsuarios(callback) {    
//   db.query("SELECT * FROM Usuario",
//       function (err, rows) {
//           //here we return the results of the query
//           callback(err, rows); 
//       }
//   );    
// }

/* GET home page. */
router.get('/', function(req, res, next) {   
  
  usuario.insertUser(function (err, result){ 
     //you might want to do something is err is not null...      
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
