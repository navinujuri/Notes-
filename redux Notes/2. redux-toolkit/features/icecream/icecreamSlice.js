const { cakeActions } = require('../cake/cakeSlice')

const createSlice = require('@reduxjs/toolkit').createSlice

const initialState = {
  numOfIcecreams: 10
}

const icecreamSlice = createSlice({
  name: 'icecream',
  initialState,
  reducers: {
    ordered: state => {
      state.numOfIcecreams--
    },
    restocked: (state, action) => {
      state.numOfIcecreams += action.payload
    }
  },
  // To make iceCreame reducer to listen cake reducer on getting action "ordered" in cake we need to add this extraReducers to icecream 
  // it value is an function with builder fn as an arg. we add specific Case of cake & a logic which need to be implemented
  extraReducers: builder => {
    builder.addCase(cakeActions.ordered, state => {
      state.numOfIcecreams--
    })
  }
  // extraReducers: {
  //   ['cake/ordered']: state => {
  //     state.numOfIcecreams--
  //   }
  // }
})

module.exports = icecreamSlice.reducer
module.exports.icecreamActions = icecreamSlice.actions
