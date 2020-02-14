DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `SP_ELIMINAR_USUARIO`(IN `PI_IDUSUARIO` INT, IN `PI_IDPERSONA` INT, IN `PI_IDROL` INT, OUT `PV_MENSAJE` VARCHAR(2000))
SP: BEGIN 
	CALL SP_VALIDACION_NULOS(PI_IDUSUARIO, 'ID Usuario', PV_MENSAJE);
    IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;
    CALL SP_ELIMINAR_ROL_USUARIO(PI_IDUSUARIO, PI_IDROL, PV_MENSAJE);
IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;

    IF EXISTS (SELECT Usuario.idUsuario FROM Usuario WHERE idUsuario = PI_IDUSUARIO ) THEN
    	DELETE FROM usuario WHERE usuario.idUsuario=PI_IDUSUARIO;
        DELETE FROM persona WHERE persona.idPersona = PI_IDPERSONA;
    ELSE 
        SET PV_MENSAJE = CONCAT("El usuario ", PI_IDUSUARIO, "no existe. ");
    END IF;
END$$
DELIMITER ;
    

