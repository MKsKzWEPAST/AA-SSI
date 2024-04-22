import React, {useState} from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import {BuyTicketsButton, QuickBuyTickets} from "./Products";


export default function FastCheckout({navigate}) {
    const [selectedDate, setSelectDate] = useState(new Date());
    const today = new Date();
    const nextDay3 = new Date();
    nextDay3.setDate(today.getDate() + 3);

    return <>
        <div className={"d-flex flex-column justify-content-center align-content-center text-center"}>
            <div className={"mt-4"}>
                <h5>Pick a date</h5>
                <DatePicker onChange={setSelectDate} value={selectedDate} minDate={new Date()} maxDate={nextDay3}/>
            </div>
            <div className="d-flex flex-wrap justify-content-center">
                <div>
                    <QuickBuyTickets quantity={1} date={selectedDate} navigate={navigate}/>
                </div>
                <div>
                    <QuickBuyTickets quantity={2} date={selectedDate} navigate={navigate}/>
                </div>
                <div>
                    <BuyTicketsButton onClick={() => navigate('/products', {state:{date:selectedDate}})}/>
                </div>
            </div>
        </div>
    </>

}