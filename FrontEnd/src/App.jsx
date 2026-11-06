import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomeScreen from './Screens/HomeScreen/HomeScreen'
import LoginScreen from './Screens/LoginScreen/LoginScreen'
import RegisterScreen from './Screens/RegisterScreen/RegisterScreen'
import AuthMiddleware from './Middlewares/AuthMiddleware'

const App = () => {
  return (
    <Routes>
      <Route element={<AuthMiddleware />}>
        <Route path='/' element={<HomeScreen />} />
      </Route>
      <Route path='/login' element={<LoginScreen />} />
      <Route path='/register' element={<RegisterScreen />} />
    </Routes>
  )
}


export default App