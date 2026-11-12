
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import "./PageSetting.css";

const queryKey = ["site-settings"];

const defaultSettings = {
  name: "TECH PLUS",
  description: "Premium Technology Brand for Modern Lifestyle",
  logo: "/src/assets/images/logo.png",
  favicon: "/favicon.ico",

  theme_primary: "#14A7CD",
  theme_secondary: "#146A96",
  theme_accent: "#FFFFFF",
  theme_font_sans: "'Inter', sans-serif",
  theme_font_display: "'Playfair Display', serif",

  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_tiktok: "",
  social_youtube: "",

  contact_phone: "",
  contact_vodaphone_cash: "",
  contact_whatsapp: "",
  contact_email: "",
  contact_address: "",
  contact_google_maps: "",
};

const sections = [
  {
    title: "General Settings",
    fields: [
      { name: "name", label: "Website Name" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "logo", label: "Logo Path" },
      { name: "favicon", label: "Favicon Path" },
    ],
  },
  {
    title: "Theme Settings",
    fields: [
      { name: "theme_primary", label: "Primary Color", type: "color" },
      { name: "theme_secondary", label: "Secondary Color", type: "color" },
      { name: "theme_accent", label: "Accent Color", type: "color" },
      { name: "theme_font_sans", label: "Sans Font" },
      { name: "theme_font_display", label: "Display Font" },
    ],
  },
  {
    title: "Social Media",
    fields: [
      { name: "social_facebook", label: "Facebook" },
      { name: "social_instagram", label: "Instagram" },
      { name: "social_twitter", label: "Twitter" },
      { name: "social_tiktok", label: "TikTok" },
      { name: "social_youtube", label: "YouTube" },
    ],
  },
  {
    title: "Contact Information",
    fields: [
      { name: "contact_phone", label: "Phone" },
      { name: "contact_vodaphone_cash", label: "Vodafone Cash" },
      { name: "contact_whatsapp", label: "WhatsApp" },
      { name: "contact_email", label: "Email" },
      { name: "contact_address", label: "Address" },
      { name: "contact_google_maps", label: "Google Maps URL" },
    ],
  },
];

const fetchSettings = async () => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data;
};

const PageSetting = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(defaultSettings);
  const [message, setMessage] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (data) {
      const updatedData = { ...defaultSettings };

      Object.keys(defaultSettings).forEach((key) => {
        updatedData[key] = data[key] ?? defaultSettings[key];
      });

      setFormData(updatedData);
    } else {
      setFormData(defaultSettings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      if (data?.id) {
        const { error } = await supabase
          .from("site_settings")
          .update(values)
          .eq("id", data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert([values]);

        if (error) throw error;
      }
    },

    onSuccess: async () => {
      setMessage("Settings saved successfully!");
      await queryClient.invalidateQueries({ queryKey });
    },

    onError: (error) => {
      setMessage(error.message || "Failed to save settings.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;

      const { error } = await supabase
        .from("site_settings")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
    },

    onSuccess: async () => {
      setFormData(defaultSettings);
      setMessage("Settings deleted successfully!");
      await queryClient.invalidateQueries({ queryKey });
    },

    onError: (error) => {
      setMessage(error.message || "Failed to delete settings.");
    },
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMessage("");
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (!data?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete all website settings?"
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset the form to the default settings?"
    );

    if (confirmed) {
      setFormData(defaultSettings);
      setMessage("Form reset to default values. Save to apply.");
    }
  };

  if (isLoading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  if (isError) {
    return (
      <div className="settings-error">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="page-setting">
      <div className="settings-header">
        <div>
          <h1>Website Settings</h1>
          <p>Manage your TECH PLUS website settings.</p>
        </div>

        <span className={data ? "settings-status active" : "settings-status empty"}>
          {data ? "Settings Active" : "No Settings Found"}
        </span>
      </div>

      <form onSubmit={handleSave}>
        {sections.map((section) => (
          <section className="settings-section" key={section.title}>
            <h2>{section.title}</h2>

            <div className="settings-grid">
              {section.fields.map((field) => (
                <div className="settings-field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      value={formData[field.name]}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value)
                      }
                      rows={3}
                    />
                  ) : field.type === "color" ? (
                    <div className="color-input-wrapper">
                      <input
                        id={field.name}
                        type="color"
                        value={formData[field.name]}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                      />
                      <span>{formData[field.name]}</span>
                    </div>
                  ) : (
                    <input
                      id={field.name}
                      type="text"
                      value={formData[field.name]}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}

        <div className="settings-actions">
          <button
            type="button"
            className="settings-reset"
            onClick={handleReset}
          >
            Reset Form
          </button>

          {data && (
            <button
              type="button"
              className="settings-delete"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Settings"}
            </button>
          )}

          <button
            type="submit"
            className="settings-save"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? "Saving..."
              : data
                ? "Save Changes"
                : "Create Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PageSetting;
