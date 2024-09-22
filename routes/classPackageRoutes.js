import express from 'express'


import ClassPackage from '../models/classPackage.js'



const classPackageRouter = express.Router()


classPackageRouter.post('/', async(req,res)=>{
    console.log('endpint crear class package')

    try {
        
        const newClassPackage = new ClassPackage(req.body)
        

        await newClassPackage.save()
        console.log('fin')
        res.json({message:'Class Package Guardado Exitosamente'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }

})


classPackageRouter.get('/', async(req,res)=>{
    console.log('endpoint get all class package')
    try {

        const classPackage = await ClassPackage.find()

        res.json(classPackage)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})



classPackageRouter.get('/:classId', async(req,res)=>{
    console.log('endpint get single class package')
    try {

        const {classId} = req.params

        const isClassPackageInDb = await ClassPackage.findById(classId)

        if(!isClassPackageInDb){
            return res.status(404).json({message:"Esta clase no existe"})
        }

        res.json(isClassPackageInDb)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


classPackageRouter.put('/:classId', async(req,res)=>{
    console.log('endpoint edit a class package')
    try {

        const {classId} = req.params

       const isClassPackageInDb = await ClassPackage.findByIdAndUpdate(classId , {...req.body})

       if(!isClassPackageInDb){
        return res.status(404).json({message:"Esta clase no existe"})
    }

        res.json({message:'Paquete de Clase Actualizado'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})




classPackageRouter.delete('/:classId', async(req,res)=>{
    console.log('endpoint delete class package')
    try {

        const {classId} = req.params

        const isClassPackageInDb = await ClassPackage.findByIdAndDelete(classId)

        if(!isClassPackageInDb){
            return res.status(404).json({message:'Paquete de Clase no existe en base de datos'})
        }

        res.json({message:'Paquete de Clase eliminado'})
        

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})





export default classPackageRouter