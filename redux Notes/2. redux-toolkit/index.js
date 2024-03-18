const store = require('./app/store')
const cakeActions = require('./features/cake/cakeSlice').cakeActions
const icecreamActions =
  require('./features/icecream/icecreamSlice').icecreamActions
const fetchUsers = require('./features/user/userSlice').fetchUsers

console.log('Initial State ', store.getState())
const unsubscribe = store.subscribe(() => {
  console.log('Updated State ', store.getState())
})

//invoking respective reducers using action object. in toolkit only respective reducer listens to dispatch even though multiple reducers have same action type. we need to explicitly say to make other reducers listen a dispatch action in toolkit
store.dispatch(cakeActions.ordered())
store.dispatch(cakeActions.ordered())
store.dispatch(cakeActions.ordered())
store.dispatch(cakeActions.restocked(3))


store.dispatch(icecreamActions.ordered())
store.dispatch(icecreamActions.ordered())
store.dispatch(icecreamActions.ordered())
store.dispatch(icecreamActions.restocked(3))

store.dispatch(fetchUsers())
// unsubscribe()
