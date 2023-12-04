// import { CollectionConfig } from "payload/types";

// const Product : CollectionConfig = {
//   slug: "product",
//   admin:{
//     useAsTitle : "pr_name"
//   },
//   fields: [
//     {
//       name: "pr_name",
//       type: "text",
//       required: true,
//       validate: (value) => {
//         if (!value) {
//           return "Please enter product name.";
//         }
//         // You can add additional validation logic if needed
//         return true;
//       },
//     },
//   ],
// }

// export default Product;

const { CollectionConfig } = require("payload/types");

const Product = {
  slug: "product",
  admin: {
    useAsTitle: "prName",
  },
  fields: [
    {
      name: "prName",
      type: "text",
      required: true,
      validate: (value) => {
        if (!value) {
          return "Please enter product name.";
        }
        // You can add additional validation logic if needed
        return true;
      },
    },
  ],
};

module.exports = Product;

