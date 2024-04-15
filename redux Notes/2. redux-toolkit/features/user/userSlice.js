const axios = require('axios')
const createSlice = require('@reduxjs/toolkit').createSlice
const createAsyncThunk = require('@reduxjs/toolkit').createAsyncThunk

const initialState = {
  loading: false,
  users: [],
  error: ''
}

/*
* here we see fetchUsers is a promise then we use thunk
* "" createAsyncThunk dispatches lifecycle of promise( pending, fulfilled and rejected ) as action internally ""
* user/fetchUsers is a just syntax we can also write users_fetchusers etc for actionName
* we write promise states in extraReducers always 
*/

const fetchUsers = createAsyncThunk('user/fetchUsers', () => {
  return axios
    .get('https://jsonplaceholders.typicode.com/users')
    .then(response => response.data.map(user => user.id))
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  extraReducers: builder => {
    builder.addCase(fetchUsers.pending, state => {
      state.loading = true
    })
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false
      state.users = action.payload
      state.error = ''
    })
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false
      state.users = []
      state.error = action.error.message
    })
  }
})

module.exports = userSlice.reducer
module.exports.fetchUsers = fetchUsers
