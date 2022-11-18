const jwt = require("jsonwebtoken");

type usuario ={
    id: number,
    username: string,
   
}


function generateToken(user:usuario) {
  const { id, username } = user;

  const signature = process.env.TOKEN_SIGN_SECRET;

  const expiration = "24h";

  return jwt.sign({ id, username }, signature, {
    expiresIn: expiration,
  });
}

module.exports = generateToken;