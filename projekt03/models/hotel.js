
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotel_db"
});

export async function getBookings() {
  const [rows] = await pool.query(
    "SELECT id, guest_name, room_number, check_in, check_out FROM bookings ORDER BY id DESC"
  );
  return rows;
}

export async function addBooking(data) {
  await pool.query(
    "INSERT INTO bookings (guest_name, room_number, check_in, check_out) VALUES (?,?,?,?)",
    [data.guest_name, data.room_number, data.check_in, data.check_out]
  );
}
