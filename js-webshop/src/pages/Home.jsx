import {FastCheckout, Main} from "../components";
import React from "react";
import {useNavigate} from "react-router-dom";

import {motion} from "framer-motion";


function Home() {
    const navigate = useNavigate();

    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <Main/>
            <div className="d-flex flex-column flex-wrap align-itens-start" style={{minHeight:500}}>
                <FastCheckout navigate={navigate} className={"col"}/>
            </div>
        </motion.div>
    )
}

export default Home