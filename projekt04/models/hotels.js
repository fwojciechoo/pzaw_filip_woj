import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(
  `CREATE TABLE IF NOT EXISTS fc_hotels (
    hotel_id    INTEGER PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    author_id     INTEGER NOT NULL REFERENCES fc_users(user_id) ON DELETE NO ACTION
  ) STRICT;
  CREATE TABLE IF NOT EXISTS fc_reviews (
    review_id       INTEGER PRIMARY KEY,
    hotel_id    INTEGER NOT NULL REFERENCES fc_hotels(hotel_id) ON DELETE NO ACTION,
    front         TEXT NOT NULL,
    back          TEXT NOT NULL
  ) STRICT;
    CREATE TABLE IF NOT EXISTS fc_users (
    user_id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    passhash TEXT,
    attributes TEXT DEFAULT NULL,
    created_at INTEGER
  ) STRICT;`,
   
);

const db_ops = {
  insert_hotel: db.prepare(
    `INSERT INTO fc_hotels (slug, name, author_id) 
     VALUES (?, ?, ?) RETURNING hotel_id as id, slug, name;`,
  ),
  update_hotel_by_slug: db.prepare(
    `UPDATE fc_hotels SET slug = $new_slug, name = $new_name 
      WHERE slug = $slug RETURNING hotel_id AS id, slug, name, author_id;`,
  ),
  insert_review_by_hotel_slug: db.prepare(
    `INSERT INTO fc_reviews (hotel_id, front, back) VALUES (
      (SELECT hotel_id FROM fc_hotels WHERE slug = ?),
      ?, 
      ?
    ) 
    RETURNING review_id AS id, front, back;`,
  ),
  get_hotel_summaries: db.prepare(
    "SELECT slug, name, author_id FROM fc_hotels;",
  ),
  get_hotel_summary_by_hotel_id: db.prepare(
    "SELECT slug, name, author_id FROM fc_hotels WHERE hotel_id = ?;",
  ),
  get_hotel_by_slug: db.prepare(
    "SELECT hotel_id AS id, slug, name, author_id FROM fc_hotels WHERE slug = ?;",
  ),
  get_review_by_id: db.prepare(
    "SELECT review_id AS id, front, back FROM fc_reviews WHERE review_id = ?;",
  ),
  update_review_by_id: db.prepare(
    "UPDATE fc_reviews SET front = ?, back = ? WHERE review_id = ? RETURNING review_id, front, back;",
  ),
  delete_review_by_id: db.prepare("DELETE FROM fc_reviews WHERE review_id = ?;"),
  get_reviews_by_hotel_id: db.prepare(
    "SELECT review_id AS id, front, back FROM fc_reviews WHERE hotel_id = ?;",
  ),
};

export function getHotelSummaries() {
  var hotels = db_ops.get_hotel_summaries.all();
  return hotels;
}

export function getHotelSummary(hotelId) {
  var hotels = db_ops.get_hotel_summary_by_hotel_id.get(hotelId);
  return hotels;
}

export function hasHotel(slug) {
  let hotel = db_ops.get_hotel_by_slug.get(slug);
  return hotel != null;
}

export function hasReview(reviewId) {
  let hotel = db_ops.get_review_by_id.get(reviewId);
  return hotel != null;
}

export function getHotel(slug) {
  let hotel = db_ops.get_hotel_by_slug.get(slug);
  if (hotel != null) {
    hotel.reviews = db_ops.get_reviews_by_hotel_id.all(hotel.id);

    return hotel;
  }

  return null;
}



export function addReview(hotelSlug, review) {
  return db_ops.insert_review_by_hotel_slug.get(
    hotelSlug,
    review.front,
    review.back,
  );
}

export function updateReview(review) {
  return db_ops.update_review_by_id.get(review.front, review.back, review.id);
}

export function deleteReviewById(reviewId) {
  return db_ops.delete_review_by_id.run(reviewId);
}

export function addHotel(slug, name, author) {
  return db_ops.insert_hotel.get(slug, name, author.id);
}

export function updateHotel(slug, newSlug, newName) {
  return db_ops.update_hotel_by_slug.get({
    $slug: slug,
    $new_slug: newSlug,
    $new_name: newName,
  });
}

export function validateReviewData(review) {
  var errors = [];
  var fields = ["front", "back"];
  for (let field of fields) {
    if (!review.hasOwnProperty(field)) errors.push(`Missing field '${field}'`);
    else {
      if (typeof review[field] != "string")
        errors.push(`'${field}' expected to be string`);
      else {
        if (review[field].length < 1 || review[field].length > 500)
          errors.push(`'${field}' expected length: 1-500`);
      }
    }
  }
  return errors;
}
export function validateHotelName(name) {
  var errors = [];
  if (typeof name != "string") {
    errors.push("Hotel name should be a string");
  } else {
    if (name.length < 3 || name.length > 100) {
      errors.push("Hotel name should have 3-100 characters");
    }
  }

  return errors;
}

export function generateHotelSlug(name) {
  const hotelId = name
    .toLowerCase()
    .replace(/(\s|[.-])+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

  return hotelId;
}

export function isAdmin(user) {
  return user?.is_admin === true;
}

export function canReview(user) {
  return user != null;
}



export default {
  getHotelSummaries,
  getHotelSummary,
  hasReview,
  hasHotel,
  getHotel,
  addReview,
  updateReview,
  deleteReviewById,
  addHotel,
  updateHotel,
  validateReviewData,
  validateHotelName,
  generateHotelSlug,
};
