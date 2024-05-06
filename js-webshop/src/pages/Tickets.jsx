import React from "react";
import {Link, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";
import QRCode from 'qrcode.react';
import './tickets.css'
import {motion} from "framer-motion";
import axios from "axios";
import sha256 from "crypto-js/sha256";


const Tickets = () => {
    const user = useSelector((state) => state.handleLogin)
    const location = useLocation();
    const nb_tickets = location.state.nb_of_tickets
    const email = user.email
    const guest = (email === "")

    const EmptyCart = () => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12 py-5 bg-light text-center">
                        <h4 className="p-3 display-5">Payment aborted</h4>
                        <Link to="/" className="btn btn-outline-dark mx-4">
                            <i className="fa fa-arrow-left"></i> Your cart is empty!
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    const ShowTickets = () => {
        const ticketQRs = [];

        let ts = new Date().getTime().toString()
        let eventName = "ONP - Barbe Bleue"
        let eventCode = sha256(eventName).toString()
        let nonces = []
        for (let i = 0; i < nb_tickets; i++) {
            const nonce = i.toString()+eventCode
            const ticketInfo = {
                ticket_id: nonce,
                timestamp: ts,
                eventCode: eventCode
            };
            if (!user.tickets.includes(nonce)) {
                if (!guest) {
                    const fan_tick = {
                        ticket_id: nonce,
                        timestamp: ts,
                        eventCode: eventCode,
                        email: email
                    };
                    const fan_ticket = JSON.stringify(fan_tick)
                    axios.post("https://griffon-loved-physically.ngrok-free.app/api/notify/purchase",fan_ticket)
                        .then(r => null)
                    nonces.push(nonce)
                }
            }

            const js_ticket = JSON.stringify(ticketInfo)
            ticketQRs.push(
                <QRCode value={js_ticket} />
            );
        }
        if (!guest && nonces.length > 0){
            //dispatch(addTickets(nonces))
        }

        function QRSlider() {
            // Mapping QR codes to carousel items
            const carouselItems = ticketQRs.map((qrCode, index) => (
                <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                    <div className="d-flex justify-content-center py-3">
                        {qrCode}
                    </div>
                    <div className="container">
                        <div className="row">
                            <div className="col">
                                <div className="text-center">
                                    <p>Ticket #{index+1}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ));

            return (
                <div id="carouselTickets" className="carousel slide" data-bs-ride="carousel" data-interval="false">
                    <div className="carousel-inner">
                        {carouselItems}
                    </div>
                    <a className="carousel-control-prev" href="#carouselTickets" role="button"
                       data-slide="prev">
                        <span className="carousel-control-prev-icon"></span>
                        <span className="sr-only">Previous</span>
                    </a>
                    <a className="carousel-control-next" href="#carouselTickets" role="button"
                       data-slide="next">
                        <span className="carousel-control-next-icon"></span>
                        <span className="sr-only">Next</span>
                    </a>
                </div>
            );

        }


        function SliderContainer() {
            return <div className="card mb-4">
                <div className="card-header py-3">
                    {nb_tickets === 1 ? <h4 className="mb-0 text-center">Your ticket for {eventName}</h4> :
                        <h4 className="mb-0 text-center">Your {nb_tickets} tickets for {eventName}</h4>}
                </div>
                <div className="card-body">
                    {QRSlider()}
                </div>
            </div>;
        }

        return (
            <>
                <div className="container py-5">
                    <div className="row my-1 justify-content-center">
                        <div className="col-md-3 col-lg-5">
                            {SliderContainer()}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay:0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="container my-3 py-3">
                <h1 className="text-center">Thank you for your purchase!</h1>
                <hr/>
                {nb_tickets > 0 ? <ShowTickets/> : <EmptyCart/>}
            </div>
        </motion.div>
    );
}

export default Tickets