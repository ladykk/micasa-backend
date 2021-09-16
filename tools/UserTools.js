const DB = require("../db");
const jwt = require("jsonwebtoken");
const CustomError = require("./CustomError");

const validateUser = async (username) => {
  //Check if user exists?
  const user_result = await DB.query(
    "SELECT * FROM users WHERE username=$1; ",
    [username.toLowerCase()]
  ).catch((err) => {
    throw new CustomError.DBError(err, "user_result");
  });
  if (!user_result.rows[0]) {
    //CASE: User not found.
    throw new CustomError.Unauthorized();
  } else {
    return user_result.rows[0];
  }
};

const validateToken = async (req) => {
  //Get Token.
  const cookie = req.cookies["jwt"];
  //Verify Token.
  const claim = jwt.verify(cookie, process.env.SECRET);
  //Check is token invalid?
  if (!claim) {
    //CASE: Token invalid.
    return null;
  } else {
    //CASE: Token valid.
    const user = await validateUser(claim.username);
    if (user) {
      return user;
    } else {
      return null;
    }
  }
};

const isHasAgent = async (username) => {
  //Check if added user already have an agent?
  const is_have_agent_result = await DB.query(
    "SELECT * FROM customers WHERE username=$1;",
    [username]
  ).catch((err) => {
    throw new CustomError.DBError(err, "is_have_agent_result");
  });
  const agent = is_have_agent_result.rows[0].agent;
  return agent ? true : false;
};

const checkIsCustomer = async (username) => {
  //Check user is a customer?
  const customer_result = await DB.query(
    "SELECT * FROM customers WHERE username=$1;",
    [username]
  ).catch((err) => {
    throw new CustomError.DBError(err, "customer_result");
  });
  return customer_result.rows[0];
};

const checkIsAgent = async (username) => {
  //Check user is an agent?
  const agent_result = await DB.query(
    "SELECT * FROM agents WHERE username=$1;",
    [username]
  ).catch((err) => {
    throw new CustomError.DBError(err, "agent_result");
  });
  return agent_result.rows[0];
};

const checkIsWebmaster = async (username) => {
  //Check user is an webmaster?
  const webmaster_result = await DB.query(
    "SELECT * FROM webmasters WHERE username=$1;",
    [username]
  ).catch((err) => {
    throw new CustomError.DBError(err, "webmaster_result");
  });
  return webmaster_result.rows[0];
};

const checkIsStaff = async (username) => {
  //Check is added user is an admin account.
  const staff_result = await DB.query(
    "SELECT username FROM agents WHERE username=$1 UNION SELECT username FROM webmasters WHERE username=$2;",
    [username, username]
  ).catch((err) => {
    throw new CustomError.DBError(err, "staff_result");
  });
  return staff_result.rows[0];
};

module.exports = {
  validateToken,
  validateUser,
  isHasAgent,
  checkIsCustomer,
  checkIsAgent,
  checkIsWebmaster,
  checkIsStaff,
};
