// var jsonResult = require('./result')
var db = require('../connection/conexion')
var nodemailer = require('nodemailer')


// Se crea el objeto transporte 
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'soport.unahambre@gmail.com',
        pass: 'unahambre_IPAC2020'
    }
});

function send_correo(correo_destino, IdPersona, callback){
    const query = `SELECT Contrasena FROM Usuario WHERE Persona_idPersona = ?`;

    db.query(query, [IdPersona],
        function (err, rows) {
            console.log('Esta es la contraseña ' + err + 'de ' + correo_destino)


            var mensaje = `Hola desde nodejs...joto <h3>${err}</h3>`;
            console.log(mensaje)

            var mailOptions = {
                from: 'soport.unahambre@gmail.com',
                to: correo_destino,
                subject: 'Asunto del correo',
                terxt: mensaje
            }
            console.log(mailOptions)
            callback.send('1')

            /***
            transporter.sendMail(mailOptions, function(error, info){
                if(error) {
                    console.log(error)
                } else {
                    console.log('Email enviado: ' + info.response)
                }
                })
            */


        }

        

    );
    
}

module.exports =  {send_correo: send_correo}

