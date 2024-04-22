import React, { useState } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import sha256 from "crypto-js/sha256";
import {signIn} from "../redux/action";
import {useDispatch} from "react-redux";
const Signup = () => {
    const [input, setInput] = useState({
        email: "",
        phone: "",
        password: "",
        first_name: "",
        last_name: "",
    });

    const navigate = useNavigate()
    const dispatch = useDispatch();
    const handleSubmitEvent = (e) => {
        e.preventDefault();
        if (input.email !== "" && input.password !== "" && input.phone !== "" && input.first_name !== "" && input.last_name !== "") {
            input.password = sha256(input.password).toString();
            axios.post('https://griffon-loved-physically.ngrok-free.app/api/signup',input)
                .then(res => {
                    const {valid, session_token,email,first_name,last_name,phone} = res.data;
                    if (valid) {
                        dispatch(signIn(email,first_name,last_name,session_token,phone))
                        navigate('/')
                    }})
                .catch(err => console.log(err))
        } else {
            alert("Please provide a valid input")
        }
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        setInput((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <>
            <div className="container my-3 py-3">
                <h1 className="text-center">Register a new account</h1>
                <hr/>
                <form onSubmit={handleSubmitEvent} className="container mt-3 col-md-3 justify-content-center">
                    <div className="align-content-center">
                        <label htmlFor="user-email" className="form-label py-1">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="user-email"
                            name="email"
                            className="form-control"
                            placeholder="example@yahoo.com"
                            aria-describedby="user-email"
                            aria-invalid="false"
                            onChange={handleInput}
                        />
                    </div>
                    <div className="align-content-center">
                        <label htmlFor="password" className="form-label py-1">
                            First name:
                        </label>
                        <input
                            type="first_name"
                            id="first_name"
                            name="first_name"
                            className="form-control"
                            aria-describedby="first_name"
                            aria-invalid="false"
                            onChange={handleInput}
                        />
                    </div>
                    <div className="align-content-center">
                        <label htmlFor="password" className="form-label py-1">
                            Last name:
                        </label>
                        <input
                            type="last_name"
                            id="last_name"
                            name="last_name"
                            className="form-control"
                            aria-describedby="last_name"
                            aria-invalid="false"
                            onChange={handleInput}
                        />
                    </div>
                    <div className="align-content-center">
                        <label htmlFor="password" className="form-label py-1">
                            Phone number:
                        </label>
                        <input
                            type="phone"
                            id="phone"
                            name="phone"
                            className="form-control"
                            aria-describedby="phone"
                            aria-invalid="false"
                            onChange={handleInput}
                        />
                    </div>
                    <div className="align-content-center py-1">
                        <label htmlFor="password" className="form-label py-1">
                            New password:
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-control"
                            aria-describedby="user-password"
                            aria-invalid="false"
                            placeholder="TH&1s*PäSsW0örd4"
                            onChange={handleInput}
                        />
                    </div>
                    <div className="justify-content-center d-flex">
                        <button type="submit" className="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Signup;