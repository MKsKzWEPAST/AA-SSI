const mode = "fast";
const handleMode = (state=mode, action) =>{
    switch(action.type){
        case "SWITCH":
           return state==="fast" ? "secure" : "fast";
        default:
            return state
    }
}
export default handleMode