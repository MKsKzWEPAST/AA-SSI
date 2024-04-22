import React, { useState } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {useSelector,useDispatch} from "react-redux";
import {signIn,clearLogin} from "../redux/action";
import sha256 from "crypto-js/sha256";

const Login = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate()
  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (input.email !== "" && input.password !== "") {
      input.password = sha256(input.password).toString();
      axios.post("https://griffon-loved-physically.ngrok-free.app/api/login",input)
          .then(res => {
            const {valid, session_token,email,first_name,last_name,phone} = res.data;
            if (valid) {

              dispatch(signIn(email,first_name,last_name,session_token,phone))
              navigate('/')
            }
          })
          .catch(err => {
            console.log(err);
          })
    } else {
      alert("Please provide a valid input");
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
          <h1 className="text-center">Please login to continue</h1>
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
            <div className="align-content-center py-4">
              <label htmlFor="password" className="form-label py-1">
                Password:
              </label>
              <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  aria-describedby="user-password"
                  aria-invalid="false"
                  onChange={handleInput}
              />
              <div id="user-password" className="form-text">
                Forgotten password? Too bad.

              </div>
            </div>
            <div className="justify-content-center d-flex">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </>
  );
};

export default Login;