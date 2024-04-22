import { NavLink } from 'react-router-dom'
const Navbar = () => {
    const title = "WebPub"
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-2 sticky-top">
            <div className="container">
                <NavLink className="navbar-brand fw-bold fs-4 px-2" to="/">{title}</NavLink>
            </div>
        </nav>
    )
}
export default Navbar