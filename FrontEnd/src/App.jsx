import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomeScreen from './Screens/HomeScreen/HomeScreen'
import LoginScreen from './Screens/LoginScreen/LoginScreen'
import RegisterScreen from './Screens/RegisterScreen/RegisterScreen'
import VerifyEmailScreen from './Screens/VerifyEmailScreen/VerifyEmailScreen'
import ResendEmailVerificationScreen from './Screens/ResendEmailVerificationScreen/ResendEmailVerificationScreen'
import AuthMiddleware from './Middlewares/AuthMiddleware'

const App = () => {
  return (
    <Routes>
      <Route element={<AuthMiddleware />}>
        <Route path='/' element={<HomeScreen />} />
      </Route>
      <Route path='/login' element={<LoginScreen />} />
      <Route path='/register' element={<RegisterScreen />} />
      <Route path='/verify-email' element={<VerifyEmailScreen />} />
      <Route path='/resend-email-verification' element={<ResendEmailVerificationScreen />} />
    </Routes>
  )
}


export default App