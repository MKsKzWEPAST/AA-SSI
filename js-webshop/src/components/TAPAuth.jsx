import {QRCodeSVG} from 'qrcode.react';
import {useEffect, useState} from "react";
import {Button, Spinner} from "react-bootstrap";

const states = {
    init: 0,
    loading: 1,
    qr: 2,
    completed: 3,
    failed: 4,
}

export default function TAPAuth({onAuthenticated}) {

    const [authRequest, setAuthRequest] = useState("{}")

    const [authState, setAuthState] = useState(states.init);

    const [currentDisplay, setCurrentDisplay] = useState(<div></div>);

    // Requests
    function getAuthRequest() {
        setAuthState(states.loading)
        const endpoint = "https://broadly-assured-piglet.ngrok-free.app/api/auth";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", endpoint, true);
        xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // Hide the loading spinner when the request is completed
                if (xhr.status === 200) {
                    // parse QR-Code reply from Verifier Back-end
                    setAuthRequest(xhr.responseText);
                    setAuthState(states.qr);

                    const responseObject = JSON.parse(xhr.responseText);
                    // Extract sessionId from the callbackUrl
                    const callbackUrl = responseObject.body.callbackUrl;

                    const sessionId = new URL(callbackUrl).searchParams.get("sessionId");
                    startChecking(sessionId);

                } else {
                    setAuthState(states.failed)
                }
            }
        };
        xhr.send();
    }

    function startChecking(sessionID) {
        // Send request to check status every 6 seconds
        const intervalId = setInterval(checkStatus, 3000);

        function checkStatus() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `https://broadly-assured-piglet.ngrok-free.app/api/verifyCallback/${sessionID}`, true);
            xhr.setRequestHeader("ngrok-skip-browser-warning", "true");

            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        if (data['authenticated'] === "true") {
                            clearInterval(intervalId);
                            console.log('Interaction completed!');
                            setAuthState(states.completed)
                        }
                    } else {
                        setAuthState(states.failed)

                        clearInterval(intervalId);
                        console.error('Error checking status:', xhr.status);
                    }
                }
            };

            xhr.send();
        }
    }

    // Display components

    const buttonDisplay = () => {
        return (
            <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
                <h3>Too much waiting time?</h3>
                <span className={"mb-3"}>Go faster by showing your TAP.</span>
                <Button variant="primary" onClick={getAuthRequest}>Show your TAP</Button>
            </div>
        );
    }

    const loadingDisplay = () => {
        return (<Spinner animation="border"/>);
    }

    const qrDisplay = () => {
        return (
            <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
                <span style={{textAlign: 'center'}}>Scan with your TAP!</span>
                <div className={"my-3"} style={{
                    display: 'inline-block',
                    padding: '10px',
                    borderRadius: "5px",
                    border: '1px solid #ccc',
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                }}>
                    <QRCodeSVG value={authRequest} size={window.innerHeight * 0.35}/>
                </div>
            </div>
        );
    }

    const completedDisplay = () => {
        return <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
            <h3>Congratulations, you're a real Fan!</h3>
            <span className={"mb-2"}>We'll update you shortly...</span>
            <div className={"my-2"} style={{
                display: 'inline-block',
                borderRadius: "5px",
                border: '1px solid #ccc',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
            }}>
                <img src={"./assets/bots.webp"} alt={"Bots can't compete with you!"} width={window.innerHeight * 0.35}/>
            </div>
        </div>
    }

    const failedDisplay = () => {
        return <div className={"d-flex flex-column m-3 align-items-center justify-content-center"}>
            <h4>Something went wrong sorry.</h4>
            <span className={"mb-2"}>Going back to the TAP page...</span>
            <Spinner animation="border"/>
        </div>
    }

    useEffect(() => {
        switch (authState) {
            case states.init:
                setCurrentDisplay(buttonDisplay());
                break;
            case states.loading:
                setCurrentDisplay(loadingDisplay());
                break;
            case states.qr:
                setCurrentDisplay(qrDisplay());
                break;
            case states.completed:
                setCurrentDisplay(completedDisplay());
                const launchLater1 = setTimeout(() => {
                    if(onAuthenticated != null){
                        onAuthenticated();
                    } else {
                        console.log("No given function!")
                    }
                    clearTimeout(launchLater1);
                }, 3000);

                break;
            case states.failed:
                const launchLater2 = setTimeout(() => {
                    setCurrentDisplay(buttonDisplay());
                    clearTimeout(launchLater2);
                }, 2000);
                setCurrentDisplay(failedDisplay());

                break;
            default:
                break;
        }
    }, [authState])

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {currentDisplay}
        </div>
    );
};