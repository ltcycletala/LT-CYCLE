import express from "express";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";

import User from "../models/userModels.js";
import ClassPackage from "../models/classPackage.js";

import generateJWT from "../helpers/generateJWT.js";

import { isAuth } from "../utils.js";
import {
  paqueteVigente,
  setExpirationDateInDays,
} from "../helpers/checkexpirationDate.js";

const userRouter = express.Router();

userRouter.post("/login", async (req, res) => {
  console.log("endpint login");

  try {
    const { email, password } = req.body;

    console.log(req.body);

    const isUserInDb = await User.findOne({ email });

    if (!isUserInDb) {
      return res.status(404).json({ message: "Wrong Credentials" });
    }

    //check if user is verified
    if (!isUserInDb.isVerified) {
      return res
        .status(400)
        .json({ message: "Your Accounts has not been verified" });
    }

    if (!bcryptjs.compareSync(password, isUserInDb.password)) {
      return res.status(401).json({ message: "Wrong Credentials" });
    }

    const userAuthenticated = {
      email: isUserInDb.email,
      name: isUserInDb.name,
      role: isUserInDb.role,
      token: generateJWT(isUserInDb._id),
    };

    res.json(userAuthenticated);
  } catch (error) {
    console.log(error);
  }
});

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  //definde and put credential using nodemailer to send emails
  var transport = nodemailer.createTransport({
    host: "server223.web-hosting.com",
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // var transport = nodemailer.createTransport({
  //     host: "sandbox.smtp.mailtrap.io",
  //     port: 2525,
  //     auth: {
  //       user: "62138f4fc8d1d4",
  //       pass: "94c9ac5fb9f9cc"
  //     }
  //   });

  try {
    const isUserDb = await User.findOne({ email });

    //checking if user already exist
    if (isUserDb) {
      return res.status(400).json({ message: "User already Registered" });
    }

    const newUser = new User({
      name,
      email,
      password: password != "" ? bcryptjs.hashSync(password) : "",
    });
    newUser.token =
      Math.random().toString(32).substring(2) + Date.now().toString(32);
    await newUser.save();
	
    //enviando el correo
    
    const info = await transport.sendMail({
      from: "Cycle Indoors Studio <ltcycleindoorstudio@ltcycle.mx>",
      to: email,
      subject: "Proceso de confirmacion",
      text: "Comprueba tu Cuenta en Cycle Indoor Studio",
      html: `
            <p> Hola: ${name} Comprueba tu cuenta en Cycle Indoor Studio </p>
            <p> Tu cuenta ya esta casi lista, solo debes comprobarla en el siguiente enlace: </p>

            <a href='${process.env.URL_VERIFIED_EMAIL_FRONTEND}/confirmaccount/${newUser.token}'>Comprobar Cuenta</a>
            <p> Si tu no creates esta cuenta, puedes ignorar el mensaje </p>
            `,
    });
	console.log("holaaaaaaaaaaaaaaa");
    console.log(info);

    res.json({
      message:
        "User succesfully created, Check your Email to confirm your account",
    });
  } catch (error) {
    console.log(error);
    //to check mongoose validation error like empty data
    if (error.name === "ValidationError") {
      let errors = [];

      Object.keys(error.errors).forEach((key) => {
        //   errors[key] = error.errors[key].message;
        errors.push(error.errors[key].message);
      });
      return res.status(400).send({ message: errors.join(" ||| ") });
    }

    res.status(500).send({ message: "Something went wrong" });
  }
});

//this router is reach after you register a new email and go to your email and click the link
userRouter.get("/confirm/:tokenId", async (req, res) => {
  const { tokenId } = req.params;
  console.log("in register route");
  try {
    const isUser = await User.findOne({ token: tokenId });

    if (!isUser) {
      return res.status(400).json({ message: "Token no Valido" });
    }

    isUser.isVerified = true;
    isUser.token = "";
    await isUser.save();

    res.json({ message: "User Confirmed Correctly" });
  } catch (error) {
    console.log(error);
  }
});

/////////////////////////// rutas diferentes esta tienen que ver con el saldo disponible para comprar clases///////////////////

//comprar clases
userRouter.patch("/buy-class-package", isAuth, async (req, res) => {
  console.log("en ruta de users pero en comprar paquete");

  try {
    //1, obtener la info del fronend
    const { momentDateFrontEnd, idPackage } = req.body;

    // console.log(momentDateFrontEnd, 'fecha del front')

    //2. buscar la clase por id porque necesitamos su informacion
    const isClass = await ClassPackage.findById(idPackage);

    //3. buscamos el usuario que esta logeado asi podremos actualizar las clases que compre
    const user = await User.findById(req.user._id);

    //4. fijamos una fecha de expiracion a las clases primer parametro viene del frontend, el segundo es la duracion del paquete
    const expiresIn = setExpirationDateInDays(
      momentDateFrontEnd,
      isClass.packageDuration
    );

    //5. construimos el bojecto que gardaremos en user,, cantidad de clases y la fecha en que expira
    user.tusClases = {
      expiresIn: expiresIn.fechaExpiracion,
      classQuantity: user?.tusClases?.classQuantity
        ? user.tusClases.classQuantity + isClass.packageQuantity
        : isClass.packageQuantity,
    };

    await user.save();

    res.json({ message: "saldo agregado" });
  } catch (error) {
    console.log(error);
  }
});

// este endpint es para obtner la info de cuantas clases tienes disponibles para reservar
userRouter.get("/get-saldo", isAuth, async (req, res) => {
  console.log("en endpoint get saldo");
  try {
    const { currentDate } = req.query;
    //1. busco al usuario logeado para poder ver su saldo o si esta expierado
    const availableClasses = await User.findById(req.user._id).select(
      "tusClases"
    );

    // console.log(availableClasses,'el testing de ahora')

    if (!availableClasses.tusClases) {
      return res.json({ tusClases: { classQuantity: 0 } });
    }

    // aqui necesito comparar si hay clases disponibles y si no hay pongo una fecha muy atrazada
    //para que siempre salga que las clases estan expiradas o que no hay
    let expiracion;
    if (!availableClasses.tusClases) {
      expiracion = "2024-01-09T04:08:41-06:00";
    } else {
      expiracion = availableClasses.tusClases.expiresIn;
    }

    //2. aqui valido si el saldo esta expirado o no
    const isValid = paqueteVigente(currentDate, {
      fechaExpiracion: expiracion,
    });

    console.log(isValid);
    //3. si el saldo esta expirado lo elimino
    if (!isValid) {
      availableClasses.tusClases = {};
      await availableClasses.save();
      return res.json({ message: "clases han expirado" });
    }

    res.json(availableClasses);
  } catch (error) {
    console.log(error);
  }
});

// este endpoint es el de contacto el que esta en la pagina contacto
userRouter.post("/contacto", async (req, res) => {
  try {
    const { email, name, phone, comment } = req.body;

    //definde and put credential using nodemailer to send emails
    var transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    //enviando el correo
    const info = await transport.sendMail({
      from: "Cycle Indoors Studio <fravelar@gmail.com>",
      to: email,
      subject: "Contactando",
      text: "Contactando",
      html: `
			<h1>Informacion del formulario de contacto</h1>

			<p> Nombre: ${name} </p>
			<p> Email: ${email} </p>
			<p> Telefono: ${phone} </p>

			<textarea name="comentarios" rows="4" cols="50">${comment}</textarea>
			`,
    });

    res.json({ message: "Correo Electronico Enviado Exitosamente" });
  } catch (error) {
    console.log(error);
  }
});

export default userRouter;
