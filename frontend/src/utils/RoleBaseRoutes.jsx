import React from 'react'
import { useAuth } from '../context/authContext'
import { Navigate } from 'react-router-dom'

const RoleBaseRoutes = ({children, requiredRole}) => {
    const {user, loading}= useAuth()

    if(loading){
      return   <div className='flex justify-center items-center w-52'><img src="https://i.pinimg.com/originals/6b/e0/89/6be0890f52e31d35d840d4fe2e10385b.gif" alt="" /></div>
    }

    if(!requiredRole.includes(user.role)){
        <Navigate to="/unauthorized" />
    }

     return user ? children : <Navigate to="/login" />
}

export default RoleBaseRoutes