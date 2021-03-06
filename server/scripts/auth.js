const auth = require("basic-auth");
const bcrypt = require("bcryptjs");
const { User, Course } = require("../models");
const validator = require("validator");

// authenticate user function
const authenticator = async (req, res, next) => {
  try {
    const credentials = auth(req);
    const name = credentials.name;
    const pass = credentials.pass;
    const validateName = validator.isEmail(name);
    // if all credential values exist,
    if (name && pass) {
      // find a user matches email
      const dbUser = await User.findOne({
        // find a user data where the email-address given matches username
        where: {
          emailAddress: name,
        },
        //* filter out 'createdAt' and 'updatedAt'
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
        include: [
          {
            model: Course,
            attributes: [
              "id",
              "title",
              "description",
              "estimatedTime",
              "materialsNeeded",
            ],
          },
        ],
      });
      //! if a user is found,
      if (dbUser) {
        const dbUserObj = dbUser.dataValues;
        const dbUserPassword = dbUserObj.password;
        //! check passwords match.
        const passwordSync = bcrypt.compareSync(
          pass,
          dbUserPassword
        );
        //! if password match,
        if (passwordSync) {
          //! set the user on the request
          req.user = {};
          //* remove password from being exposed & pass it via req.user
          Object.entries(dbUserObj).forEach(
            ([key, value]) => {
              if (key !== "password") {
                req.user[key] = value;
              }
            }
          );
          next();
        } else {
          //! IF password is incorrect
          res.status(401).json({
            errors: ["Oops, wrong password!"],
          });
        }
      } else {
        //* if dbUser doesn't exist, check if the email given is valid
        if (!validateName) {
          res.status(401).json({
            errors: ["The email is not valid"],
          });
        } else {
          res.status(401).json({
            errors: ["The email doesn't exist"],
          });
        }
      }
    } else if (!name && pass) {
      res.status(400).json({
        errors: ["Your email is required"],
      });
    } else if (name && !pass) {
      //* if name is not a valid email form, return error
      if (!validateName) {
        res.status(400).json({
          errors: [
            "The email is not valid",
            "Password is required",
          ],
        });
      } else {
        res.status(400).json({
          errors: ["Password is required"],
        });
      }
    } else {
      res.status(400).json({
        errors: [
          "Email is required",
          "Password is required",
        ],
      });
    }
  } catch (err) {
    res
      .status(401)
      .json({ errors: ["Unauthorized"] });
  }
};

module.exports = { authenticator };
