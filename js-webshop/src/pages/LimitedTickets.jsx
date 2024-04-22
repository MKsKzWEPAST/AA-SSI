import React from 'react'
import {motion} from "framer-motion";
import "./limitedTicket.css";
import {useNavigate} from "react-router-dom";

const AboutPage = () => {
    const navigate = useNavigate();
    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="container my-3 py-3 d-flex flex-column align-items-center justify-content-center">
                <h1 className="text-center">Limited-edition Tickets</h1>

                <img className={"goldenTicket img my-4"} alt={"golden ticket"} src={"./assets/goldenTicket.png"}
                     style={{maxWidth: "100%", height: "auto"}} onClick={() => navigate('/checkout', {
                    state: {
                        product: {
                            id: "limitedTicket1",
                            title: "Limited Ticket",
                            qty: 1,
                            date: "09 Sep",
                            price: 999
                        }
                    }
                })}/>

            </div>

        </motion.div>
    )
}

export default AboutPage