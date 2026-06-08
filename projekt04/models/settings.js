"use strict";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;

// Bez prefiksu __Host-, bo projekt działa lokalnie na http://localhost.
const THEME_COOKIE = "hotel-theme";
const CONSENT_COOKIE = "hotel-consent";
const COOKIE_SECURE = process.env.NODE_ENV === "production";

const CONSENT_PARAMS = {
  maxAge: ONE_MONTH,
  secure: COOKIE_SECURE,
  httpOnly: true,
  sameSite: "lax",
};

export function themeToggle(req, res) {
  const theme = req.cookies[THEME_COOKIE] === "dark" ? "light" : "dark";

  res.cookie(THEME_COOKIE, theme, {
    maxAge: ONE_MONTH,
    secure: COOKIE_SECURE,
    sameSite: "lax",
  });

  res.redirect(req.query.next || "/");
}

export function acceptCookies(req, res) {
  res.cookie(CONSENT_COOKIE, true, CONSENT_PARAMS);
  res.redirect(req.query.next || "/");
}

export function declineCookies(req, res) {
  res.cookie(CONSENT_COOKIE, false, CONSENT_PARAMS);
  res.redirect(req.query.next || "/");
}

export function manageCookies(req, res) {
  res.render("cookies_manage", {
    title: "Zarządzanie cookies",
  });
}

export function manageCookiesPost(req, res) {
  if (req.body.cookie_consent === "true") {
    res.cookie(CONSENT_COOKIE, true, CONSENT_PARAMS);
  } else {
    res.cookie(CONSENT_COOKIE, false, CONSENT_PARAMS);
  }

  res.redirect("/");
}

export function getSettings(req) {
  const appSettings = {
    theme: req.cookies[THEME_COOKIE] || "light",
    cookie_consent: req.cookies[CONSENT_COOKIE] || null,
  };

  if (appSettings.cookie_consent != null) {
    appSettings.cookie_consent = appSettings.cookie_consent === "true";
  }

  return appSettings;
}

// Middleware udostępnia ustawienia motywu, cookies i ścieżki strony w widokach EJS.
function settingsHandler(req, res, next) {
  res.locals.app = getSettings(req);
  res.locals.page = req.path;

  if (res.locals.app.cookie_consent != null) {
    res.cookie(CONSENT_COOKIE, res.locals.app.cookie_consent, CONSENT_PARAMS);
  }

  next();
}

export default {
  themeToggle,
  acceptCookies,
  declineCookies,
  manageCookies,
  manageCookiesPost,
  getSettings,
  settingsHandler,
};
