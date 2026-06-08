import { DatabaseSync } from "node:sqlite";

const dbPath = "./db.sqlite";
const db = new DatabaseSync(dbPath);

// Model odpowiada za wszystkie operacje na hotelach i opiniach w bazie SQLite.
db.exec(`
  CREATE TABLE IF NOT EXISTS ht_users (
    user_id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    passhash TEXT,
    attributes TEXT DEFAULT NULL,
    created_at INTEGER
  ) STRICT;

  CREATE TABLE IF NOT EXISTS ht_hotels (
    hotel_id INTEGER PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES ht_users(user_id) ON DELETE NO ACTION
  ) STRICT;

  CREATE TABLE IF NOT EXISTS ht_reviews (
    review_id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES ht_hotels(hotel_id) ON DELETE NO ACTION,
    author_id INTEGER NOT NULL REFERENCES ht_users(user_id) ON DELETE NO ACTION,
    title TEXT NOT NULL,
    content TEXT NOT NULL
  ) STRICT;
`);

const dbOps = {
  insertHotel: db.prepare(`
    INSERT INTO ht_hotels (slug, name, author_id)
    VALUES (?, ?, ?)
    RETURNING hotel_id AS id, slug, name, author_id;
  `),
  updateHotelBySlug: db.prepare(`
    UPDATE ht_hotels
    SET slug = $new_slug, name = $new_name
    WHERE slug = $slug
    RETURNING hotel_id AS id, slug, name, author_id;
  `),
  deleteReviewsByHotelSlug: db.prepare(`
    DELETE FROM ht_reviews
    WHERE hotel_id = (SELECT hotel_id FROM ht_hotels WHERE slug = ?);
  `),
  deleteHotelBySlug: db.prepare("DELETE FROM ht_hotels WHERE slug = ?;"),

  insertReviewByHotelSlug: db.prepare(`
    INSERT INTO ht_reviews (hotel_id, author_id, title, content)
    VALUES (
      (SELECT hotel_id FROM ht_hotels WHERE slug = ?),
      ?,
      ?,
      ?
    )
    RETURNING review_id AS id, author_id, title, content;
  `),
  updateReviewById: db.prepare(`
    UPDATE ht_reviews
    SET title = ?, content = ?
    WHERE review_id = ?
    RETURNING review_id AS id, title, content;
  `),
  deleteReviewById: db.prepare("DELETE FROM ht_reviews WHERE review_id = ?;"),

  getHotelSummaries: db.prepare(`
    SELECT hotel_id AS id, slug, name, author_id
    FROM ht_hotels;
  `),
  getHotelSummaryById: db.prepare(`
    SELECT hotel_id AS id, slug, name, author_id
    FROM ht_hotels
    WHERE hotel_id = ?;
  `),
  getHotelBySlug: db.prepare(`
    SELECT hotel_id AS id, slug, name, author_id
    FROM ht_hotels
    WHERE slug = ?;
  `),
  getReviewById: db.prepare(`
    SELECT review_id AS id, hotel_id, author_id, title, content
    FROM ht_reviews
    WHERE review_id = ?;
  `),
  getReviewsByHotelId: db.prepare(`
    SELECT
      ht_reviews.review_id AS id,
      ht_reviews.author_id,
      ht_reviews.title,
      ht_reviews.content,
      ht_users.username
    FROM ht_reviews
    JOIN ht_users ON ht_reviews.author_id = ht_users.user_id
    WHERE ht_reviews.hotel_id = ?;
  `),
};

export function getHotelSummaries() {
  return dbOps.getHotelSummaries.all();
}

export function getHotelSummary(hotelId) {
  return dbOps.getHotelSummaryById.get(hotelId);
}

export function hasHotel(slug) {
  return dbOps.getHotelBySlug.get(slug) != null;
}

export function hasReview(reviewId) {
  return dbOps.getReviewById.get(reviewId) != null;
}

export function getReview(reviewId) {
  return dbOps.getReviewById.get(reviewId);
}

export function getHotel(slug) {
  const hotel = dbOps.getHotelBySlug.get(slug);

  if (hotel == null) {
    return null;
  }

  hotel.reviews = getReviews(hotel.id);
  return hotel;
}

export function getReviews(hotelId) {
  return dbOps.getReviewsByHotelId.all(hotelId);
}

export function addHotel(slug, name, author) {
  return dbOps.insertHotel.get(slug, name, author.id);
}

export function updateHotel(slug, newSlug, newName) {
  return dbOps.updateHotelBySlug.get({
    $slug: slug,
    $new_slug: newSlug,
    $new_name: newName,
  });
}

export function deleteHotelBySlug(slug) {
  dbOps.deleteReviewsByHotelSlug.run(slug);
  return dbOps.deleteHotelBySlug.run(slug);
}

// Dodaje opinię użytkownika do wybranego hotelu.
export function addReview(hotelSlug, review) {
  return dbOps.insertReviewByHotelSlug.get(
    hotelSlug,
    review.author_id,
    review.title,
    review.content,
  );
}

export function updateReview(review) {
  return dbOps.updateReviewById.get(review.title, review.content, review.id);
}

export function deleteReviewById(reviewId) {
  return dbOps.deleteReviewById.run(reviewId);
}

export function validateReviewData(review) {
  const errors = [];

  if (typeof review.title !== "string" || review.title.trim().length < 3 || review.title.trim().length > 100) {
    errors.push("Tytuł opinii powinien mieć od 3 do 100 znaków");
  }

  if (typeof review.content !== "string" || review.content.trim().length < 10 || review.content.trim().length > 500) {
    errors.push("Treść opinii powinna mieć od 10 do 500 znaków");
  }

  return errors;
}

export function validateHotelName(name) {
  const errors = [];

  if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 100) {
    errors.push("Nazwa hotelu powinna mieć od 3 do 100 znaków");
  }

  return errors;
}

export function generateHotelSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/(\s|[.-])+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default {
  getHotelSummaries,
  getHotelSummary,
  hasHotel,
  hasReview,
  getReview,
  getHotel,
  getReviews,
  addHotel,
  updateHotel,
  deleteHotelBySlug,
  addReview,
  updateReview,
  deleteReviewById,
  validateReviewData,
  validateHotelName,
  generateHotelSlug,
};
