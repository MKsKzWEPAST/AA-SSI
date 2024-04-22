import React, {useEffect, useState} from "react";
import {addCart} from "../redux/action";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {getPrice} from "../pages/Products";
import {useDispatch} from "react-redux";
import {Link} from "react-router-dom";

const optionsLong = {
    month: 'long',
    day: '2-digit'
};

const optionsShort = {
    month: 'short',
    day: '2-digit'
};

const data = [
    {
        "id": 1,
        "title": "Adult Ticket",
        "delta": 0,
    },
    {
        "id": 2,
        "title": "Child Ticket",
        "delta": -7,
    },
    {
        "id": 3,
        "title": "Reduced Ticket",
        "delta": -3,
    }
];

const Products = ({selectedDate}) => {
    const [loading, setLoading] = useState(false);
    let componentMounted = true;

    const dispatch = useDispatch();

    const addItem = (product) => {
        dispatch(addCart(product));
    };

    useEffect(() => {
        const getProducts = async () => {
            setLoading(true);
            if (componentMounted) {
                setLoading(false);
            }

            return () => {
                componentMounted = false;
            };
        };

        getProducts();
    }, [selectedDate]);

    const Loading = () => {
        return (
            <>
                <div className="col-12 py-5 text-center">
                    <Skeleton height={40} width={560}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
                <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
                    <Skeleton height={592}/>
                </div>
            </>
        );
    };

    const [ticketNumbers, setTicketNumbers] = useState([]);

    function addTicket(product) {
        const exist = getTicket(product.id)
        if(exist != null){
            setTicketNumbers(ticketNumbers.map((x)=>x.id ===product.id?{...x, qty: x.qty+1}:x))
        }
        else{
            setTicketNumbers([...ticketNumbers, {...product, qty:1}])
        }
    }

    function delTicket(product) {
        const exist = getTicket(product.id)

        if(exist == null){
            return
        }
        if(exist.qty === 1){
            setTicketNumbers(ticketNumbers.filter((x)=>x.id!==exist.id))
        }
        else{
            setTicketNumbers(ticketNumbers.map((x)=> x.id===product.id?{...x, qty:x.qty-1}:x))
        }
    }

    function getTicket(id) {
        return ticketNumbers.find((x) => x.id === id)
    }

    const handleAddToCart = () => {
        ticketNumbers.forEach( (tickets) => {
            if (tickets.qty >= 1) {
                const qty = tickets.qty;
                tickets.qty = 1;
                for (let i = 0; i < qty; i++) {
                    addItem(tickets);
                }
            }
        })
    };

    function ProductCard(product, selectedDate) {
        const handleIncreaseQuantity = () => {
            addTicket(product);
        };

        const handleDecreaseQuantity = () => {
                delTicket(product);
        };

        return (
            <div id={product.id} key={product.id} className="col-xl-3 col-lg-4 col-md-5 col-sm-7 col-8 my-2">
                <div className="card text-center" key={product.id}>
                    <div className="card-body">
                        <h5 className="card-title">
                            {product.title}
                        </h5>
                    </div>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item lead">
                            <div className="d-inline-flex justify-content-center align-items-center">
                                <div> {/* Adjust column size as needed */}
                                    <span>${getPrice(selectedDate.toISOString().split('T')[0]) + product.delta}</span>
                                </div>

                                <div className="input-group ms-4">
                                    <button className="btn btn-outline-secondary" type="button"
                                            onClick={handleDecreaseQuantity} disabled={getTicket(product.id)==null}>-
                                    </button>
                                    <span className="input-group-text">{getTicket(product.id)!=null?getTicket(product.id).qty:0}</span>
                                    <button className="btn btn-outline-secondary" type="button"
                                            onClick={handleIncreaseQuantity}>+
                                    </button>
                                </div>

                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    const ShowProducts = ({selectedDate}) => {
        return (
            <>
                {data.map((product) => {

                    product['price'] = getPrice(selectedDate.toISOString().split('T')[0]) + product.delta;
                    product['date'] = selectedDate.toLocaleDateString('en-US', optionsShort);
                    product['id'] = (product.id + product.date).substring(0, 6);
                    return ProductCard(product, selectedDate);
                })}
            </>
        );
    };

    return (
        <>
            <div className="container my-3 py-3 align-items-center text-center">
                <div className="row">
                    <div className="col-12">
                        <h3 className="display-6 text-center">Tarifs
                            on {selectedDate.toLocaleDateString('en-US', optionsLong)}</h3>
                        <hr/>
                    </div>
                </div>
                <div className="col d-flex flex-column justify-content-center align-items-center">
                    {loading ? <Loading/> : <ShowProducts selectedDate={selectedDate}/>}
                    <div className={"mt-2"} style={{display: 'flex', justifyContent: 'center'}}>
                        <Link
                            to="/checkout"
                            className="btn btn-dark btn-lg"
                            onClick={handleAddToCart}
                        >
                            Add to Cart and Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Products;

export function BuyTicketsButton({onClick}) {
    return (
        <>
            <div className="container my-3 py-3">
                <div className="text-center">
                    <button onClick={onClick} className="btn btn-dark">
                        <h3>Other tickets...</h3>
                    </button>
                </div>
            </div>
        </>
    );
}

export function QuickBuyTickets({quantity, navigate, date}) {

    return (
        <>
            <div className="container my-3 py-3">
                <div className="text-center">
                    <button className="btn btn-dark" onClick={() => {
                        const formatted = date.toISOString().split('T')[0];
                        const product = data[0];
                        product['price'] = getPrice(formatted) + product.delta;
                        product['date'] = date.toLocaleDateString('en-US', optionsShort);
                        product['id'] = product.id + product.date

                        product.qty = quantity;
                        navigate('/checkout', {state: {product: product}});
                    }}>

                        <div className="d-flex align-items-center">
                            <h3>{quantity} Adult{quantity > 1 ? "s":""} &nbsp;</h3>
                            <div className="bg-image rounded"
                                 data-mdb-ripple-color="light">
                                <i className="fa-solid fa-ticket"></i>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
}