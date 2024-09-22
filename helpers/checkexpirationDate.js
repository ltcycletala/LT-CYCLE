import moment from "moment";

export function paqueteVigente(currentDate, paquete) {
    // Obtiene la fecha actual
    const fechaActual = moment(currentDate).toDate();
	console.log('fecha del dia de hoy', fechaActual)

	console.log(paquete, 'fecha en que expira')

    // Compara la fecha de expiración del paquete con la fecha actual
    if (moment(paquete.fechaExpiracion).isAfter(fechaActual)) {
        return true; // El paquete está vigente
    } else {
        return false; // El paquete ha expirado
    }
}


export function setExpirationDateInDays(momentDateFrontEnd, cantidad) {
	/*
	recibe dos parametros el primero es la fecha que viene del front end, para validad bien la informacion
	el segundo es la cantidad de dias que se quiere que expire
	*/

    // Calcula la fecha de expiración sumando la cantidad de días a la fecha actual
    const fechaExpiracion = moment(momentDateFrontEnd).add(cantidad, 'days').toDate();
	console.log(fechaExpiracion, 'fecha pasada por moent')
    // Devuelve un objeto con la cantidad y la fecha de expiración
    return {
        fechaExpiracion: fechaExpiracion
    };
}