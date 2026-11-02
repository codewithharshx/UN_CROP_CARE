export const SITE = {
  name: "UN CROP CARE",
  tagline: "Working Together, Prosper Together.",
  taglineMr: "एकत्र काम करूया, एकत्र प्रगती करूया.",
  promiseMr: "शेतकऱ्यांच्या सेवेसाठी सदैव तत्पर",
  mission: "Working to help more farmers move towards organic farming.",
  phone: "0788 732 7272",
  phoneHref: "tel:+917887327272",
  whatsapp: "+91 788 732 7272",
  whatsappHref: "https://wa.me/917887327272",
  email: "info@uncropcare.in",
  facebook: "https://www.facebook.com/uncropcare/",
};

export const waLink = (text: string) =>
  `${SITE.whatsappHref}?text=${encodeURIComponent(text)}`;
