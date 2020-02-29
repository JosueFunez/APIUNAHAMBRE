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
function getMenusPorRestaurantes(Restaurante, callback) {
  const query = `SELECT * FROM Menu WHERE Restaurante_idRestaurante = ?`;

  db.query(query, [Restaurante],
    function (err, rows) {
      callback(err, rows);
    }

  );
}

// Get Restaurantes
// Se envia la lista de los restaurantes registrados
function getRestaurantes(callback) {
  const query = `SELECT idRestaurante, Nombre_Local FROM Restaurante`;

  db.query(query,
    function (err, rows) {
      callback(err, rows);
    }

  );
}


  module.exports = {getPlatillosFiltro : getPlatillosFiltro, 
                    getMenus: getMenus,
                    getMenusPorRestaurantes: getMenusPorRestaurantes,
                    getRestaurantes: getRestaurantes
                  }