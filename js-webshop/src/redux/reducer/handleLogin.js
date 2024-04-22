const user = {
    email: "",
    first_name: "",
    last_name: "",
    session_token: "",
    phone: "",
    tickets: []
}

const handleLogin = (state=user, action) =>{
    const user = action.payload
    switch(action.type){
        case "SIGN_IN":
            return {
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                session_token: user.session_token,
                phone: user.phone,
                tickets: []
            }
        case "CLEAR":
            return {
                email: "",
                first_name: "",
                last_name: "",
                session_token: "",
                phone: "",
                tickets: []
            }

        case "ADD_TICKET":
            return {
                email: state.email,
                first_name: state.first_name,
                last_name: state.last_name,
                session_token: state.session_token,
                phone: state.phone,
                tickets: state.tickets.concat(user)
            }
        default:
            return state
    }
}
export default handleLogin