import React, { Component } from "react";
import { Link } from "react-router-dom";
import Markdown from "./Markdown";

class CourseDetail extends Component {
  state = {
    course: {},
    owner: {},
  };

  async componentDidMount() {
    try {
      const { context } = this.props;
      const course = await context.data.getCourse(
        this.props.match.params.id
      );

      if (course) {
        this.setState({ course });
        this.setState({ owner: course.User });
      } else {
        console.log(
          "[GET][Course][in CourseDetail] 404 Error "
        );
        this.props.history.push("/notfound");
      }
    } catch (err) {
      console.log(
        "[GET][Course][in CourseDetail][Try-Catch] Error: ",
        err
      );
      this.props.history.push("/error");
    }
  }

  render() {
    const { context } = this.props;
    const authUser = context.authenticatedUser;
    const { course, owner } = this.state;
    const {
      title,
      description,
      estimatedTime,
      materialsNeeded,
    } = course;
    const { firstName, lastName } = owner;

    let isUserMatch;
    if (
      authUser &&
      authUser.emailAddress === owner.emailAddress
    ) {
      isUserMatch = (
        <React.Fragment>
          <Link
            className="button button--course"
            to={`/courses/${course.id}/update`}>
            Update Course
          </Link>
          <Link
            className="button button--course"
            onClick={this.deleteCourse}
            to="/">
            Delete Course
          </Link>
        </React.Fragment>
      );
    }

    return (
      <div>
        <div className="actions--bar">
          <div className="bounds">
            <div className="grid-100">
              {isUserMatch}
              <Link
                className="button button-secondary button--course"
                to="/">
                Return to list
              </Link>
            </div>
          </div>
        </div>
        <div className="bounds course--detail course--div-1">
          <div className="grid-66 course--div-2">
            <div className="course--header ">
              <h4 className="course--label">
                Course
              </h4>
              <h3 className="course--title course--custom--title">
                {title}
              </h3>
              <p>
                By {firstName} {lastName}
              </p>
            </div>
            <div className="course--description">
              <Markdown source={description} />
            </div>
          </div>
          <div className="grid-25 grid-right course--div-3">
            <div className="course--stats">
              <ul className="course--stats--list">
                <li className="course--stats--list--item">
                  <h4>Estimated Time</h4>
                  <h3>{estimatedTime}</h3>
                </li>
                <li className="course--stats--list--item">
                  <h4>Materials Needed</h4>
                  <Markdown
                    source={materialsNeeded}
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  deleteCourse = (e) => {
    e.preventDefault();
    const { context } = this.props;
    const authUser = context.authenticatedUser;
    const { emailAddress, password } = authUser;
    const { owner } = this.state;
    const { id } = this.state.course;

    if (owner.emailAddress === emailAddress) {
      context.data
        .deleteCourse(id, emailAddress, password)
        .then((res) => {
          if (!res.length) {
            console.log(
              "[DELETE][Course][in CourseDetail] Successful!"
            );
            this.props.history.push("/");
          } else if (res.status === 403) {
            this.props.history.push("/forbidden");
          } else if (res.status === 404) {
            this.props.history.push("/notfound");
          } else {
            this.props.history.push("/error");
          }
        })
        .catch((err) => {
          console.log(
            "[DELETE][Course][in CourseDetail][Catch] Error: ",
            err
          );
          this.props.history.push("/error");
        });
    }
  };
}

export default CourseDetail;
