/* Datos de conexión, editar según sea el caso */

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '10.128.0.2',
user: 'root',
password: 'admin',
database: 'unahambre_2020',
multipleStatements: true
});




module.exports = connection;