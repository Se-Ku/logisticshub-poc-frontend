# LogisticsHub PoC
This application is the frontend component of the LogisticsHub PoC.<br/>
To learn how this app fits into the whole system visit [logisticshub-poc](https://github.com/Se-Ku/logisticshub-poc)

# Main functions
Provides a PoC GUI for the LogisticsHub as a standalone application.<br/>
The main goal was to showcase a working process (order creation and fulfillment).<br/>
Not much thought was but into the overall looks and user experience. They serve only the main goal.



# Intended use scenarios
Simplified scenarios to showcase all the application's functions.

## Main functional areas
- login screen
- orders datatable
- new order form
- user administration panel

## Ordering scenario
- log in (login page)
- go to "orders" page
- create a new order (button)
- on a new order form, calculate shipping cost (button) and submit order
- from orders datatable, inspect order status and dispatch order (button)
- observe order status change to "fulfilled"

## User administration scenario
Simple user management (CRUD). Available only to users with administrative role.

# Implementation overview
The frontend is designed to rely solely on the backend's APIs.<br/>
The application follows a standard Nuxt 4 (https://nuxt.com) structure.

## Backend proxy
The actual backend is not directly exposed to the user (browser). The app automatically proxies all request through the Node server.

A custom middleware is implemented to set up dynamic proxy rules. 
Which is not possible if defining routes in nuxt.config, the routes are compiled at build time.
By setting an env variable, we tell the frontend instance which backend to use.  

## Authentication (JWT)
The frontend uses the API's login endpoint to obtain a JWT. To simplify the PoC, it is a cookie-only JWT.<br/>
The token/cookie is passed to the Node server when needed for SSR.

## Kubb: Zod schema generator
The app utilises Kubb for analysing the backends API Docs (provided by the APIPlatform) and generating Zod schemas.<br/>
The schemas are then used by Vue components when fetching data from the backend.

## Vue components
The components (pages) are mostly self-contained for the purpose of demonstration and readability. 
The main exception being the Zod schemas.<br/>
Typically, some common components would be extracted to separate components or composables.

