
import { supabase } from "./supabase";

const { data, error } = await supabase
  .from("site_settings")
  .select("*")
  .single();

if (error) {
  console.error("Error fetching site settings:", error);
}

export const siteSettings = {
  name: data?.name || "TECH PLUS",
  description: data?.description || "",
  logo: data?.logo || "/src/assets/images/logo.png",
  favicon: data?.favicon || "/favicon.ico",

  theme: {
    primary: data?.theme_primary || "#14A7CD",
    secondary: data?.theme_secondary || "#146A96",
    accent: data?.theme_accent || "#FFFFFF",
    fontSans: data?.theme_font_sans || "'Inter', sans-serif",
    fontDisplay: data?.theme_font_display || "'Playfair Display', serif",
  },

  social: {
    facebook: data?.social_facebook || "",
    instagram: data?.social_instagram || "",
    twitter: data?.social_twitter || "",
    tiktok: data?.social_tiktok || "",
    youtube: data?.social_youtube || "",
  },

  contact: {
    phone: data?.contact_phone || "",
    vodaphoneCash: data?.contact_vodaphone_cash || "",
    whatsapp: data?.contact_whatsapp || "",
    email: data?.contact_email || "",
    address: data?.contact_address || "",
    googleMaps: data?.contact_google_maps || "",
  },
};
