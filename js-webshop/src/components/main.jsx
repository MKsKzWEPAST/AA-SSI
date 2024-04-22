import React from "react";
import {useSelector} from "react-redux";

const Home = () => {
    const state = useSelector((state) => state.handleMode)
    const img_url = (state === "fast"? "./assets/blue.png" :  "./assets/ajaxmain.png" )
    const title = (state === "fast"? "Barbe Bleue" : "" )
    const par = (state === "fast"? "Enveloped in mesmerizing choreography and haunting melodies, 'Barbe Bleue' ballet\n" +
        "                                invites audiences on a captivating journey through realms of enchantment and mystery.g" :  "" )

    return (
        <>
            <div className="hero border-1 pb-3">
                <div className="card bg-dark text-dark border-0 mx-3">
                    <img
                        className="card-img img-fluid"
                        src={img_url}
                        alt="Card"
                        height={445}
                    />
                    <div className="card-img-overlay d-flex align-items-center mb-5 pb-5">
                        <div className="container col-md-3 offset-2">
                            <h5 className="card-title fs-1 text fw-bold">{title}</h5>
                            <p className="card-text fs-4 d-none d-sm-block">
                                {par}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
