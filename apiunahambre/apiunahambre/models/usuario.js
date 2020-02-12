var jsonResult = require('../models/result')
var db = require('../connection/conexion')

  function getUsuarios (callback) {    
    db.query("SELECT * FROM Usuario",
        function (err, rows) {
          
            callback(err, rows); 
        }
    );    
  }
  
  var insertUser = (callback) => {
    var sql = "INSERT INTO Usuario (idUsuario,Nombre_Usuario,Fecha_Ingreso,Contrasena,Foto_Perfil, Persona_idPersona)VALUES(3,'Use0r',NOW(),'asd',null,3)";
    db.query('SELECT * FROM Usuario', function(err, result){
      if (err) throw err;
      console.log('Insert');
      sql = 'Insert';
      resultado = jsonResult
      callback(err, resultado)
    })
  
  }
 



module.exports = {insertUser: insertUser,
getUsuarios:getUsuarios};

