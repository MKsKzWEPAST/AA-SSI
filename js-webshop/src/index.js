import React from 'react';
import ReactDOM from 'react-dom/client';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import {HashRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store, persistor} from './redux/store';

import Layout from "./layout";
import {Footer, Navbar} from "./components";

import "./main.css";
import {PersistGate} from "redux-persist/integration/react";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <HashRouter>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
            <Navbar/>
            <Layout/>
            <Footer/>
            </PersistGate>
        </Provider>
    </HashRouter>
);
