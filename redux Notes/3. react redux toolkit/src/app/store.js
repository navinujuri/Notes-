//using ES6 syntax of Import

//config store from toolkit
import { configureStore } from '@reduxjs/toolkit' 

import cakeReducer from '../features/cake/cakeSlice'
import icecreamReducer from '../features/icecream/icecreamSlice'
import userReducer from '../features/user/userSlice'


//config store 
const store = configureStore({
  reducer: {
    cake: cakeReducer,
    icecream: icecreamReducer,
    user: userReducer
  }
})

export default store
