import express from 'express'


import ClassSchedule from '../models/classSchedule.js'
import { isAuth } from '../utils.js'
import User from '../models/userModels.js'
import { paqueteVigente } from '../helpers/checkexpirationDate.js'



const classScheduleRouter = express.Router()

//crear horario de clases
classScheduleRouter.post('/', async(req,res)=>{
    console.log('endpint crear class schedule')

    try {
        
        const newClassPackage = new ClassSchedule(req.body)
        

        await newClassPackage.save()
        console.log('fin')
        res.json({message:'Class Schedule Guardado Exitosamente'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }

})


// este endpoint es para la table del admin y poder eligir clases para editar o eliminar
classScheduleRouter.get('/all-class-schedule', async (req, res) => {
    console.log('endpoint get all class schedule');
    try {
        const classSchedules = await ClassSchedule.find().populate('instructorInfo');

        res.json(classSchedules);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint que muestra las clases en el calendario
classScheduleRouter.get('/', async (req, res) => {
    console.log('endpoint get all class schedule for the calendar');
    try {
        // Obtener la fecha del parámetro
        // const dateStr = '2024/05/06'; // Formato: 'YYYY/MM/DD'

        const {filterDate: dateStr} = req.query


        // Obtener el día de la semana de la fecha proporcionada (0: domingo, 1: lunes, ..., 6: sábado)
        const filterDate = new Date(dateStr);
        const dayOfWeek = filterDate.getDay();

        // Calcular la fecha del lunes de la semana en la que se encuentra la fecha proporcionada
        const mondayDate = new Date(filterDate);
        mondayDate.setDate(filterDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        const formattedMondayDate = formatDate(mondayDate);

        // Calcular la fecha del domingo de la semana en la que se encuentra la fecha proporcionada
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        const formattedSundayDate = formatDate(sundayDate);

        // Consultar los horarios de clase entre el lunes y el domingo de la semana de la fecha proporcionada
        const classSchedules = await ClassSchedule.find({
            date: { $gte: formattedMondayDate, $lte: formattedSundayDate }
        }).populate('instructorInfo');
       
         const formattedData = [];

        classSchedules.forEach(schedule => {

            const existingDay = formattedData.find(item => item.nombre === schedule.dayWeek && item.fecha === schedule.date);

            const instructorName = schedule.instructorInfo ? schedule.instructorInfo.instructorName : '';
            const instructorId = schedule.instructorInfo ? schedule.instructorInfo._id : '';

            if (existingDay) {
                existingDay.clases.push({
                    horaInicio: schedule.startTime,
                    _id: schedule._id,
                    instructor: { nombre: instructorName, _id: instructorId }
                });
            } else {
                formattedData.push({
                    nombre: schedule.dayWeek,
                    fecha: schedule.date,
                    clases: [{
                        _id: schedule._id,
                        horaInicio: schedule.startTime,
                        instructor: { nombre: instructorName, _id: instructorId }
                    }]
                });
            }
        });

        res.json(formattedData);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// esta funcion se una en el endpoint de arriba 
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}



// conseguir info de una clase por id
classScheduleRouter.get('/:classId', async(req,res)=>{
    console.log('endpint get single class schedule')
    try {

        const {classId} = req.params

        const isClassScheduleInDb = await ClassSchedule.findById(classId)

        if(!isClassScheduleInDb){
            return res.status(404).json({message:"Esta clase no existe"})
        }

        res.json(isClassScheduleInDb)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


// actualizar una clase
classScheduleRouter.put('/:classId', async(req,res)=>{
    console.log('endpoint edit a class schedule')
    try {

        const {classId} = req.params

       const isClassScheduleInDb = await ClassSchedule.findByIdAndUpdate(classId , {...req.body})

       if(!isClassScheduleInDb){
        return res.status(404).json({message:"Esta clase no existe"})
    }

        res.json({message:'Paquete de Clase Actualizado'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


// eliminar una clase
classScheduleRouter.delete('/:classId', async(req,res)=>{
    console.log('endpoint delete class package')
    try {

        const {classId} = req.params

        const isClassScheduleInDb = await ClassSchedule.findByIdAndDelete(classId)

        if(!isClassScheduleInDb){
            return res.status(404).json({message:'Horario de Clase no existe en base de datos'})
        }

        res.json({message:'Horario de Clase eliminado'})
        

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})




// asignar bicis a una clase , tambien resta la cantidad de clases que tiene el usuario disponible
classScheduleRouter.patch('/:classId', isAuth, async(req,res)=>{

    console.log('en agregar bicis')

    try {

        const {currentDate} = req.query
        const {classId} = req.params


        // extea validadion por mas seguridad
        if(!req.user.tusClases){
            return res.json({message:'no tienes para asignar clases, compra un paquete'})
        }


        //aqui validamos si las clases que has comprado ya han expierado o no
        const isValid = paqueteVigente(currentDate, {fechaExpiracion: req.user.tusClases.expiresIn})

        //y si ya expiraron entonces actualizamos el saldo y lo ponemos a que no tienes saldo
        if(!isValid){ 

            const user = await User.findById(req.user._id)
            user.tusClases = {}
            await user.save()
			return res.json({message:'clases han expirado'})
		}

        
        
        // 1. buscamos la clase a la que asignare la bici
        const isClass = await ClassSchedule.findOne({_id: classId})

        /* 2.
        una pequena validadion si el usuario ya ha asignado una bici en esta horario pues ya no puede asignar otra
         */
        const isUserInThisClass = isClass.bicis.findIndex(item => item.userId == req.user._id.toString())
        if(isUserInThisClass >= 0){
            return  res.status(409).json({message:'Ya estas registrado en esta horario de clases'})
        }

        /* 3.
            extra validadion que no deja asignar el mismo numero de bici dos veces
         */
        const isAssign = isClass.bicis.findIndex(item => item.noBici == req.body.noBici)
        if(isAssign >= 0){
            return res.status(409).json({message:'esta bici ya ha sido tomada'})
        }


        // 4. Restar 1 a la cantidad de clases disponible que tiene el usuario par reservar
        await User.updateOne({ _id: req.user._id }, { $inc: { 'tusClases.classQuantity': -1 } });


        /* 5.
        aqui creo el objeto con la informacion del usuario que reservo esta bici y la info de la bici reserbada
        */
        const biciObj = {
            noBici: req.body.noBici,
            nameClient: req.user.name,
            userId: req.user._id
        }
        isClass.bicis.push(biciObj)

        // finalmente guardo los cambios 
        await isClass.save()


        res.json({message:'bici asignada correctamente'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


export default classScheduleRouter