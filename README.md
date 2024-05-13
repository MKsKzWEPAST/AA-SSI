<h1 align="center">
  <br>
  AA-SSI-webshop
  <br>
</h1>

<h4 align="center">Webshop and Wallet for conditional payments OnChain.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#repository">Repository</a> •
  <a href="#license">License</a>
</p>

![preview](https://github.com/MKsKzWEPAST/AA-SSI/blob/be32e86a94a943140f0b864002d6135592dc9881/preview.gif)

## Key Features

* Buy beer or pizza
    - Products selected to showcase an age-restricted product.
* Social login for Token wallet
    - Custody for your token wallet.
* Uses the <a href="https://github.com/0xPolygonID/polygonid-flutter-sdk">PolygonID</a> SDK and <a href="https://www.stackup.sh/">Stackup</a> framework

## How To Use

### Setting up the backend url

The backend is located under ts-sc-proxy. The file consts.ts contains constants and configuration variables that are
necessary for the backend to communicate with the different smart contracts as well as the flutter app and the webshop.

The webshop (frontend) is located under js-webshop. In order for the webshop to access your backend, you should provide
the url at which it can be accessed. Please edit the config.json file under js-webshop in order to do so:

```
{
  "verifier_address": "0xf463aefB5975e712059eAF56276a7dfe7D4B5542", 
  "smart_money_address": "0x46346F5Db118505707F17B6c1805D0a557bb3ADA",
  "backend_url": "[BACKEND'S PUBLIC FACING URL]"
}
```

The easiest way to generate a public url is to set up an HTTP endpoint at port 3003 using ngrok ([here](https://ngrok.com/docs/http/));
This endpoint will allow access to your localhost backend using a publicly url.

#### Wallet App backend url setup

In the wallet application, there is a screen dedicated to configuring backend URL settings. Please input the public URL 
previously mentioned.

### Running the project

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/MKsKzWEPAST/AA-SSI

# Start with docker-compose
$ docker-compose up
```


## Repository

You can clone the repository from [here](https://github.com/MKsKzWEPAST/AA-SSI).

## Dependencies

This software uses the following open source packages:

- [Node.js](https://nodejs.org/)
- [PolygonID](https://github.com/0xPolygonID/polygonid-flutter-sdk)
- [Stackup](https://www.stackup.sh/)
- [React.js](https://react.dev/)
- [Express.js](https://expressjs.com/)

## License

MIT

---

> GitHub [@Leautp](https://github.com/Leautp) &nbsp;&middot;&nbsp;
> GitHub [@Nazianzenov](https://github.com/Nazianzenov)

