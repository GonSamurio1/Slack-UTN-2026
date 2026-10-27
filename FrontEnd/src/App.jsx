import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomeScreeen from './Screens/HomeScreen/HomeScreen'
import LoginScreen from './Screens/LoginScreen/LoginScreen'
import RegisterScreen from './Screens/RegisterScreen/RegisterScreen'

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<HomeScreeen />} />
      <Route path='/login' element={<LoginScreen />} />
      <Route path='/register' element={<RegisterScreen />} />
    </Routes>
  )
}


export default App