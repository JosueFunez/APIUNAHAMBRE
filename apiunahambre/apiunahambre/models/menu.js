var jsonResult = require('../models/result')
var db = require('../connection/conexion')

  function getPlatillosFiltro ( filtroPlatillo,callback) {    
    db.query("SELECT * FROM Platillo WHERE Nombre LIKE '%"+filtroPlatillo+"%'",
        function (err, rows) {
            //here we return the results of the query
            callback(err, rows); 
        }
    );    
  }
  module.exports = {getPlatillosFiltro : getPlatillosFiltro}