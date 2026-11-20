export const business = {
  legalName: "Moz Delicious Foods",
  brandName: "Moz Deli Foods",
  tagline: "A Taste Worth Coming Back For.",
  address: "31031 Mocke Street, Daveyton, Benoni, 1501, Gauteng, South Africa",
  addressNote: "Next to McDonald's",
  phone: "+27 81 350 0712",
  whatsappNumber: "27813500712",
  provisionalEmail: "moz.delifoods@gmail.com",
  instagramUrl: "https://www.instagram.com/moz_delifoods/",
  googleBusinessUrl: "https://www.google.com/search?q=Moz+Delicious+Foods&kgmid=%2Fg%2F11hyp8n6xm",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=31031+Mocke+Street%2C+Daveyton%2C+Benoni%2C+Gauteng%2C+South+Africa",
  category: "Portuguese restaurant",
  listedServices: ["Reservations required", "All-you-can-eat", "Outdoor seating"],
  openingHours: null,
} as const;

export const orderingConfig = {
  enabled: false,
  delivery: { enabled: false, fee: null as number | null },
  collection: { enabled: false },
} as const;
