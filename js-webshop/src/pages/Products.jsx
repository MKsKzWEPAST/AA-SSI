import React, {useEffect, useState} from 'react'
import {Product} from "../components"
import './calendar.css'

import {motion} from 'framer-motion';
import {useLocation} from "react-router-dom";


const today = new Date();
const nextSevenDays = new Date(today);
nextSevenDays.setDate(today.getDate() + 6);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const Products = () => {

    const location = useLocation();

    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);

    const dateState = location.state

    useEffect(() => {
        if (dateState != null && dateState.date != null) {
            setSelectedDate(dateState.date)
        }
    }, [dateState]);


    const options = {
        month: 'short',
        day: '2-digit'
    };

    return (<motion.div initial={{x: window.innerWidth}}
                        animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                        exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="container my-3 py-3">
                <div className="col-12 text-center">
                    <h3>Select date:</h3>
                </div>
                <div style={{display: 'flex', justifyContent: 'center'}}>

                    {[0, 1, 2, 3].map((index) => {
                        const date = new Date(today);
                        date.setDate(today.getDate() + index);
                        const isSelected = selectedDate.toLocaleDateString('en-US', options) === date.toLocaleDateString('en-US', options)
                        return (
                            <div className={'calendar-day'}
                                 key={index}
                                 onClick={() => setSelectedDate(date)}
                                 style={{
                                     display: 'inline-block',
                                     width: '100px',
                                     height: '60px',
                                     border: '1px solid grey',
                                     borderRadius: '6px',
                                     margin: '5px',
                                     textAlign: 'center',
                                     cursor: 'pointer',
                                     backgroundColor: isSelected ? 'lightgrey' : 'white',
                                     boxShadow: isSelected ? '0 4px 6px rgba(0, 0, 0, 0.4)' : 'none',
                                 }}
                            >
                                <h6>{date.toLocaleDateString('en-US', options)}</h6>
                                <p>Price: ${getPrice(date.toISOString().split('T')[0])}</p>
                            </div>
                        );
                    })}

                </div>
            </div>
            <Product selectedDate={selectedDate}/>

        </motion.div>
    )
}

export default Products

// "random" usage of the date to generate the price on that day (extract last 3bits of date)
export function getPrice(date) {
    const delta = date[date.length - 1] & 0b00000111;
    return 15 + delta;
}

