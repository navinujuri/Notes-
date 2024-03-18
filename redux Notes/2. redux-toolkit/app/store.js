const configureStore = require('@reduxjs/toolkit').configureStore
const cakeReducer = require('../features/cake/cakeSlice')
const icecreamReducer = require('../features/icecream/icecreamSlice')
const userReducer = require('../features/user/userSlice')


//To add Logger middleWare
// const reduxLogger = require('redux-logger')
// const logger = reduxLogger.createLogger()

const store = configureStore({
  //this is similar to root / combined reducers
  reducer: {
    cake: cakeReducer,
    icecream: icecreamReducer,
    user: userReducer
  }
  // middleware: getDefaultMiddleware => getDefaultMiddleware().concat(logger) // middleware is concated to deafult middlewares
})

module.exports = store
