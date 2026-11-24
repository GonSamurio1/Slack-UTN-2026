import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomeScreen from './Screens/HomeScreen/HomeScreen'
import LoginScreen from './Screens/LoginScreen/LoginScreen'
import RegisterScreen from './Screens/RegisterScreen/RegisterScreen'
import VerifyEmailScreen from './Screens/VerifyEmailScreen/VerifyEmailScreen'
import ResendEmailVerificationScreen from './Screens/ResendEmailVerificationScreen/ResendEmailVerificationScreen'
import ForgotPasswordScreen from './Screens/ForgotPasswordScreen/ForgotPasswordScreen'
import ResetPasswordScreen from './Screens/ResetPasswordScreen/ResetPasswordScreen'
import CreateWorkspaceScreen from './Screens/CreateWorkspaceScreen/CreateWorkspaceScreen'
import EditWorkspaceScreen from './Screens/EditWorkspaceScreen/EditWorkspaceScreen'
import WorkspaceScreen from './Screens/WorkspaceScreen/WorkspaceScreen'
import ChannelScreen from './Screens/ChannelScreen/ChannelScreen'
import CreateChannelScreen from './Screens/CreateChannelScreen/CreateChannelScreen'
import AcceptInviteScreen from './Screens/AcceptInviteScreen/AcceptInviteScreen'
import AuthMiddleware from './Middlewares/AuthMiddleware'

const App = () => {
  return (
    <Routes>
      <Route element={<AuthMiddleware />}>
        <Route path='/' element={<HomeScreen />} />
        <Route path='/workspace/new' element={<CreateWorkspaceScreen />} />
        <Route path='/workspace/:workspace_id' element={<WorkspaceScreen />} />
        <Route path='/workspace/:workspace_id/edit' element={<EditWorkspaceScreen />} />
        <Route path='/workspace/:workspace_id/channel/new' element={<CreateChannelScreen />} />
        <Route path='/workspace/:workspace_id/channel/:channel_id' element={<ChannelScreen />} />
        <Route path='/accept-invite' element={<AcceptInviteScreen />} />
      </Route>
      <Route path='/login' element={<LoginScreen />} />
      <Route path='/register' element={<RegisterScreen />} />
      <Route path='/verify-email' element={<VerifyEmailScreen />} />
      <Route path='/resend-email-verification' element={<ResendEmailVerificationScreen />} />
      <Route path='/forgot-password' element={<ForgotPasswordScreen />} />
      <Route path='/reset-password' element={<ResetPasswordScreen />} />
    </Routes>
  )
}


export default App