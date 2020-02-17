var jsonResult = require('../models/result') 
var db = require('../connection/conexion')

/* Funciones que pertenecen o involucran a los usuarios */

  function getUsuarios (callback) {     //Función que recibe un callback como parámetro y devuelve el resultado de la consulta
    db.query("SELECT * FROM Usuario",
        function (err, rows) {          
            callback(err, rows); 
        }
    );    
  }
  
  function getUsuario(idUsuario, callback) {
     db.query('SELECT * FROM Usuario Where idUsuario='+idUsuario, function(err, rows){
            callback(err,rows);

     });
  }

  var insertUser = (callback) => { //Función flecha que realzia un insert y devuelve un jsonResult como respuesta.
    var sql = "INSERT INTO Usuario (idUsuario,Nombre_Usuario,Fecha_Ingreso,Contrasena,Foto_Perfil, Persona_idPersona)VALUES(3,'Use0r',NOW(),'asd',null,3)";
    db.query('SELECT * FROM Usuario', function(err, result){
      if (err) throw err;
        resultado = jsonResult
        callback(err, resultado)
    })
  
  }
 

/* Para que puedan ser usadas externamente es necesario exportarlas */

module.exports = {insertUser: insertUser,
getUsuarios:getUsuarios, getUsuario:getUsuario};

