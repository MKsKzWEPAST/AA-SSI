import handleCart from './handleCart'
import {combineReducers} from "redux";
import handleMode from "./handleMode";
import handleLogin from "./handleLogin";

const rootReducers = combineReducers({
    handleCart,
    handleMode,
    handleLogin,
})
export default rootReducers
