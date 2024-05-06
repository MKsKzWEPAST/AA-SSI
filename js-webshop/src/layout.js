// Layout.js
import React from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {
    Checkout,
    Home,
    PageNotFound,
    Tickets,
    Thanks
} from "./pages";
import {AnimatePresence} from "framer-motion";

const Layout = () => {
    const location = useLocation();

    return (
        <AnimatePresence>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home/>}/>
                <Route path="/checkout" element={<Checkout/>}/>
                <Route path="/tickets" element={<Tickets/>}/>
                <Route path="*" element={<PageNotFound/>}/>
                <Route path="/product/*" element={<PageNotFound/>}/>
                <Route path="/thanks" element={<Thanks/>}/>
            </Routes>
        </AnimatePresence>
    );
}

export default Layout;
