"use strict";

let Browse = "Browse.js";//$NON-NLS-L$
let Error404 = "Error404.js";//$NON-NLS-L$
let Home = "Home.js";//$NON-NLS-L$
let ProductShow = "ProductShow.js";//$NON-NLS-L$
let Checkout = "Checkout.js";//$NON-NLS-L$
let OrderHistory = "OrderHistory.js";//$NON-NLS-L$

import Navbar from './views/components/Navbar.js';
import Bottombar from './views/components/Bottombar.js';
import Cart from './views/components/Cart.js';

import {Order} from './views/classes/Order.js';

import Utils from './services/Utils.js';
import i18n from './services/i18n.js';

import Products from './content/products.js';



//********************** 
//  GLOBAL VARIABLES
//**********************
var orderHistory = [];

//adds some dummy orders to the history on startup
let dummyOrders = () => {
    let now = new Date(); //$NON-NLS-L$
    var twoDays = now - 1000 * 60 * 60 * 24 * 2;
    var fiveDays = now - 1000 * 60 * 60 * 24 * 5;
    let order2 = new Order(900, new Date(fiveDays)); //$NON-NLS-L$
    let order1 = new Order(68500, new Date(twoDays)); //$NON-NLS-L$
    orderHistory.push(order1);
    orderHistory.push(order2);
}

//load
if(localStorage.getItem("orderHistory") !== null) {
    //first add a couple dummies
    dummyOrders();
    //get and parse the stringified array
    let orders = JSON.parse(localStorage.getItem('orderHistory'));
    //construct the objects and put into object array
    for(let order of orders) {
        let orderObj = new Order(parseInt(order[2]), new Date(order[0]), parseInt(order[1])); //$NON-NLS-L$
        console.log(orderObj);
        orderHistory.unshift(orderObj);
    }
}

//used to store info about selected locale
var locale;
//check localStorage for saved locale, load if exists, set to en-US be default
if(localStorage.getItem("locale") === null) {
    console.log("no locale info in storage");
    locale = "en-US";
}
else {
    console.log("found locale in storage, using that value");
    locale = localStorage.getItem("locale");
}
//function to update and save locale
var updateLocale = async(newLocale) => {
    //update the locale
    locale = newLocale;
    //store the new locale
    localStorage.setItem('locale', locale);
    console.log("Locale changed to: " + locale);
    
    //fetch new products list and refresh stringsJSON
    await getProductsList(locale);

    //refresh the shopping cart
    console.log(shoppingCart);
    console.log(productList);
    reloadCart();

    router();
}

//update the shopping cart based on the new product list
var reloadCart = () => {

    //get references to droid and vehicle map
    let moonMap = productList.get("moons");
    let coffeeMap = productList.get("coffees");

    for(let key in shoppingCart) {
        let product = shoppingCart[key];
        let saveQty;
        if(product.type == "moon") {
            saveQty = product.qty;
            shoppingCart[product.productID] = moonMap.get(product.productID);
            shoppingCart[product.productID].qty = saveQty;
        }
        else {
            saveQty = product.qty;
            shoppingCart[product.productID] = coffeeMap.get(product.productID);
            shoppingCart[product.productID].qty = saveQty;
        }
    }
    saveCart();
}

//stringify the cart and persist
var saveCart = () => {
    let cartIds = [];

    for(let key in shoppingCart) {
        cartIds.push([key, shoppingCart[key].type, shoppingCart[key].qty]);
    }
    localStorage.setItem("cart", JSON.stringify(cartIds));
}

//map of maps to hold both vehicles and droids
var productList = new Map();
productList.set("moons", new Map());
productList.set("coffees", new Map());

//function to get products and push to map
let getProductsList = async() => {
    let moonMap = productList.get("moons");
    let coffeeMap = productList.get("coffees");

    //clear em out
    moonMap.clear();
    coffeeMap.clear();

    let productsJSON = await Products.loadProductCatalog();

    for(let item of productsJSON) {
        //loop through parsed json and add to either droid Map or vehicle Map
        if(item.type == "moon") {
            moonMap.set(item.productID, item);
        }
        else if(item.type == "coffee") {
            coffeeMap.set(item.productID, item);
        }
    }

    //pick the "featured products"
    await getFeaturedProducts();
    //load cart contents fromlocalStorage if available
    //localStorage.removeItem('cart');
    readCart();
}

//holds the items that the user adds to cart; schema: productID (int) : item (object)
var shoppingCart = {};

//load cart contents fromlocalStorage if available
var readCart = () => {
    if(localStorage.getItem("cart") !== null) {
        console.log("found cart in storage, reconstructing...");

        let moonMap = productList.get("moons");
        let coffeeMap = productList.get("coffees");

        let cartIdString = localStorage.getItem("cart");
        let cartIds = JSON.parse(cartIdString);

        for(let productAr of cartIds) {
            if(productAr[1] == 'moon') { //$NON-NLS-L$
                let product = moonMap.get(parseInt(productAr[0]));
                product.qty = parseInt(productAr[2]);
                shoppingCart[productAr[0]] = product;
            }
            else {
                let product = coffeeMap.get(parseInt(productAr[0]));
                product.qty = parseInt(productAr[2]);
                shoppingCart[productAr[0]] = product;
            }
        }

    }
}

//function for anytime an object is added to cart
var addToCart = async (item) =>  {
    const cart = null || document.querySelector('.cartSlider');

    //add item to cart if it doesn't already exist
    if(!shoppingCart.hasOwnProperty(item.productID)) {
        shoppingCart[item.productID] = item;
    }

    //re-render the cart and navbar (for click listener)
    cart.innerHTML = await Cart.render();
    await Cart.after_render();
    await Navbar.after_render();
    //display cart
    showCart();
    //save it to localStorage
    saveCart();
}

//show the cart and fade the other elements
var showCart = () => {
    var slider = document.querySelector(".cartSlider")
    var overlayBG = document.querySelector('.bg');
    overlayBG.classList.toggle('overlay');
    slider.classList.toggle('showCart');
}

let featuredProducts = [];

let getFeaturedProducts = async () => {
    featuredProducts = [];

    let moonMap = productList.get('moons');
    let coffeeMap = productList.get('coffees');
   
    featuredProducts.push(moonMap.get(5));
    featuredProducts.push(coffeeMap.get(1));
    featuredProducts.push(coffeeMap.get(8));
    featuredProducts.push(moonMap.get(2));
}

export { shoppingCart, addToCart, showCart, router, locale, productList, updateLocale, orderHistory, featuredProducts, saveCart };

// List of supported routes. Any url other than these routes will throw a 404 error
const routes = {
    './' : Home, 
    './moons' : Browse,
    './moons/:id' : ProductShow,
    './coffees' : Browse,
    './coffees/:id' : ProductShow,
    './history' : OrderHistory,
    './checkout' : Checkout
};

//load background
particlesJS.load('particles-js', './plugins/assets/particlesjs-config.json', function() {
    //callback
});

// The router code. Takes a URL, checks against the list of supported routes and then renders the corresponding content page.
const router = async () => {

    // Lazy load view element:
    const header = null || document.getElementById('header_container');
    const content = null || document.getElementById('page_container');
    const footer = null || document.getElementById('footer_container');
    const cart = null || document.querySelector('.cartSlider');
    const ham = null || document.querySelector('.hamSlider');

    //grab products from JSON file
    if(productList.get("moons").size == 0 && productList.get("coffees").size == 0) {
        await getProductsList();
    }
    
    // Render the Header, footer, and empty cart of the page
    cart.innerHTML = await Cart.render();
    await Cart.after_render();
   
    header.innerHTML = await Navbar.render();
    await Navbar.after_render();
    // footer.innerHTML = await Bottombar.render();
    // await Bottombar.after_render();

    //add some dummy orders if there's nothing there
    if(orderHistory.length == 0) {
        dummyOrders();
    }

    // Get the parsed URl from the addressbar
    let request = Utils.parseRequestURL();

    // Parse the URL and if it has an id part, change it with the string ":id"
    let parsedURL = (request.resource ? './' + request.resource : './') + (request.id ? '/:id' : '') + (request.verb ? './' + request.verb : '')
    
    // Get the page from our hash of supported routes.
    // If the parsed URL is not in our list of supported routes, select the 404 page instead
    let page = routes[parsedURL] ? routes[parsedURL] : Error404

    //lazy load and then render the correct page
    let loadPage = await import(`./views/pages/${page}`);
    content.innerHTML = await loadPage.default.render();
    await loadPage.default.after_render();
    
}


// Listen on hash change:
window.addEventListener('hashchange', router);

// Listen on page load:
document.addEventListener('DOMContentLoaded', router);