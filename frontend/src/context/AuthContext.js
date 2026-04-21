import React, {createContext, useState, useContext} from 'react';

const AuthContext=createContext();

export const AuthProider=({children})=>{
    const [userRole, setUserRole]=useState('admin');

}