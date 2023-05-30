const fs = require("fs");
const path = require("path");
const runGql = require("./lib/runGql.js");

// https://graphql.contentful.com/content/v1/spaces/ez9mp376cw6o/explore?access_token=9a1e59dca7c8b73f3bff7fcc4ff0154b1279db37560b700e27462e782d574e54
const getSubItems = async (item, locale) => {
  const rs = {};

  if (item && item.__typename && item.sys.id) {
    if (item.__typename == "Menu") {
      const desc = (await runGql(item.__typename, { id: item.sys.id, locale }))[
        item.__typename.charAt(0).toLowerCase() + item.__typename.slice(1)
      ];

      rs.data = { name: desc.name, slug: desc.slug, type: "Menu" };
      rs.items = await Promise.all(
        desc.itemsCollection.items.map(
          (item) =>
            new Promise(async (a) => {
              a(await getSubItems(item, locale));
            })
        )
      );
    }

    if (item.__typename == "ProductGroup") {
      const desc = (await runGql(item.__typename, { id: item.sys.id, locale }))[
        item.__typename.charAt(0).toLowerCase() + item.__typename.slice(1)
      ];
      rs.data = { name: desc.name, slug: desc.slug, type: "ProductGroup" };
      rs.items = await Promise.all(
        desc.productsCollection.items.map(
          (item) =>
            new Promise(async (a) => {
              a(await getSubItems(item, locale));
            })
        )
      );
    }

    if (item.__typename == "ProductCategories") {
      const desc = (await runGql(item.__typename, { id: item.sys.id, locale }))[
        item.__typename.charAt(0).toLowerCase() + item.__typename.slice(1)
      ];
      rs.data = {
        name: desc.name,
        sku: desc.sku,
        type: "ProductCategories",
        image: desc.image.url,
      };
    }

    if (item.__typename == "Product") {
      const desc = (await runGql(item.__typename, { id: item.sys.id, locale }))[
        item.__typename.charAt(0).toLowerCase() + item.__typename.slice(1)
      ];
      if (desc && desc.productName && desc.image && desc.sku) {
        rs.data = {
          type: "Product",
          name: desc.productName,
          sku: desc.sku,
          popularity: desc.popularity,
          dateAdded: desc.dateAdded,
          image: desc.image.url,
        };
      } else {
        // console.log("product not found !", item.sys.id + " " + desc.sku);
      }
    }
    if (
      item.__typename != "Product" &&
      item.__typename != "ProductGroup" &&
      item.__typename != "Menu" &&
      item.__typename != "ProductCategories"
    )
      console.log(item.__typename);
  }

  return rs;
};

const getAllData = async (locale = "en") => {
  const rs = (
    await Promise.all(
      (
        await runGql("MenuCollection")
      ).menuCollection.items
        .filter((it) => it.slug == "product-groups")
        .map(
          (it) =>
            new Promise(async (a) => {
              a(await getSubItems(it, locale));
            })
        )
    )
  )[0];
  return rs;
};

const getData = (request) =>
  new Promise((a) => {
    let body = "";
    request.on("data", (data) => {
      body += data;
    });

    request.on("end", () => {
      a(JSON.parse(body));
    });
  });

let cache = null;

module.exports = async (req, res) => {
  if (req.url == "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    return res.end(
      fs.readFileSync(path.join(__dirname, "..", "frontEnd", "index.html"))
    );
  }

  if ((req.method == "GET", req.url.startsWith("/allData"))) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    if (!cache) {
      cache = await getAllData("en");
      console.log(`file size ${JSON.stringify(cache).length}`);
    }
    return res.end(JSON.stringify(cache));
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  return res.end("not found");
};
