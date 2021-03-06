const express = require("express");
const router = express.Router();
const { User, Course } = require("../models");
const {
  authenticator,
} = require("../scripts/auth");
const asyncHandler = require("../scripts/asynchandler");

/**
 * @param {} - GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // returns an array
    const courses = await Course.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: User,
          attributes: [
            "firstName",
            "lastName",
            "emailAddress",
          ],
        },
      ],
    });
    res.status(200).json(courses);
  })
);

/**
 * @param {id} - GET /api/courses/:id 200 - Returns a course (including the user that owns the course) for the provided course ID
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findOne({
      where: {
        id: req.params.id,
      },
      //* filter out 'createdAt' and 'updatedAt'
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: {
        model: User,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "emailAddress",
        ],
      },
    });
    res.status(200).json(course);
  })
);

/**
 * @param {} - POST /api/courses 201 - Create a course, set the "Location" header to the URI for the course, and returns no content
 */
router.post(
  "/",
  authenticator,
  asyncHandler(async (req, res) => {
    //* New Course request data
    const courseData = req.body;
    //* Add 'userId' from req.user(data passed through 'auth.js')
    courseData.userId = parseInt(req.user.id, 10);
    await Course.create(courseData);
    //* address "Location" header to the course just created (using "title" attribute)
    const course = await Course.findOne({
      where: {
        title: req.body.title,
      },
    });
    const id = course.id;
    res
      .status(201)
      .set({
        Location: `https://localhost:${
          process.env.PORT || 5000
        }/api/courses/${id}`,
      })
      .end();
  })
);

/**
 * @param {} - PUT /api/courses 201 - Update a course and returns no content
 */

router.put(
  "/:id",
  authenticator,
  asyncHandler(async (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const courseData = req.body;
    const userData = req.user;
    const coursesUserOwns = userData.Courses.map(
      (item) => item.id
    );
    const course = await Course.findByPk(
      courseId
    );
    if (course) {
      //* check if the course is owned by the current authenticated user
      if (
        coursesUserOwns.indexOf(courseId) >= 0
      ) {
        if (
          courseData.hasOwnProperty("title") &&
          courseData.hasOwnProperty("description")
        ) {
          await course.update({
            title: courseData.title,
            description: courseData.description,
            estimatedTime:
              courseData.estimatedTime,
            materialsNeeded:
              courseData.materialsNeeded,
          });
          res.status(204).end();
        } else {
          res.status(400).json({
            errors: [
              "Title and Description must be included",
            ],
          });
        }
      } else {
        res.status(403).json({
          errors: ["Unauthorized"],
        });
      }
    } else {
      res
        .status(404)
        .json({ errors: ["No Course Found"] });
    }
  })
);

router.delete(
  "/:id",
  authenticator,
  asyncHandler(async (req, res) => {
    //* courseId has to be integer to use as a parameter of "indexOf"
    const courseId = parseInt(req.params.id, 10);
    const userData = req.user;
    const coursesUserOwns = userData.Courses.map(
      (item) => item.id
    );
    const course = await Course.findByPk(
      courseId
    );
    if (course) {
      //* check if the course is owned by the current authenticated user
      if (
        coursesUserOwns.indexOf(courseId) >= 0
      ) {
        course.destroy();
        res.status(204).end();
      } else {
        res.status(403).json({
          errors: [
            "You don't have permission to proceed the request",
          ],
        });
      }
    } else {
      res
        .status(404)
        .json({ errors: ["No Course Found"] });
    }
  })
);

module.exports = router;
