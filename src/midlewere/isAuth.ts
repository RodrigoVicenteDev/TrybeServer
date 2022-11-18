const { expressjwt: expressJWT } = require("express-jwt");

export default expressJWT({
  secret: process.env.TOKEN_SIGN_SECRET,
  algorithms: ["HS256"],
});