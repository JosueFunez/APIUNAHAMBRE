/* Datos de conexión, editar según sea el caso */

var mysql = require('mysql');
var connection = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'password',
database: 'unahambre'
});




module.exports = connection;