var jsonResult = require('../models/result')
var db = require('../connection/conexion')


  //Get para el platillo (Landing page)
  function getPlatillosFiltro ( filtroPlatillo,callback) {    
    db.query("SELECT * FROM Platillo WHERE Nombre LIKE '%"+filtroPlatillo+"%'",
        function (err, rows) {
          
            callback(err, rows); 
        }
    );    
  }
  module.exports = {getPlatillosFiltro : getPlatillosFiltro}