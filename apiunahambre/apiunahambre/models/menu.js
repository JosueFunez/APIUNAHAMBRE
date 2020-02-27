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

  // Get menus
function getMenus(callback) {
  const query = `SELECT * FROM Menu WHERE idCategoria = 2`;
  
  db.query(query,
    function(err, rows) {
      callback(err, rows);
    }

  );
}

// Get menus con filtro por Restaurante
function getMenus_x_Restaurantes(Restaurante, callback) {
  const query = `SELECT * FROM Menu WHERE Restaurante_idRestaurante = ?`;

  db.query(query, [Restaurante],
    function (err, rows) {
      callback(err, rows);
    }

  );
}

  module.exports = {getPlatillosFiltro : getPlatillosFiltro, 
                    getMenus: getMenus,
                    getMenus_x_Restaurantes: getMenus_x_Restaurantes
                  }