import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {addCart, delCart} from "../redux/action";
import {Link} from "react-router-dom";
import {motion} from "framer-motion";


const Cart = () => {
    const state = useSelector((state) => state.handleCart);
    const dispatch = useDispatch();

    const EmptyCart = () => {
        return (<div className="container">
            <div className="row">
                <div className="col-md-12 py-5 bg-light text-center">
                    <h4 className="p-3 display-5">Your Cart is Empty</h4>
                    <Link to="/products" className="btn  btn-outline-dark mx-4">
                        <i className="fa fa-arrow-left"></i> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>);
    };

    const addItem = (product) => {
        dispatch(addCart(product));
    };
    const removeItem = (product) => {
        dispatch(delCart(product));
    };

    const ShowCart = () => {
        let subtotal = 0;
        let shipping = 0;
        let totalItems = 0;
        state.map((item) => {
            return (subtotal += item.price * item.qty);
        });

        state.map((item) => {
            return (totalItems += item.qty);
        });
        return (<>
            <section className="h-100 gradient-custom">
                <div className="container py-5">
                    <div className="row d-flex justify-content-center my-3">
                        <div className="col-md-8">
                            <div className="card mb-4">
                                <div className="card-header py-3">
                                    <h5 className="mb-0">Item List</h5>
                                </div>
                                <div className="card-body">
                                    {state.map((item) => {
                                        return (<div key={item.id}>
                                            <div className="row align-items-center">
                                                <div
                                                    className="col-md-7 d-flex justify-content-between align-items-center">
                                                    <div className="bg-image rounded"
                                                         data-mdb-ripple-color="light">
                                                        <i className="fa-solid fa-ticket"></i>
                                                        <strong> {item.title}</strong> {item.date}
                                                    </div>

                                                </div>
                                                <div
                                                    className="col-md-3 offset-2">
                                                    <div className="d-flex align-items-center">
                                                        <div className="d-flex flex-row align-items-center">

                                                            <button
                                                                className="btn btn btn-outline-secondary btn-sm m-2"
                                                                onClick={() => {
                                                                    removeItem(item);
                                                                }}
                                                            >
                                                                <i className="fas fa-minus"></i>
                                                            </button>
                                                            <span>{item.qty}</span>
                                                            <button
                                                                className="btn btn btn-outline-secondary btn-sm m-2"
                                                                onClick={() => {
                                                                    addItem(item);
                                                                }}
                                                            >
                                                                <i className="fas fa-plus"></i>
                                                            </button>

                                                        </div>
                                                        <strong>
                                                            <span className="text-muted"></span>
                                                            x ${item.price}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>


                                            <hr className="my-4"/>
                                        </div>);
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card mb-4">
                                <div className="card-header py-3 bg-light">
                                    <h5 className="mb-0">Order Summary</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-0">
                                            Products ({totalItems})<span>${Math.round(subtotal)}</span>
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
                          <strong>${Math.round(subtotal + shipping)}</strong>
                        </span>
                                        </li>
                                    </ul>

                                    <Link
                                        to="/checkout"
                                        className="btn btn-dark btn-lg btn-block"
                                    >
                                        Go to checkout
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link to="/products" className="btn  btn-outline-dark mx-4">
                        <i className="fa fa-arrow-left"></i> Continue Shopping
                    </Link>
                </div>
            </section>
        </>);
    };

    return (
        <motion.div initial={{x: window.innerWidth}}
                    animate={{x: 0, transition: {duration: 0.3, type: 'tween', delay:0.1}}}
                    exit={{opacity: 0, transition: {duration: 0.1, type: 'tween'}}} style={{overflow: "hidden"}}>

            <div className="container my-3 py-3">
                <h1 className="text-center">Cart</h1>
                <hr/>
                {state.length > 0 ? <ShowCart/> : <EmptyCart/>}
            </div>
        </motion.div>);
};

export default Cart;
