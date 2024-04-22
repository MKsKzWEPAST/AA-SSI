// Layout.js
import {ProtectedRoute} from "./components/ProtectedRoute";
import React from 'react';
import { Route, Routes, useLocation} from 'react-router-dom';
import {useSelector} from "react-redux";
import {
    AboutPage,
    Cart,
    Checkout,
    ContactPage,
    Home,
    Login,
    PageNotFound,
    Products,
    Register,
    Tickets,
    Signup,
    Queue,
    LimitedTickets
} from "./pages";
import {AnimatePresence} from "framer-motion";

const Layout = () => {
    const state = useSelector((state) => state.handleLogin)
    const mode = useSelector((state) => state.handleMode)
    const logged_in = state.session_token !== "";
    const location = useLocation();

    function elem_template(elem) {
        return (
            mode === "secure" ? (
                <ProtectedRoute logged_in={logged_in}>
                    {elem}
                </ProtectedRoute>
            ) : (
                elem
            )
        );
    }
    return (
        <AnimatePresence>
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/" element={<Home/>}/>
                <Route path="/about" element={<AboutPage/>}/>
                <Route path="/contact" element={<ContactPage/>}/>
                <Route path="/products" element={elem_template(<Products />)} />
                <Route path="/cart" element={elem_template(<Cart/>)}/>
                <Route path="/checkout" element={elem_template(<Checkout/>)}/>
                <Route path="/tickets" element={elem_template(<Tickets/>)}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="*" element={<PageNotFound/>}/>
                <Route path="/product/*" element={<PageNotFound/>}/>
                <Route path="/queue" element={elem_template(<Queue/>)}/>
                <Route path="/limitedTickets" element={elem_template(<LimitedTickets/>)}/>
            </Routes>
        </AnimatePresence>
    );
}

export default Layout;
