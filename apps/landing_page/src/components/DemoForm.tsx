import { useState, type FormEvent } from "react";
import { submitContactForm, type ContactFormRequest } from "../services/api";

const DemoForm = () => {
  const [formData, setFormData] = useState<ContactFormRequest>({
    name: "",
    role: "",
    school_name: "",
    email: "",
    phone: "",
    message: "",
    form_type: "demo_form",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
      phone
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formData.role) {
      errors.role = "Please select your role";
    }
    if (!formData.school_name.trim()) {
      errors.school_name = "School name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await submitContactForm(formData);

      if (response.success) {
        setSuccess(true);
        setFormData({
          name: "",
          role: "",
          school_name: "",
          email: "",
          phone: "",
          message: "",
          form_type: "demo_form",
        });
        setFieldErrors({});
        // Auto-close success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to submit demo request");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-blue-100 p-8 shadow-md">
      <h3 className="mb-6 text-2xl font-bold text-gray-900">Book a Demo</h3>

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">
            Thank you! We&apos;ll get back to you shortly.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (fieldErrors.name) {
                setFieldErrors({ ...fieldErrors, name: "" });
              }
            }}
            className={`w-full rounded-lg border bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44] ${
              fieldErrors.name ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value });
              if (fieldErrors.role) {
                setFieldErrors({ ...fieldErrors, role: "" });
              }
            }}
            className={`w-full rounded-lg border bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44] ${
              fieldErrors.role ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          >
            <option value="">Select your role</option>
            <option value="School Leader">School Leader</option>
            <option value="Academic Coordinator">Academic Coordinator</option>
            <option value="Principal">Principal</option>
            <option value="Teacher">Teacher</option>
            <option value="Other">Other</option>
          </select>
          {fieldErrors.role && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
          )}
        </div>

        {/* School Name */}
        <div>
          <label
            htmlFor="school_name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            School Name *
          </label>
          <input
            type="text"
            id="school_name"
            value={formData.school_name}
            onChange={(e) => {
              setFormData({ ...formData, school_name: e.target.value });
              if (fieldErrors.school_name) {
                setFieldErrors({ ...fieldErrors, school_name: "" });
              }
            }}
            className={`w-full rounded-lg border bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44] ${
              fieldErrors.school_name ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {fieldErrors.school_name && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.school_name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: "" });
              }
            }}
            className={`w-full rounded-lg border bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44] ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (fieldErrors.phone) {
                setFieldErrors({ ...fieldErrors, phone: "" });
              }
            }}
            className={`w-full rounded-lg border bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44] ${
              fieldErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+91 1234567890"
            disabled={loading}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Message (Optional)
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#0A1F44]"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Request Demo"}
        </button>
      </form>
    </div>
  );
};

export default DemoForm;
