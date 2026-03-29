
CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  room_number INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL
);
