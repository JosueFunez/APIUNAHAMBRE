DELIMITER $$
CREATE PROCEDURE `SP_EDITAR_USUARIO`(
IN PI_IDPERSONA INT,
IN PI_IDUSUARIO INT,
IN PV_NOMBRE_USUARIO VARCHAR(20),
IN PV_NUEVO_NOMBRE_USUARIO VARCHAR(20),
IN PV_NUEVO_CELULAR VARCHAR(8),
IN PV_CONTRASENA VARCHAR(30),
IN PV_NUEVA_CONTRASENA VARCHAR(30),
IN PV_FOTO_PERFIL VARCHAR(50),
OUT PV_MENSAJE VARCHAR(2000) 
)
SP: BEGIN

	/*
	 =============================================
	 @Autor:      Carlos Amaya
	 @Fecha de creación: 08/Feb/2020
	 @Descripción: Editar datos de un usuario registrado

	 @Historial de cambios:
	 08/FEB/2020 Carlos Amaya: Obterner idUsuario como parametro

	 =============================================
	*/
	   

/* El nombre no podrá ser editado tampoco el apellido, solo el nombre de usuario
																	Celular
                                                                    Foto de perfil
                                                                    Contraseña */
       
    /* Validación de parámetros que no deben ser nulos */
      CALL SP_VALIDACION_NULOS(PI_IDUSUARIO, 'ID Usuario', PV_MENSAJE);
    IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;
	
      CALL SP_VALIDACION_NULOS(PI_IDPERSONA, 'ID DE PERSONA', PV_MENSAJE);
    IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;
	
    
    CALL SP_VALIDACION_NULOS(PV_NOMBRE_USUARIO, 'Nombre de Usuario', PV_MENSAJE);
    IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;
	
    
	START TRANSACTION;
          /*Si el usuario desea cambiar su contraseña */
    IF PV_NUEVA_CONTRASENA IS NOT NULL AND PV_NUEVA_CONTRASENA != '' THEN
		/* Verificar la contraseña vieja*/
		IF PV_CONTRASENA != (SELECT Usuario.Contrasena FROM Usuario
							WHERE Usuario.idUsuario = PI_IDUSUARIO) THEN
			SET PV_MENSAJE = 'La contraseña ingresada no corresponde a tu contraseña actual';
			LEAVE SP;
		END IF;
        
		UPDATE Usuario 
		SET 
			Contrasena = PV_NUEVA_CONTRASENA
		WHERE
			Usuario.idUsuario = PI_IDUSUARIO;
        
    END IF;
    
    /* Si el usuario desea cambiar su nombre de usuario */
	 IF PV_NUEVO_NOMBRE_USUARIO IS NOT NULL AND PV_NUEVO_NOMBRE_USUARIO != '' THEN
			/* Validación deL Nuevo Nombre usuario repetidos */
		IF EXISTS (SELECT Usuario.Nombre_Usuario FROM Usuario WHERE Nombre_Usuario = PV_NUEVO_NOMBRE_USUARIO ) THEN
			SET PV_MENSAJE = 'El nombre de usuario ya existe';
            ROLLBACK;
            LEAVE SP;
		END IF;
            /* Editar tabla usuario */
		UPDATE Usuario 
		SET 
			Nombre_Usuario = PV_NUEVO_NOMBRE_USUARIO
		WHERE
			idUsuario = PI_IDUSUARIO;

    END IF;
    
	/* Si el usuario desea cambiar su número de celular */
    IF PV_NUEVO_CELULAR IS NOT NULL AND PV_NUEVO_CELULAR != '' THEN
			/* Editar el celular, que está en la tabla Persona*/    
			UPDATE Persona 
			SET 
				Celular = PV_NUEVO_CELULAR
			WHERE
				idPersona = PI_IDPERSONA;
	END IF;
    
    
    /* Si el usuario desea cambiar su foto de perfil */
    IF PV_FOTO_PERFIL IS NOT NULL AND PV_FOTO_PERFIL != '' THEN
		UPDATE Usuario
			SET
				Foto_Perfil = PV_FOTO_PERFIL
		WHERE idUsuario = PI_IDUSUARIO;
    END IF;
COMMIT;
END$$
DELIMITER ;