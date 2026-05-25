import 'dotenv/config';
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";


import user from "./models/user.js";
import hotels from "./models/hotels.js";
import settings from "./models/settings.js";
import session from "./models/session.js";
import auth from "./controllers/auth.js";


const port = process.env.PORT || 8000;
const LAST_VIEWED_COOKIE = "__Host-hotel-last-viewed";
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;
const SECRET = process.env.SECRET;

if (SECRET == null) {
  console.error(
    "SECRET environment variable missing. Please create an env file or provide SECRET via environment variables.",
  );
  process.exit(1);
}

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(morgan("dev"));
app.use(cookieParser(SECRET));

app.use(settings.settingsHandler);
app.use(session.sessionHandler);

const settingsRouter = express.Router();
settingsRouter.use("/toggle-theme", settings.themeToggle);
settingsRouter.use("/accept-cookies", settings.acceptCookies);
settingsRouter.use("/decline-cookies", settings.declineCookies);
settingsRouter.use("/manage-cookies", settings.manageCookies);
app.use("/settings", settingsRouter);

const authRouter = express.Router();
authRouter.get("/signup", auth.signup_get);
authRouter.post("/signup", auth.signup_post);
authRouter.get("/login", auth.login_get);
authRouter.post("/login", auth.login_post);
authRouter.get("/logout", auth.logout);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  var last_viewed_hotels = null;
  if (res.locals.app.cookie_consent && req.signedCookies[LAST_VIEWED_COOKIE]) {
    let last_viewed = req.signedCookies[LAST_VIEWED_COOKIE] || [];
    last_viewed_hotels = last_viewed
      .map((x) => parseInt(x, 10))
      .filter((x) => !isNaN(x))
      .map((id) => hotels.getHotelSummary(id));
  }
  res.render("hotels", {
    title: "Hotele",
    hotels: hotels.getHotelSummaries(),
    last_viewed_hotels,
  });
});

app.get("/view/:hotel_slug", (req, res) => {
  const hotel = hotels.getHotel(req.params.hotel_slug);
  hotel.author = user.getUser(hotel.author_id);
  if (hotel != null) {
    if (res.locals.app.cookie_consent) {
      let last_viewed_dirty = req.signedCookies[LAST_VIEWED_COOKIE] || [];
      let last_viewed = [
        hotel.hotel_slug,
        ...last_viewed_dirty
          .map((x) => parseInt(x, 10))
          .filter((x) => !isNaN(x) && x !== hotel.hotel_slug)
          .slice(0, 2),
      ];
      res.cookie(LAST_VIEWED_COOKIE, last_viewed, {
        httpOnly: true,
        secure: true,
        maxAge: ONE_MONTH,
        signed: true,
      });
    }
    res.render("hotel", {
      title: hotel.name,
      hotel,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/add_review/:hotel_slug", auth.login_required, (req, res) => {
  const hotel_slug = req.params.hotel_slug;

  if (!hotels.hasHotel(hotel_slug)) {
    return res.sendStatus(404);
  }

  const review_data = {
    front: req.body.front,
    back: req.body.back,
  };

  const errors = hotels.validateReviewData(review_data);

  if (errors.length === 0) {
    hotels.addReview(hotel_slug, review_data);
    return res.redirect(`/view/${hotel_slug}`);
  }

  const hotel = hotels.getHotel(hotel_slug);

  return res.status(400).render("new_review", {
    errors,
    title: "Nowa opinia",
    front: req.body.front,
    back: req.body.back,
    hotel: { id: hotel_slug },
  });
});

app.get("/add_review/:hotel_slug", auth.login_required, (req, res) => {
  res.redirect(`/view/${req.params.hotel_slug}`);
});

app.get("/new_hotel", auth.login_required, (req, res) => {
  if (!res.locals.user?.is_admin) {
    return res.status(403).redirect("/");
  }
  res.render("hotel_new", {
    title: "Nowy hotel",
  });
});

app.post("/new_hotel", auth.login_required, (req, res) => {
  if (!res.locals.user?.is_admin) {
    return res.status(403).redirect("/");
  }
  const hotel_name = req.body.name;
  var hotel_slug = null;
  var errors = hotels.validateHotelName(hotel_name);
  if (errors.length == 0) {
    hotel_slug = hotels.generateHotelSlug(hotel_name);
    if (hotels.hasHotel(hotel_slug)) {
      errors.push("hotel id is already taken");
    }
  }

  if (errors.length == 0) {
    hotels.addHotel(hotel_slug, hotel_name, res.locals.user);
    res.redirect(`/view/${hotel_slug}`);
  } else {
    res.status(400);
    res.render("hotel_new", {
      errors,
      title: "Nowy hotel",
      name: hotel_name,
    });
  }
});

app.get("/edit/:hotel_slug", auth.login_required, (req, res) => {
  const hotel_slug = req.params.hotel_slug;
  const errors = [];
  var hotel = hotels.getHotel(hotel_slug);
  if (hotel != null) {
    if (!res.locals.user?.is_admin) {
      return res.status(403).redirect("/");
    }
     else {
      res.render("manage_reviews", {
        errors,
        title: "Zarzadządzaj opiniami",
        hotel,
      });
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:hotel_slug", auth.login_required, (req, res) => {
  const hotel_slug = req.params.hotel_slug;
  if (hotels.hasHotel(hotel_slug)) {
    if (!res.locals.user?.is_admin) {
      return res.status(403).redirect("/");
    }
     else {
      const hotel_name = req.body.name;
      var new_hotel_slug = null;
      const errors = hotels.validateHotelName(hotel_name);
      if (errors.length == 0) {
        new_hotel_slug = hotels.generateHotelSlug(hotel_name);
        if (
          new_hotel_slug !== hotel_slug &&
          hotels.hasHotel(new_hotel_slug)
        ) {
          errors.push("hotel id is already taken");
        }
      }
      if (errors.length == 0) {
        const hotel = hotels.updateHotel(
          hotel_slug,
          new_hotel_slug,
          hotel_name,
        );
        if (hotel != null) {
          
          res.redirect("/view/" + hotel.slug);
        } else {
          
          res.write("Unexpected error while updating hotel");
          res.sendStatus(500);
        }
      } else {
        const hotel = hotels.getHotel(hotel_slug);
        res.render("manage_reviews", {
          errors,
          title: "Zarzadządzaj opiniami",
          hotel,
        });
      }
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  const hotel_slug = req.params.hotel_slug;
  const review_id = req.params.review_id;
  if (!hotels.hasHotel(hotel_slug) || !hotels.hasReview(review_id)) {
    res.sendStatus(404);
  } else {
    if (!res.locals.user?.is_admin) {
      return res.status(403).redirect("/");
    }
     else {
      const review = {
        front: req.body.front,
        back: req.body.back,
        id: review_id,
      };
      const errors = hotels.validateReviewData(review);
      if (errors.length == 0) {
        hotels.updateReview(review);
        res.redirect(`/edit/${hotel_slug}`);
      } else {
        let hotel = hotels.getHotel(hotel_slug);
        res.render("manage_reviews", {
          errors,
          title: "Zarzadządzaj opiniami",
          hotel,
        });
      }
    }
  }
});

app.post("/edit/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  res.redirect(`/edit/${req.params.hotel_slug}`);
});

app.post("/delete/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  const hotel_slug = req.params.hotel_slug;
  const review_id = req.params.review_id;
  if (!hotels.hasHotel(hotel_slug) || !hotels.hasReview(review_id)) {
    res.sendStatus(404);
  } else {
    if (!res.locals.user?.is_admin) {
      return res.status(403).redirect("/");
    }
     else {
      hotels.deleteReviewById(review_id);
      res.redirect(`/edit/${hotel_slug}`);
    }
  }
});

app.post("/edit/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  res.redirect(`/edit/${req.params.hotel_slug}`);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});