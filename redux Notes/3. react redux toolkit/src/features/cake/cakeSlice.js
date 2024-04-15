
//create Slice from toolkit
import { createSlice } from '@reduxjs/toolkit'


//create initial cake State to pass into createSlice method
const initialState = {
  numOfCakes: 20
}

//slice is created to encapsualte a sub State & its repective reducers 
// we observe there is no need to write switchcase here & immer for state consistency.
//slice returns actions and reducers as ex : cakeSlice.reducer , cakeSlice.actions

const cakeSlice = createSlice({
  name: 'cake',
  initialState,
  reducers: {
    ordered: state => {
      state.numOfCakes--
    },
    restocked: (state, action) => {
      state.numOfCakes += action.payload
    }
  }
})



export default cakeSlice.reducer
export const { ordered, restocked } = cakeSlice.actions
