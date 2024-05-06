import React, {useEffect, useState} from 'react';
import {QRCodeSVG} from "qrcode.react";
import {IconBox} from "./Graphical";

const PaymentOptions = ({price, orderID}) => {
    const [QRHolder, setQRHolder] = useState(<div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
    </div>);


    useEffect(() => {
        if (orderID != null) {
            setQRHolder(<QRCodeSVG value={`amoy:0x1973dD4486c8BA89C7ab3988Cc54e60F6E54Ef66:${price}:${orderID}`} size={window.innerHeight * 0.2}/>);
        }
    }, [orderID, price]);

    return (
        <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
            <span style={{textAlign: 'center'}}>Scan with your wallet app to pay.</span>
            <div className={"my-3"} style={{
                display: 'inline-block',
                padding: '10px',
                borderRadius: "5px",
                border: '1px solid #ccc',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
            }}>
                {QRHolder}
            </div>
            <div className={"d-flex"}>
                <IconBox svgPath={"./assets/multi-collateral-dai-dai-logo.svg"} alt={"DAI"}/>
                <IconBox svgPath={"./assets/tusd-logo.svg"} alt={"TUSD"}/>
            </div>
        </div>
    );
};

export default PaymentOptions;