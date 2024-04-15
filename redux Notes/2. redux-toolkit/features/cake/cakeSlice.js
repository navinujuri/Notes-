const createSlice = require('@reduxjs/toolkit').createSlice

const initialState = {
  numOfCakes: 20
}


// slice consists of action, action obj, action creator, switch inbuilt into this syntax sugar  
const cakeSlice = createSlice({
  name: 'cake', // name of the reducer so that we can access this Cake state using this name
  initialState, // either we pass initailState : initialState or jus pass as here ES6 takes care of it
  reducers: {   // defining reducer logic here of this slice 
    ordered: state => { // have two args (state & action to access payload )
      state.numOfCakes--
    },
    restocked: (state, action) => {
      state.numOfCakes += action.payload
    }
  }
})

module.exports = cakeSlice.reducer
module.exports.cakeActions = cakeSlice.actions
