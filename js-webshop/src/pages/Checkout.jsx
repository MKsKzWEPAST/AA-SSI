import React, {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {BsChevronDown, BsChevronUp} from 'react-icons/bs';
import {clearCart} from "../redux/action";
import {motion} from "framer-motion";
import {PaymentOptions, AgeAuth} from "../components";

const randomstring = require('randomstring');


const Checkout = () => {
    const location = useLocation();
    const fastState = location.state

    let state = useSelector((state) => state.handleCart);
    const navigate = useNavigate();
    let dispatch = useDispatch();
    const [isCollapsedBilling, setIsCollapsedBilling] = useState(true);
    let requireAgeVerified = false;

    if (fastState != null && fastState.product.qty > 0) {
        state = [fastState.product];
        requireAgeVerified = fastState.product['18required'];
    }

    const orderID = randomstring.generate(10);

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
                            Products ({totalItems})<span>DAI {Math.round(subtotal)}</span>
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
                        <strong>DAI {Math.round(subtotal + shipping)}</strong>
                      </span>
                        </li>
                    </ul>
                </div>
            </div>;
        }

        function validatePayment() {
            navigate("/Tickets", {state: {nb_of_tickets: nb_tickets}});
            dispatch(clearCart(null));
        }

        function paymentOptions() {

            return <div className="card mb-4">
                <div className="card-header py-3">
                    <h4 className="mb-0">Payment</h4>
                </div>
                <div className="card-body">

                    <PaymentOptions validatePayment={validatePayment}/>

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
                            {/* TODO add button to verify payment and age verification! */}
                        </div>
                        <div className="col-md-7 col-lg-8">
                            {paymentOptions()}
                            {requireAgeVerified?ageVerification():<div/>}
                            {billingAddress()}
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
            </div>
        </motion.div>
    );
};

export default Checkout;
