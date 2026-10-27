import dotenv from 'dotenv'
dotenv.config()

const ENVIROMMENT = {
  MONGO_DB_URI: process.env.MONGO_DB_URI,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
  URL_BACKEND: process.env.URL_BACKEND,
  PORT: process.env.PORT
}

export default ENVIROMMENT