const { CollectionConfig } = require("payload/types");

const homePage = {
  slug: "homePage",
  admin:{
    useAsTitle: "shopId"
  },
  fields: [
    {
      name: "themeId",
      label: "Theme",
      type: "relationship",
      relationTo: "theme",
      // required: true
    },
    {
      name: "shopId",
      label: "ShopId",
      type: "text",
      unique: true,
      defaultValue: undefined
    },
    {
      name: 'homeData',
      label: "Data",
      type: 'array',
      fields: [
        {
          name: "isVisible",
          label:"Visible",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "displayOrder",
          label: "Position",
          type: "number",
          required: true
        },
        {
          name: "featureType",
          label: "Feature Type",
          type: "select",
          options: ["banner", "announcement" , "productGroup" , "categories" , "countdown" , "social_channel" , "text_paragraph" , "video"],
          required: true
        },
        {
          name: "layoutType",
          label: "Layout Type",
          type: "select",
          options: ["horizontal", "vertical" , "horizontal_grid" , "vertical_grid"],
          required: true
        },
        {
          name: 'data',
          label: "Relation",
          type: 'relationship',
          hasMany: false,
          relationTo: ["announcementBanner" ,"banner" , "collection" ,"product" , "eventTimer", "social" ,"paragraph" , "video"]
        },
      ],
    }
  ],
};

module.exports = homePage;
