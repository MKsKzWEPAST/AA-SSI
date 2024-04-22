import React from "react";
import {useSelector} from "react-redux";


const Footer = () => {
  const state = useSelector((state) => state.handleMode);
  return (
    <>
      <footer className="mb-0 text-center">
        <div className="d-flex align-items-center justify-content-center pb-5">
          <div className="col-md-6">
            <br/>
            <p className="mb-3 mb-md-0"> © 2024 Secutix ({state} store)
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
