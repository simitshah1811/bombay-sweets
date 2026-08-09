export const business = {
  name: "Bombay Sweets",
  legalName: "The Bombay Sweets",
  tagline: "Real Indian sweets, chaat & tandoori — made fresh daily in Port Coquitlam.",
  address: {
    street: "2803 Shaughnessy St",
    city: "Port Coquitlam",
    region: "BC",
    postalCode: "V3C 3H1",
    country: "Canada",
  },
  addressLine: "2803 Shaughnessy St, Port Coquitlam, BC V3C 3H1",
  phone: "604 941 1993",
  phoneHref: "tel:+16049411993",
  fax: "604 783 8921",
  email: "info@bombaysweet.ca",
  hours: [
    { days: "Monday – Saturday", time: "10:00 AM – 8:00 PM" },
    { days: "Sunday", time: "10:00 AM – 7:30 PM" },
  ],
  mapsHref:
    "https://www.google.com/maps/dir/?api=1&destination=The+Bombay+Sweets+2803+Shaughnessy+St%2C+Port+Coquitlam%2C+BC+V3C+3H1%2C+Canada",
} as const;
