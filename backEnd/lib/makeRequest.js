const https = require("https");

const makeRequest = (query, variables) =>
  new Promise((callback) => {
    query = JSON.stringify({ query, variables });
    var options = {
      hostname: "graphql.contentful.com",
      port: 443,
      path: "content/v1/spaces/ez9mp376cw6o/environments/master",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(query),
        authorization: `Bearer 9a1e59dca7c8b73f3bff7fcc4ff0154b1279db37560b700e27462e782d574e54`,
      },
    };

    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk) => {
        body = body + chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          callback({
            status: res.statusCode,
            data: "Api call failed with response code: " + res.statusCode,
          });
        } else {
          callback({
            status: 200,
            data: JSON.parse(body).data,
          });
        }
      });
    });

    req.on("error", (e) => {
      callback({
        status: 500,
        data: "Error : " + e.message,
      });
    });

    req.write(query);
    req.end();
  });

module.exports = async (query, variables) => {
  return await makeRequest(query, variables);
};
