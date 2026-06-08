import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import user from "./models/user.js";
import hotels from "./models/hotels.js";
import settings from "./models/settings.js";
import session from "./models/session.js";
import auth from "./controllers/auth.js";

const port = process.env.PORT || 8000;
const LAST_VIEWED_COOKIE_PREFIX = "hotel-last-viewed";
const COOKIE_SECURE = process.env.NODE_ENV === "production";
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;
const SECRET = process.env.SECRET;

if (SECRET == null) {
  console.error(
    "SECRET environment variable missing. Please create an env file or provide SECRET via environment variables.",
  );
  process.exit(1);
}

function getLastViewedCookieName(currentUser) {
  return `${LAST_VIEWED_COOKIE_PREFIX}-${currentUser.id}`;
}

function getSignedCookieArray(req, name) {
  const value = req.signedCookies[name];
  return Array.isArray(value) ? value : [];
}

function renderNotFound(res) {
  return res.status(404).render("404", {
    title: "Nie znaleziono strony",
  });
}

function requireAdmin(res) {
  if (!res.locals.user?.is_admin) {
    res.status(403).redirect("/");
    return false;
  }

  return true;
}

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cookieParser(SECRET));

// Ustawienia, zgoda na cookies i sesja są dostępne w każdym widoku przez res.locals.
app.use(settings.settingsHandler);
app.use(session.sessionHandler);

const settingsRouter = express.Router();
settingsRouter.get("/toggle-theme", settings.themeToggle);
settingsRouter.get("/accept-cookies", settings.acceptCookies);
settingsRouter.get("/decline-cookies", settings.declineCookies);
settingsRouter.get("/manage-cookies", settings.manageCookies);
settingsRouter.post("/manage-cookies", settings.manageCookiesPost);
app.use("/settings", settingsRouter);

const authRouter = express.Router();
authRouter.get("/signup", auth.signup_get);
authRouter.post("/signup", auth.signup_post);
authRouter.get("/login", auth.login_get);
authRouter.post("/login", auth.login_post);
authRouter.get("/logout", auth.logout);
app.use("/auth", authRouter);

// Strona główna pokazuje listę hoteli i ostatnio oglądane hotele zalogowanego użytkownika.
app.get("/", (req, res) => {
  let last_viewed_hotels = null;

  if (res.locals.user && res.locals.app.cookie_consent) {
    const lastViewedCookieName = getLastViewedCookieName(res.locals.user);
    const lastViewed = getSignedCookieArray(req, lastViewedCookieName);

    last_viewed_hotels = lastViewed
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id))
      .map((id) => hotels.getHotelSummary(id))
      .filter((hotel) => hotel != null);
  }

  res.render("hotels", {
    title: "Hotele",
    hotels: hotels.getHotelSummaries(),
    last_viewed_hotels,
  });
});

// Szczegóły hotelu oraz opinie. Przy zaakceptowanych cookies zapisuje hotel jako ostatnio oglądany.
app.get("/view/:hotel_slug", (req, res) => {
  const hotel = hotels.getHotel(req.params.hotel_slug);

  if (hotel == null) {
    return renderNotFound(res);
  }

  hotel.author = user.getUser(hotel.author_id);

  if (res.locals.user && res.locals.app.cookie_consent) {
    const lastViewedCookieName = getLastViewedCookieName(res.locals.user);
    const lastViewedDirty = getSignedCookieArray(req, lastViewedCookieName);

    const lastViewed = [
      hotel.id,
      ...lastViewedDirty
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id !== hotel.id)
        .slice(0, 2),
    ];

    res.cookie(lastViewedCookieName, lastViewed, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      maxAge: ONE_MONTH,
      signed: true,
    });
  }

  res.render("hotel", {
    title: `Opinie o hotelu ${hotel.name}`,
    hotel,
  });
});

// Dodawanie opinii przez zalogowanego użytkownika.
app.post("/add_review/:hotel_slug", auth.login_required, (req, res) => {
  const hotelSlug = req.params.hotel_slug;

  if (!hotels.hasHotel(hotelSlug)) {
    return renderNotFound(res);
  }

  const reviewData = {
    title: req.body.title,
    content: req.body.content,
    author_id: res.locals.user.id,
  };

  const errors = hotels.validateReviewData(reviewData);

  if (errors.length === 0) {
    hotels.addReview(hotelSlug, reviewData);
    return res.redirect(`/view/${hotelSlug}`);
  }

  const hotel = hotels.getHotel(hotelSlug);
  hotel.author = user.getUser(hotel.author_id);

  return res.status(400).render("hotel", {
    errors,
    title: `Opinie o hotelu ${hotel.name}`,
    title_value: req.body.title,
    content_value: req.body.content,
    hotel,
  });
});

app.get("/add_review/:hotel_slug", auth.login_required, (req, res) => {
  res.redirect(`/view/${req.params.hotel_slug}`);
});

// Formularz dodawania hotelu, dostępny tylko dla administratora.
app.get("/new_hotel", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  res.render("hotel_new", {
    title: "Nowy hotel",
  });
});

// Dodanie nowego hotelu przez administratora.
app.post("/new_hotel", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  const hotelName = req.body.name;
  let hotelSlug = null;
  const errors = hotels.validateHotelName(hotelName);

  if (errors.length === 0) {
    hotelSlug = hotels.generateHotelSlug(hotelName);

    if (hotels.hasHotel(hotelSlug)) {
      errors.push("Hotel o takiej nazwie już istnieje");
    }
  }

  if (errors.length === 0) {
    hotels.addHotel(hotelSlug, hotelName, res.locals.user);
    return res.redirect(`/view/${hotelSlug}`);
  }

  return res.status(400).render("hotel_new", {
    errors,
    title: "Nowy hotel",
    name: hotelName,
  });
});

// Panel administratora do edycji hotelu i zarządzania opiniami.
app.get("/edit/:hotel_slug", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  const hotel = hotels.getHotel(req.params.hotel_slug);

  if (hotel == null) {
    return renderNotFound(res);
  }

  res.render("manage_reviews", {
    errors: [],
    title: "Zarządzaj opiniami",
    hotel,
  });
});

// Edycja nazwy hotelu przez administratora.
app.post("/edit/:hotel_slug", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  const hotelSlug = req.params.hotel_slug;

  if (!hotels.hasHotel(hotelSlug)) {
    return renderNotFound(res);
  }

  const hotelName = req.body.name;
  let newHotelSlug = null;
  const errors = hotels.validateHotelName(hotelName);

  if (errors.length === 0) {
    newHotelSlug = hotels.generateHotelSlug(hotelName);

    if (newHotelSlug !== hotelSlug && hotels.hasHotel(newHotelSlug)) {
      errors.push("Hotel o takiej nazwie już istnieje");
    }
  }

  if (errors.length === 0) {
    const hotel = hotels.updateHotel(hotelSlug, newHotelSlug, hotelName);

    if (hotel != null) {
      return res.redirect(`/view/${hotel.slug}`);
    }

    return res.status(500).send("Nieoczekiwany błąd podczas aktualizacji hotelu");
  }

  const hotel = hotels.getHotel(hotelSlug);

  return res.status(400).render("manage_reviews", {
    errors,
    title: "Zarządzaj opiniami",
    hotel,
  });
});

// Edycja opinii przez administratora.
app.post("/edit/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  const hotelSlug = req.params.hotel_slug;
  const reviewId = req.params.review_id;

  if (!hotels.hasHotel(hotelSlug) || !hotels.hasReview(reviewId)) {
    return renderNotFound(res);
  }

  const review = {
    title: req.body.title,
    content: req.body.content,
    id: reviewId,
  };

  const errors = hotels.validateReviewData(review);

  if (errors.length === 0) {
    hotels.updateReview(review);
    return res.redirect(`/edit/${hotelSlug}`);
  }

  const hotel = hotels.getHotel(hotelSlug);

  return res.status(400).render("manage_reviews", {
    errors,
    title: "Zarządzaj opiniami",
    hotel,
  });
});

// Usuwanie własnej opinii przez jej autora.
app.post("/delete_my_review/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  const hotelSlug = req.params.hotel_slug;
  const reviewId = req.params.review_id;

  if (!hotels.hasHotel(hotelSlug) || !hotels.hasReview(reviewId)) {
    return renderNotFound(res);
  }

  const review = hotels.getReview(reviewId);

  if (review.author_id !== res.locals.user.id) {
    return res.status(403).redirect(`/view/${hotelSlug}`);
  }

  hotels.deleteReviewById(reviewId);
  return res.redirect(`/view/${hotelSlug}`);
});

// Usuwanie dowolnej opinii przez administratora.
app.post("/delete/:hotel_slug/:review_id", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  const hotelSlug = req.params.hotel_slug;
  const reviewId = req.params.review_id;

  if (!hotels.hasHotel(hotelSlug) || !hotels.hasReview(reviewId)) {
    return renderNotFound(res);
  }

  hotels.deleteReviewById(reviewId);
  return res.redirect(`/edit/${hotelSlug}`);
});

// Usuwanie hotelu przez administratora.
app.post("/delete_hotel/:hotel_slug", auth.login_required, (req, res) => {
  if (!requireAdmin(res)) return;

  if (!hotels.hasHotel(req.params.hotel_slug)) {
    return renderNotFound(res);
  }

  hotels.deleteHotelBySlug(req.params.hotel_slug);
  return res.redirect("/");
});

app.use((req, res) => renderNotFound(res));

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
