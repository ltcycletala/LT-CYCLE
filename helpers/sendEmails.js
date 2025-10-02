import nodemailer from "nodemailer";

const emailForgotPassword = async (email, name, token) => {
  try {
    //definde and put credential using nodemailer to send emails
    var transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure:false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
        tls: {
    rejectUnauthorized: false, // <-- aquí va
  },
    });

    // var transport = nodemailer.createTransport({
    //     host: "sandbox.smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //       user: "62138f4fc8d1d4",
    //       pass: "94c9ac5fb9f9cc",
    //     },
    //   });

    const info = await transport.sendMail({
      from: "Cycle Indoors Studio <ltcycleindoorstudio@ltcycle.mx>",
      to: email,
      subject: "Reset Password",
      text: "Cambia el Password de tu Cuenta en Cycle Indoors Studio",
      html: `
					<p> Hola: ${name} aqui podras cambiar tu password </p>
		
					<a href='${process.env.URL_VERIFIED_EMAIL_FRONTEND_LOCAL}/cambiar-contrasena/${token}'>Click aqui para cambiar Password</a>
					<p> Si tu no enviastes este email, puedes ignorar el mensaje </p>
					`,
    });

    return info;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export { emailForgotPassword };
