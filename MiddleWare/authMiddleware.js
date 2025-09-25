const jwt = require("jsonwebtoken");

const authenticationMiddleWare = (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log(token);

    if (!token) {
      return res.status(401).send({ message: "authentication failed" });
    }

    const { username, id } = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id, username };
    next();
  } catch (error) {
    return res.status(401).send({ message: error });
  }
};

module.exports = authenticationMiddleWare;
