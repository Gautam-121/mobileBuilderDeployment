const { CollectionConfig } = require("payload/types");

const accountPageDetailConfig = {
  slug: "accountPageDetail",
  admin: {
    useAsTitle: "shopId",
  },
  fields: [
    {
      name:"shopId",
      label:"ShopId",
      type:"text",
      unique:true,
      defaultValue:undefined
    },
    {
      name: "header_bar",
      label:"Header Icon",
      type: "group",
      fields:[
        {
            name:"cart",
            label:"Cart",
            type:"checkbox",
            defaultValue:true
        },
        {
            name:"settings",
            label:"Setting",
            type:"checkbox",
            defaultValue:true
        }
      ]
    },
    {
        name: "main_section",
        label:"Main-Portion",
        type: "array",
        fields:[
          {
              name:"type",
              label:"Type",
              type:"select",
              options:["orders" , "personal_information", "shipping_address"],
              unique: true
          },
          {
              name:"isVisible",
              label:"Visible",
              type:"checkbox",
              defaultValue:true
          }
        ]
      }
  ],
};

module.exports = accountPageDetailConfig;
