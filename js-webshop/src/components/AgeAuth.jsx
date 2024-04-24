import {QRCodeSVG} from 'qrcode.react';
import {GetAuthRequestAge} from '../blockchain';

export default function AgeAuth({orderID}) {

    const qrDisplay = () => {

        const qrContent = GetAuthRequestAge(orderID);

        return (
            <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
                <span style={{textAlign: 'center'}}>Age verification is required for the selected product.</span>
                <div className={"my-3"} style={{
                    display: 'inline-block',
                    padding: '10px',
                    borderRadius: "5px",
                    border: '1px solid #ccc',
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                }}>
                    <QRCodeSVG value={qrContent} size={window.innerHeight * 0.25}/>
                </div>
            </div>
        );
    }

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {qrDisplay()}
        </div>
    );
};