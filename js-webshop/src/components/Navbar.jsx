import { NavLink } from 'react-router-dom'
import { useSelector} from 'react-redux'
const Navbar = () => {
    const state = useSelector(state => state.handleCart)
    const loginState = useSelector(state => state.handleLogin)
    const mode = useSelector(state => state.handleMode)
    const title = (mode === "fast" ? "Opéra national de Paris": "Amsterdamsche Football Club Ajax" )
    const totalQuantity = state.reduce((total, item) => total + item.qty, 0);
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-2 sticky-top">
            <div className="container">
                <NavLink className="navbar-brand fw-bold fs-4 px-2" to="/">{title}</NavLink>
                <button className="navbar-toggler mx-2" type="button" data-toggle="collapse"
                        data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>


                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav m-auto my-2 text-center">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">Home </NavLink>
                        </li>
                        <li className="nav-item">
                            {mode === "secure"? <NavLink className="nav-link" to="/queue">Pre-Sale</NavLink> : null}
                        </li>
                        {mode === "secure" ? loginState.session_token !== "" ? <NavLink className="nav-link" to="/">Hi, {loginState.first_name}! </NavLink> :
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/login">Login</NavLink>
                                </li> : null}
                        {mode === "secure" ? loginState.session_token !== "" ? null : <li className="nav-item">
                            <NavLink className="nav-link" to="/signup">Sign up</NavLink>
                        </li>: null}

                    </ul>
                </div>

                <div className="buttons text-center">
                    {// TODO - enable for "secure" mode <NavLink to="/login" className="btn btn-outline-dark m-2"><i className="fa fa-sign-in-alt mr-1"></i> Login</NavLink>
                        //<NavLink to="/register" className="btn btn-outline-dark m-2"><i className="fa fa-user-plus mr-1"></i> Register</NavLink>
                    }
                    <NavLink to="/cart" className="btn btn-outline-dark m-2"><i
                        className="fa fa-cart-shopping mr-1"></i> Cart ({totalQuantity}) </NavLink>
                </div>

            </div>
        </nav>
    )
}
export default Navbar