import React, {useEffect, useState} from 'react';
import {QRCodeSVG} from "qrcode.react";
import {IconBox} from "./Graphical";

function confirmCheckoutButton({valid, validatePayment}) {
    return (<button
        className="w-100 btn btn-primary "
        type="submit"
        disabled={!valid}
        onClick={validatePayment}
        style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'}}>
        Confirm Checkout!

    </button>);
}

const PaymentOptions = ({validatePayment, price, orderID}) => {
    const [QRHolder, setQRHolder] = useState(<div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
    </div>);


    useEffect(() => {
        if (orderID != null) {
            setQRHolder(<QRCodeSVG value={`amoy:0x46B5B8D72c7475E30E949F32b373B6A388E077D6:${price}:${orderID}`} size={window.innerHeight * 0.2}/>);
        }
    }, [orderID]);

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
                <IconBox svgPath={"./assets/multi-collateral-dai-dai-logo.svg"} alt={""}/>
                <IconBox svgPath={"./assets/tether-usdt-logo.svg"} alt={""}/>
            </div>
        </div>
    );
};

export default PaymentOptions;