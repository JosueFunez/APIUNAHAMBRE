DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `SP_ELIMINAR_ROL_USUARIO`(IN `PI_IDUSUARIO` INT, IN `PI_IDROL` INT, OUT `PV_MENSAJE` VARCHAR(2000))
SP: BEGIN 
	CALL SP_VALIDACION_NULOS(PI_IDUSUARIO, 'ID Usuario', PV_MENSAJE);
    IF PV_MENSAJE IS NOT NULL THEN 
        LEAVE SP;
    END IF;
IF (EXISTS (SELECT usuario_has_rol.Usuario_idUsuario FROM usuario_has_rol WHERE Usuario_idUsuario = PI_IDUSUARIO ) AND EXISTS (SELECT usuario_has_rol.Rol_idRol FROM usuario_has_rol WHERE Rol_idRol = PI_IDROL)) THEN
    DELETE FROM usuario_has_rol WHERE Usuario_idUsuario=PI_IDUSUARIO;
ELSE 
        SET PV_MENSAJE = CONCAT("El rol de usuario ", PI_IDUSUARIO,PI_IDROL, "no existe. ");
END IF;
END$$
DELIMITER ;
