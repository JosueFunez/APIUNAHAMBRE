/* Datos de conexión, editar según sea el caso */

/** Montada la BD a Azure JFunez@15032020 #SprintDeCarlosAmaya */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'devuh.mysql.database.azure.com',
user: 'rootuh@devuh',
password: 'UH_password',
database: 'unahambre',
multipleStatements: true
});


module.exports = connection;