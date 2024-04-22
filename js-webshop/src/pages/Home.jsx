import {FastCheckout} from "../components";
import React from "react";
import {useNavigate} from "react-router-dom";

import {motion} from "framer-motion";


function Home() {
    const navigate = useNavigate();
    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="d-flex flex-column allign-items-center align-content-center text-center my-4">

                <h3>Store items:</h3>

                <div className="d-flex flex-column flex-wrap" style={{minHeight: 500}}>
                    <FastCheckout navigate={navigate} className={"col"}/>
                </div>
            </div>
        </motion.div>
    )
}

export default Home