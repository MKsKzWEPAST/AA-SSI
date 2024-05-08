import React, {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {BsChevronDown, BsChevronUp} from 'react-icons/bs';
import {motion} from "framer-motion";
import {PaymentOptions, AgeAuth} from "../components";
import Spinner from 'react-bootstrap/Spinner';
import {ToastContainer, toast, Bounce} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {BACK_END_BASE_URL} from "../consts";

const back_end_base_url = BACK_END_BASE_URL;

const maxOrderID = 2 ** 52; // fit with some margin in uint64 + no precision loss in js

const Checkout = () => {

    const location = useLocation();
    const fastState = location.state

    let state = useSelector((state) => state.handleCart);
    const navigate = useNavigate();
    const [isCollapsedBilling, setIsCollapsedBilling] = useState(true);
    let requireAgeVerified = false;

    const [orderID] = useState(Math.floor(Math.random() * maxOrderID) + 1);
    const [orderInitialized, setOrderInitialized] = useState(false);

    async function initOrder(orderID, price, requireAgeVerified) {
        try {
            const response = await fetch(`${back_end_base_url}/api/initOrder?orderID=${orderID}&price=${price}&ageReq=${requireAgeVerified ? 1 : 0}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // You can add other options like credentials, etc. if needed
            });

            if (!response.ok) {
                throw new Error('Failed to initialize order');
            }

            return true;
        } catch (error) {
            console.error('Error initializing order:', error);
            toast.error("Couldn't initialize the order",
                {position: "top-center", autoClose: 2500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: false,
                    progress: undefined,
                    theme: "dark",
                    transition: Bounce, onClose: props => navigate('/')});
            return false;
        }
    }

    async function checkOrderStatus(orderID) {
        while (true) {
            const headers = {
                "ngrok-skip-browser-warning": "true",
                "accept": "application/json",
            };

            const response = await fetch(`${back_end_base_url}/api/getOrderStatus?orderID=${orderID}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.log('Failed to fetch order status');
                toast.error("Failed to check the order status",
                    {position: "top-center", autoClose: 2500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: false,
                        progress: undefined,
                        theme: "dark",
                        onClose: props => navigate('/')});
                return false;
            }

            const {event_status} = await response.json();
            switch (event_status) {
                case 0: // Still waiting for an update
                    break;
                case 1:
                    toast.success("Payment successful!",
                        {position: "top-center", autoClose: 2500,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: false,
                            progress: undefined,
                            theme: "dark"});
                    //TODO cover qr
                    break;
                case 2:
                    toast.success("Age verification successful!",
                        {position: "top-center", autoClose: 2500,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: false,
                            progress: undefined,
                            theme: "dark"});
                    //TODO cover qr
                    break;
                case 3:
                    return true;
                default:
                    return false;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    if (fastState != null && fastState.product != null && fastState.product.qty > 0) {
        state = [fastState.product];
        requireAgeVerified = fastState.product['18required'];
    }

    useEffect(() => {
        if (fastState == null || fastState.product == null || fastState.product.qty === 0) {
            navigate('/*');
        }
    });

    useEffect(() => {
        if (!orderInitialized && fastState != null && fastState.product != null && fastState.product.qty > 0) {
            initOrder(orderID, fastState.product.price * fastState.product.qty, requireAgeVerified).then(result => {
                if (result) {
                    setOrderInitialized(true);
                    console.log("Order initialized: ", orderID, fastState.product.price * fastState.product.qty, requireAgeVerified);

                    checkOrderStatus(orderID).then(success => {
                        if (success === undefined || !success) {
                            console.log("Failed to confirm that order was processed.");
                            toast.error("Something went wrong sorry...",
                                {position: "top-center", autoClose: 2500,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: false,
                                    draggable: false,
                                    progress: undefined,
                                    theme: "dark",
                                    onClose: props => navigate('/')});
                        } else {
                            console.log("Order paid and processed.");
                            fetch(`${back_end_base_url}/api/readOrderStatus?orderID=${orderID}`);
                            navigate('/thanks');
                        }
                    });
                }
            });
        }
    }, );


    let nb_tickets = 0;
    state.map((item) => {
        return (nb_tickets += item.qty);
    });

    const handleCollapseToggleBilling = () => {
        setIsCollapsedBilling(!isCollapsedBilling);
    };


    const EmptyCart = () => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12 py-5 bg-light text-center">
                        <h4 className="p-3 display-5">No item in Cart</h4>
                        <Link to="/" className="btn btn-outline-dark mx-4">
                            <i className="fa fa-arrow-left"></i> Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    const ShowCheckout = () => {
        let subtotal = 0;
        let shipping = 0;
        let totalItems = 0;
        state.map((item) => {
            return (subtotal += item.price * item.qty);
        });

        state.map((item) => {
            return (totalItems += item.qty);
        });

        function OrderSummary() {
            return <div className="card mb-4">
                <div className="card-header py-3 bg-light">
                    <h5 className="mb-0">Order Summary</h5>
                </div>
                <div className="card-body">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-0">
                            Products ({totalItems})<span>{Math.round(subtotal)} $</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                            Shipping
                            <span>free</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 mb-3">
                            <div>
                                <strong>Total amount</strong>
                            </div>
                            <span>
                        <strong>{Math.round(subtotal + shipping)} $</strong>
                      </span>
                        </li>
                    </ul>
                </div>
            </div>;
        }

        function paymentOptions() {
            return <div className="card mb-4">
                <div className="card-header py-3">
                    <h4 className="mb-0">Payment</h4>
                </div>
                <div className="card-body">
                    <PaymentOptions  price={subtotal} orderID={orderID}/>
                </div>
            </div>;
        }

        function ageVerification() {
            return <div className="card mb-4">
                <div className="card-header py-3">
                    <h4 className="mb-0">Age verification</h4>
                </div>
                <div className="card-body">
                    <AgeAuth orderID={orderID}/>
                </div>
            </div>;
        }

        function billingAddress() {
            return <div className="card mb-4">
                <div className="card-header py-3" onClick={handleCollapseToggleBilling} style={{cursor: 'pointer'}}>
                    <h4 className="mb-0">
                        Billing address <i>(optional) </i>
                        {isCollapsedBilling ? <BsChevronDown/> : <BsChevronUp/>}
                    </h4>
                </div>
                <div
                    className={`card-body ${isCollapsedBilling ? 'collapse' : ''}`}
                >
                    <form className="needs-validation" noValidate>
                        <div className="row g-3">
                            <div className="col-sm-6 my-1">
                                <label htmlFor="firstName" className="form-label">
                                    First name
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="firstName"
                                    placeholder=""
                                    required
                                />
                                <div className="invalid-feedback">
                                    Valid first name is required.
                                </div>
                            </div>

                            <div className="col-sm-6 my-1">
                                <label htmlFor="lastName" className="form-label">
                                    Last name
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lastName"
                                    placeholder=""
                                    required
                                />
                                <div className="invalid-feedback">
                                    Valid last name is required.
                                </div>
                            </div>

                            <div className="col-12 my-1">
                                <label htmlFor="email" className="form-label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    placeholder="you@example.com"
                                    required
                                />
                                <div className="invalid-feedback">
                                    Please enter a valid email address for shipping
                                    updates.
                                </div>
                            </div>

                            <div className="col-12 my-1">
                                <label htmlFor="address" className="form-label">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="address"
                                    placeholder="1234 Main St"
                                    required
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12">
                                <label htmlFor="address2" className="form-label">
                                    Address 2{" "}
                                    <span className="text-muted">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="address2"
                                    placeholder="Apartment or suite"
                                />
                            </div>

                            <div className="col-md-5 my-1">
                                <label htmlFor="country" className="form-label">
                                    Country
                                </label>
                                <br/>
                                <select className="form-select" id="country" required>
                                    <option value="">Choose...</option>
                                    <option>India</option>
                                </select>
                                <div className="invalid-feedback">
                                    Please select a valid country.
                                </div>
                            </div>

                            <div className="col-md-4 my-1">
                                <label htmlFor="state" className="form-label">
                                    State
                                </label>
                                <br/>
                                <select className="form-select" id="state" required>
                                    <option value="">Choose...</option>
                                    <option>Punjab</option>
                                </select>
                                <div className="invalid-feedback">
                                    Please provide a valid state.
                                </div>
                            </div>

                            <div className="col-md-3 my-1">
                                <label htmlFor="zip" className="form-label">
                                    Zip
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="zip"
                                    placeholder=""
                                    required
                                />
                                <div className="invalid-feedback">
                                    Zip code required.
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>;
        }

        return (
            <>
                <div className="container py-5">
                    <div className="row my-4">
                        <div className="col-md-5 col-lg-4 order-md-last">
                            {OrderSummary()}
                        </div>
                        <div className="col-md-7 col-lg-8">

                            {orderInitialized ? <>
                                {paymentOptions()}
                                {requireAgeVerified ? ageVerification() : <div/>}
                                {billingAddress()}
                            </> : <div className={"d-flex flex-row"}>
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                <span style={{marginLeft: '8px', fontWeight: 'bold'}}>Initializing your order...</span>
                            </div>}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay: 0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>
            <div className="container my-3 py-3">
                <h1 className="text-center">Checkout</h1>
                <hr/>
                {state.length ? <ShowCheckout/> : <EmptyCart/>}
                <ToastContainer pauseOnFocusLoss={false} />
            </div>

        </motion.div>
    );
};

export default Checkout;
