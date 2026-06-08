import "dotenv/config";
import { rmSync } from "node:fs";

// Skrypt można uruchamiać wiele razy, bo przed seedowaniem usuwa starą bazę.
rmSync("./db.sqlite", { force: true });

const user = (await import("../models/user.js")).default;
const hotels = (await import("../models/hotels.js")).default;

const hotelsData = {
  Mariott: {
    name: "Mariott",
    reviews: [
      {
        title: "Super pokoje",
        content: "Sed sed turpis eu tellus lacinia porttitor. Integer fringilla tellus ex, eu molestie purus iaculis in.",
      },
      {
        title: "Świetne jedzenie",
        content: "Pellentesque vel tempor ex, id condimentum tellus. In ut neque sagittis, ultricies neque eu, maximus eros.",
      },
    ],
  },
  Art: {
    name: "Art",
    reviews: [
      {
        title: "Już tu nie wrócę",
        content: "Nunc sit amet quam sed turpis molestie scelerisque.",
      },
      {
        title: "Lubię ten hotel",
        content: "Nullam velit sapien, sagittis eu enim ut, mollis aliquet erat.",
      },
    ],
  },
};

console.log("Populating db...");

const admin = await user.createUser("admin", "admin123");
const errMsg = user.addAttribute(admin.id, "is_admin", true);

if (errMsg) {
  console.error(errMsg);
}

const test = await user.createUser("test", "test12345");

Object.entries(hotelsData).forEach(([slug, data]) => {
  const hotel = hotels.addHotel(slug, data.name, test);

  for (const review of data.reviews) {
    hotels.addReview(hotel.slug, {
      ...review,
      author_id: test.id,
    });
  }
});

console.log("Done!");

