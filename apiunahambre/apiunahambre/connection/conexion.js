/* Datos de conexión, editar según sea el caso */

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
user: 'root',
password: '',
database: 'unahambre',
multipleStatements: true
});




module.exports = connection;