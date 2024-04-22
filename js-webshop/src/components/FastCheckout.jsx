import React from 'react';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import {QuickBuyItem} from "./Products";


export default function FastCheckout({navigate}) {
    return <>
        <div className={"d-flex flex-column justify-content-center align-content-center text-center"}>
            <div className="d-flex flex-wrap justify-content-center">
                <div>
                    <QuickBuyItem item={"beer"} navigate={navigate}/>
                </div>
                <div>
                    <QuickBuyItem item={"pizza"} navigate={navigate}/>
                </div>

            </div>
        </div>
    </>

}