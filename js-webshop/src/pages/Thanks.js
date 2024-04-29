import React from "react";
import {motion} from "framer-motion";

const Thanks = () => {
    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="container my-3 py-3">
                <h1 className="text-center">Thanks for your purchase!</h1>
            </div>

        </motion.div>
    );
};

export default Thanks;
