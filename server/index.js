require('@shopify/shopify-api/adapters/node');
const dotenv = require('dotenv');
const express = require('express');
const payload = require('payload');
const { resolve } = require('path');
const shopify = require('./utils/shopifyConfig.js');
const cors = require('cors');
const sessionHandler = require('./utils/sessionHandler.js');
const csp = require('./middleware/csp.js');
const setupCheck = require('./utils/setupCheck.js');
const {
  customerDataRequest,
  customerRedact,
  shopRedact,
} = require('./controllers/gdpr.js');
const applyAuthMiddleware = require('./middleware/auth.js');
const isShopActive = require('./middleware/isShopActive.js');
const verifyHmac = require('./middleware/verifyHmac.js');
const verifyProxy = require('./middleware/verifyProxy.js');
const verifyRequest = require('./middleware/verifyRequest.js');
const proxyRouter = require('./routes/app_proxy/index.js');
const router = require('./routes/index.js');
const webhookRegistrar = require('./webhooks/index.js');
const fileUpload = require("express-fileupload");
require('events').EventEmitter.prototype._maxListeners = 70;


dotenv.config();
setupCheck(); // Run a check to ensure everything is setup properly

const PORT = parseInt(process.env.PORT, 10) || 8081;
const isDev = process.env.NODE_ENV === "dev";

// const localIp = "192.168.1.135"

// Register all webhook handlers
webhookRegistrar();
console.log("Enter inside index")

const app = express();
app.use(cors(
  {
      origin: ["https://mobile-builder-deployment-pa9f.vercel.app"],
      methods: ["POST", "GET" , "PUT"],
      credentials: true
  }
));
// app.use(fileUpload({
//   useTempFiles: true
// }))


const start = async () => {
  try {

    await payload.init({
      secret: process.env.PAYLOAD_SECRET,
      express: app,
      onInit: async () => {
        payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
      },
    });
  
    const root = process.cwd()
    app.disable("x-powered-by");
  
    applyAuthMiddleware(app);
  
    console.log("Enter Inside The createServer App")
  
    // Incoming webhook requests
    app.post(
      "/webhooks/:topic",
      express.text({ type: "*/*" }),
      async (req, res) => {
        const { topic } = req.params || "";
        const shop = req.headers["x-shopify-shop-domain"] || "";
  
        try {
          await shopify.webhooks.process({
            rawBody: req.body,
            rawRequest: req,
            rawResponse: res,
          });
          console.log(`--> Processed ${topic} webhook for ${shop}`);
        } catch (e) {
          console.error(
            `---> Error while registering ${topic} webhook for ${shop}`,
            e
          );
          if (!res.headersSent) {
            res.status(500).send(error.message);
          }
        }
      }
    );
  
    app.use(express.json());
  
    app.post("/graphql", verifyRequest, async (req, res) => {
      try {
        const sessionId = await shopify.session.getCurrentId({
          isOnline: true,
          rawRequest: req,
          rawResponse: res,
        });
        const session = await sessionHandler.loadSession(sessionId);
        const response = await shopify.clients.graphqlProxy({
          session,
          rawBody: req.body,
        });
        res.status(200).send(response.body);
      } catch (e) {
        console.error(`---> An error occured at GraphQL Proxy`, e);
        res.status(403).send(e)
      }
    });
  
    app.use(csp);
    app.use(isShopActive)
    // If you're making changes to any of the routes, please make sure to add them in `./client/vite.config.cjs` or it'll not work.
    app.use("/apps", router); //Verify user route requests
    app.use("/proxy_route", verifyProxy, proxyRouter); //MARK:- App Proxy routes
  
    app.post("/gdpr/:topic", verifyHmac, async (req, res) => {
      const { body } = req;
      const { topic } = req.params;
      const shop = req.body.shop_domain;
  
      console.warn(`--> GDPR request for ${shop} / ${topic} recieved.`);
  
      let response;
      switch (topic) {
        case "customers_data_request":
          response = await customerDataRequest(topic, shop, body);
          break;
        case "customers_redact":
          response = await customerRedact(topic, shop, body);
          break;
        case "shop_redact":
          response = await shopRedact(topic, shop, body);
          break;
        default:
          console.error(
            "--> Congratulations on breaking the GDPR route! Here's the topic that broke it: ",
            topic
          );
          response = "broken";
          break;
      }
  
      if (response.success) {
        res.status(200).send();
      } else {
        res.status(403).send("An error occured");
      }
    });
  
    if (!isDev) {
      const compression = await import("compression").then(
        ({ default: fn }) => fn
      );
      const serveStatic = await import("serve-static").then(
        ({ default: fn }) => fn
      );
      const fs = await import("fs");
  
      app.use(compression());
      app.use(serveStatic(resolve("dist/client")));
      app.use("/*", (req, res, next) => {
        res
          .status(200)
          .set("Content-Type", "text/html")
          .send(fs.readFileSync(`${root}/dist/client/index.html`));
      });
    }

    app.listen(PORT,() => {
      console.log(`Server running at http://localhost:${process.env.PORT}`);
    });
    
  } catch (error) {
    console.log("error is " , error)
  }
};


start()
