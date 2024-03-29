const {
  CookieNotFound,
  InvalidOAuthError,
  InvalidSession,
} = require("@shopify/shopify-api");
const authRedirect = require("../utils/authRedirect.js");
const sessionHandler = require("../utils/sessionHandler.js");
const shopify = require("../utils/shopifyConfig.js");
const payload = require('payload');

const TEST_QUERY = `
{
  shop {
    name
    id
  }
}`

const authMiddleware = (app) => {
  
  app.get("/auth", async (req, res) => {
    try {
      console.log("Come")
      await authRedirect(req, res);
    } catch (e) {
      console.error(`---> Error at /auth`, e);
      const { shop } = req.query;
      switch (true) {
        case e instanceof CookieNotFound:
          return res.redirect(`/exitframe/${shop}`);
          break;
        case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/auth?shop=${shop}`);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });

  app.get("/auth/tokens", async (req, res) => {

    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callbackResponse;

      await sessionHandler.storeSession(session);

      const webhookRegisterResponse = await shopify.webhooks.register({
        session,
      }); //Register all webhooks with offline token

      console.dir(webhookRegisterResponse, { depth: null }); //This is an array that includes all registry responses.

      return await shopify.auth.begin({
        shop: session.shop,
        callbackPath: "/auth/callback",
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });

    } catch (e) {
      console.error(`---> Error at /auth/tokens`, e);
      const { shop } = req.query;
      switch (true) {
        case e instanceof CookieNotFound:
          return res.redirect(`/exitframe/${shop}`);
          break;
        case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/auth?shop=${shop}`);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });

  app.get("/auth/callback", async (req, res) => {

    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callbackResponse;

      await sessionHandler.storeSession(session);

      const host = req.query.host;
      const { shop } = session;
      const client = new shopify.clients.Graphql({ session });
      const data = await client.query({ data: TEST_QUERY });

      console.log("data from line 97" , data?.body?.data.shop , "data" , data.body.extensions)

      console.log("Session in verifyRequest in line 24 is" , session)

      const result = await payload.find({
        collection: 'activeStores', // required
        where: {
          shopName: { equals: shop},
        }
      })

      if(result.docs?.length!=0){
        // Update Document
        await payload.update({
          collection: 'activeStores',
          where: {
            shopName: { equals: shop},
          },
          data: {
            shopName : shop,
            isActive: true
          }
        })
      }
      else{
        // Create The document
        await payload.create({
          collection: 'activeStores', // required
          data: {
            shopName : shop,
            shopId: data?.body?.data?.shop?.id,
            isActive: true
          },
        })
      }
      // Redirect to app with shop parameter upon auth
      res.redirect(`/?shop=${shop}&host=${host}`);

    } catch (e) {
      console.error(`---> Error at /auth/callback`, e);
      const { shop } = req.query;
      switch (true) {
        case e instanceof CookieNotFound:
          return res.redirect(`/exitframe/${shop}`);
          break;
        case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/auth?shop=${shop}`);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });
};

module.exports =  authMiddleware;
