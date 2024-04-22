import React, {useEffect, useState} from 'react';
import {TAPAuth} from "../components";
import './queue.css';
import {useNavigate} from "react-router-dom";
import {motion} from "framer-motion";


const queueLength = 200000;
const fastQueueLength = 250;

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function Queue({initialNumber, fast}) {
    const navigate = useNavigate()

    const [number, setNumber] = useState(initialNumber);

    const [barWidth, setBarWidth] = useState(13)

    useEffect(() => {
        const interval = setInterval(() => {
            const deduction = Math.floor(Math.random() * (8)) + 4;
            setNumber(prevNumber => Math.max(1, prevNumber - deduction));
            if (number === 1) {
                clearInterval(interval);
                navigate("/limitedTickets");
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [navigate, number]);


    useEffect(() => {
        setBarWidth(100 * (1 - number / (fast ? fastQueueLength : queueLength)))
        if (fast && number > fastQueueLength) {
            setNumber(oldNumber => (Math.floor(oldNumber / 3000) - 13))
        }
    }, [number, fast]);

    let suffix = "th";
    switch (number % 10) {
        case 1:
            suffix = "st";
            break;
        case 2:
            suffix = "nd";
            break;
        case 3:
            suffix = "rd";
            break;
        default:
    }

    return (
        <div className={"card mb-4"}>
            <div className={fast ? "card-header glow" : "card-header"}>
                <h4>{fast ? "Fans queue!" : "It's crowded here."}</h4>
            </div>
            <div className={"card-body"}>
                <span>You're {number}{suffix} in the queue...</span>

                {
                    number === 1 ? <div>
                            <div className="spinner-border my-1" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        :
                        <div>
                            <div className="progress my-2" role="progressbar" aria-label="Animated striped"
                                 aria-valuenow={barWidth}
                                 aria-valuemin="0" aria-valuemax="100">
                                <div className="progress-bar progress-bar-striped progress-bar-animated"
                                     style={{width: barWidth.toString() + "%"}}></div>
                            </div>
                        </div>
                }
                {
                    number === 1 ? <div>
                            <span><i>Now is your time! </i>😊</span>
                        </div>
                        :
                        <div>
                            <span><i>We'll bring you to the shop automatically.<br/>Please wait on this page. </i>😊</span>
                        </div>
                }
            </div>
        </div>
    );
}

const CenteredTAPAuth = () => {
    const [tapValid, setTapValid] = useState(false);

    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div
                className={"d-flex flex-column justify-content-center align-items-center align-content-center my-5  text-center"}>
                <Queue initialNumber={getRandomInt(29999) + 170000} fast={tapValid}/>
                {tapValid ? <></> : <TAPAuth onAuthenticated={() => {
                    setTapValid(true);
                }}/>}
            </div>
        </motion.div>
    );
};

export default CenteredTAPAuth;