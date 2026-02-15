import { FaWhatsapp } from "react-icons/fa";
import { LINKS } from "../constants/links";

export function WhatsAppFloat() {
  return (
    <a
      href={LINKS.WHATSAPP_GROUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[#25D366] p-4 text-white shadow-lg transition-all duration-300 hover:bg-[#20BA5A] hover:shadow-xl"
      aria-label="Join WhatsApp Group"
    >
      <FaWhatsapp className="text-3xl" />
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Join WhatsApp Group
      </span>
    </a>
  );
}
