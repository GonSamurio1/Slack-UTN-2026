import nodemailer from "nodemailer";
import ENVIROMMENT from "./enviromment.config.js";

const mailerTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ENVIROMMENT.GMAIL_USER,
    pass: ENVIROMMENT.GMAIL_PASSWORD
  }
})

export default mailerTransporter