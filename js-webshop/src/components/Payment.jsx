import React, {useState} from 'react';
import {PaymentInputsWrapper, usePaymentInputs} from "react-payment-inputs";
import images from "react-payment-inputs/images";
import {ButtonGroup, Container, ToggleButton} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";

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

const PaymentOptions = ({validatePayment}) => {
    const [valid, setValid] = React.useState(false);

    function PaymentInputs() {
        let meta
        const {
            wrapperProps,
            getCardImageProps,
            getCardNumberProps,
            getExpiryDateProps,
            getCVCProps
        } = {meta} = usePaymentInputs(
            {onTouch: handleTouch}
        );

        function handleTouch(touchedInput, touchedInputs) {

            console.log("TESTTOUCH");
            console.log(wrapperProps.error)
            console.log(meta)
        }

        return (
            <PaymentInputsWrapper {...wrapperProps}>
                <svg {...getCardImageProps({images})} />
                <input {...getCardNumberProps()} />
                <input {...getExpiryDateProps()} />
                <input {...getCVCProps()} />
            </PaymentInputsWrapper>
        );
    }

    function NewCard() {

        return (
            <div className="d-flex flex-column">
                <h5>Enter a new card:</h5>
                <PaymentInputs/>
                <div className={"mt-2"}>
                    {confirmCheckoutButton({valid: valid, validatePayment: validatePayment})}
                </div>
            </div>
        );
    }

    function EzPay() {
        return (
            <div className="d-flex flex-column">
                <h5>EzPay:</h5>
                <img src={"./assets/payment-qr.png"} alt={"EzPay qr-code"} width={120}
                     style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'}}/>
                <span className={"mt-1"}>Scan to pay!</span>
            </div>
        );
    }

    function TwintPay() {

        return (
            <div className="d-flex flex-column">
                <a href={"https://example.com/twint-payment"}>
                    <img src={"./assets/twint.png"} alt={"Twint link"} width={200}
                                                                   style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'}}/></a>
            </div>
        );
    }


    function SelectOption({changeOption}) {
        const handleOptionChange = (event) => {
            changeOption(event.target.value);
        };

        const radios = [
            { name: 'pay_by_link', value: 'PayByLink' },
            { name: 'twint', value: 'Twint' },
            { name: 'saved_card', value: 'SavedCard' },
            { name: 'new_card', value: 'NewCard' },
        ];

        return (
            <>
            <ButtonGroup className="mb-1">
                {radios.map((radio, idx) => (
                    <ToggleButton
                        className={idx===0?"rounded-start":(idx===radios.length-1?"rounded-end":"")}
                        key={idx}
                        id={`radio-${idx}`}
                        type="radio"
                        variant="outline-secondary"
                        name="radio"
                        value={radio.value}
                        checked={selectedOption === radio.value}
                        onChange={handleOptionChange}
                    >
                        {radio.value}
                    </ToggleButton>
                ))}
            </ButtonGroup>
            </>
        );
    }

    const [selectedOption, changeOption] = useState("PayByLink")

    let componentToShow;

    switch (selectedOption) {
        case 'PayByLink':
            componentToShow = <EzPay/>;
            break;
        case 'Twint':
            componentToShow = <TwintPay/>;
            break;
        case 'SavedCard':
            componentToShow =
                <div className="d-flex flex-column">
                    <span className={"mb-1"}>Saved card ending with (3862)</span>
                    {confirmCheckoutButton({valid: true, validatePayment: validatePayment})}
                </div>
            break;
        case 'NewCard':
            componentToShow = <NewCard/>;
            break;
        default:
            componentToShow = <Container/>;
    }

    return (
        <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
            <span style={{textAlign: 'center'}}>Pay to this address.</span>
            <div className={"my-3"} style={{
                display: 'inline-block',
                padding: '10px',
                borderRadius: "5px",
                border: '1px solid #ccc',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
            }}>
                <QRCodeSVG value={"ethereum:0x40775600Bb4E2E4Ab1c24B5c8bA4734cC47EE02E"} size={window.innerHeight * 0.25}/>
            </div>
        </div>
    );
};

export default PaymentOptions;