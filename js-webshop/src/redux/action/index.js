
// For Add Item to Cart
import {findRenderedDOMComponentWithClass} from "react-dom/test-utils";

export const addCart = (product) =>{
    return {
        type:"ADDITEM",
        payload:product
    }
}

// For Delete Item to Cart
export const delCart = (product) =>{
    return {
        type:"DELITEM",
        payload:product
    }
}

// For Set Items to Cart
export const setCart = (products) =>{
    return {
        type:"SETITEMS",
        payload:products
    }
}

// For Clear the Cart
export const clearCart = (products) =>{
    return {
        type:"CLEARITEMS",
        payload:products
    }
}

// ================ handle store mode ====================
//========================================================

// switch store mode
export const switchMode = () =>{
    return{
        type:"SWITCH"
    }
}

// ================ handle login ====================
//========================================================

export const signIn = (email,firstName,lastName,sessionToken,phone) => {
    return{
        type:"SIGN_IN",
        payload: {
            email: email,
            first_name: firstName,
            last_name: lastName,
            session_token: sessionToken,
            phone: phone,
            tickets: []
        }
    }
}

export const clear = () => {
    return{
        type:"CLEAR",
        payload: "",
    }
}

export const addTickets = (tickets) => {
    return{
        type:"CLEAR",
        payload: tickets
    }
}



