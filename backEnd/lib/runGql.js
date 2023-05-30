const fs = require("fs");
const path = require("path");
const makeRequest = require("./makeRequest.js");

module.exports = async (quey, variables, tries = 4) => {
  let rs = { status: 500, data: "nothing yet" };
  const getRs = async () => {
    rs = await makeRequest(
      fs
        .readFileSync(path.join(__dirname, "..", "gql", `${quey}.gql`))
        .toString(),
      variables
    );
  };

  while (rs.status != 200 && tries) {
    await getRs();
    tries--;
    if (rs.status != 200) await new Promise((a) => setTimeout(a, 300));
  }

  return rs.data;
};
