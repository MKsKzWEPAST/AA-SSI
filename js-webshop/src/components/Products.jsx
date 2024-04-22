import React from "react";
import "react-loading-skeleton/dist/skeleton.css";

const optionsShort = {
    month: 'short',
    day: '2-digit'
};

export function QuickBuyItem({item, navigate}) {
    const date = new Date();
    const product = {'title': item==="beer"?"Beer":"Pizza"};
    return (
        <>
            <div className="container my-3 py-3">
                <div className="text-center">
                    <button className="btn btn-dark" onClick={() => {
                        product['price'] = item==="beer"?3:8;
                        product['date'] = date.toLocaleDateString('en-US', optionsShort);
                        product['id'] = product.id + product.date
                        product['18required'] = item==="beer"

                        product.qty = 1;
                        navigate('/checkout', {state: {product: product}});
                    }}>

                        <div className="d-flex align-items-center">
                            <div className="bg-image rounded"
                                 data-mdb-ripple-color="light">
                                {item==="beer"?<i className="fa-solid fa-beer-mug-empty"/>:<i className="fa-solid fa-pizza-slice"/>}
                                <span>&ensp; {product['title']}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
}