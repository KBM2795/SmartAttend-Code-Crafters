import React from 'react'
import { useAuth } from '../context/authContext'
import { Navigate } from 'react-router-dom'

const PrivateRoutes = ({children}) => {
  const {user, loading} = useAuth()
  

  if(loading){
   return  <div className='relative left-[30vw] top-[30vh]  w-[30vw]'><img src="https://i.pinimg.com/originals/6b/e0/89/6be0890f52e31d35d840d4fe2e10385b.gif" alt="" /></div>
  }

  return user ? children : <Navigate to="/login" />
}

export default PrivateRoutes