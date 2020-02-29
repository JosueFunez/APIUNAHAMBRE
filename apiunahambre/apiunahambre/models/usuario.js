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
 
// PRUEBA INSERTAR USUARIO 
function postInsertarUsuario(req, callback) {

  const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
  console.log(req.body);
  db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
    function (err, res) {
      callback(err,res[1]);
    }

  );
  
  
}

// Validar Usuario Login
function validarUsuario(req, callback){
  const query = 'SELECT "" FROM Usuario WHERE Nombre_Usuario = ? AND Contrasena = ?'
  db.query(query, [req.body.nombreUsuario, req.body.contrasena],function (err, res){    
    callback(err, res)
  })
}

// Login, validar usuario con nombreUsuario o correo
function loginUsuario(req, callback){
  const query = `CALL SP_VALIDAR_USUARIO(?,?,?, @Mensaje); SELECT @Mensaje AS mensaje`;
  db.query(query, [req.body.nombreUsuario, req.body.correo, req.body.contrasena], function (err, res){
    callback(err, res)
  })
}

/* Para que puedan ser usadas externamente es necesario exportarlas */

module.exports = {insertUser: insertUser,
getUsuarios:getUsuarios, getUsuario:getUsuario,
  postInsertarUsuario:postInsertarUsuario,
  validarUsuario: validarUsuario,
  loginUsuario: loginUsuario
};

