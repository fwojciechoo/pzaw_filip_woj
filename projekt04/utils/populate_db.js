import "dotenv/config";
import user from "../models/user.js";
import hotels from "../models/hotels.js";

const hotelsData = {
  "Mariott": {
    name: "Mariott",
    reviews: [
      { front: "Super pokoje", back: "Sed sed turpis eu tellus lacinia porttitor. Integer fringilla tellus ex, eu molestie purus iaculis in." },
      { front: "Świetne jedzenie", back: "Pellentesque vel tempor ex, id condimentum tellus. In ut neque sagittis, ultricies neque eu, maximus eros." },
    ],
  },
  "Art": {
    name: "Art",
    reviews: [
      { front: "Już tu nie wroce", back: "Nunc sit amet quam sed turpis molestie scelerisque." },
      { front: "Lubie ten hotel", back: "Nullam velit sapien, sagittis eu enim ut, mollis aliquet erat." },
    ],
  },
};

console.log("Populating db...");

let admin = await user.createUser("admin", "admin123");
let errMsg = user.addAttribute(admin.id, "is_admin", true);
if (errMsg) {
  console.error(errMsg);
}

let test = await user.createUser("test", "test12345");

Object.entries(hotelsData).map(([slug, data]) => {
  let category = hotels.addHotel(slug, data.name, test);
  for (let review of data.reviews) {
    review.author_id = test.id;
    let c = hotels.addReview(category.slug, review);
  }
});

console.log("Done!");

