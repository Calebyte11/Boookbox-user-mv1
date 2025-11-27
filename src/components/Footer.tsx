import React from "react";
import { useLocation } from "react-router-dom";
import BackToTop from "./BackToTop";

const links = [
    { href: "/home", label: "Home", aria: "Home" },
    { href: "/about-us", label: "About Us", aria: "About Us" },
    { href: "/terms-of-service", label: "Terms of Service", aria: "Terms of Service" },
    { href: "/privacy-policy", label: "Privacy Policy", aria: "Privacy Policy" },
];

const Footer: React.FC = React.memo(() => {
    const location = useLocation();

    return (
        <footer className="w-full flex flex-col items-center justify-center p-4 mt-8 text-center text-gray-600">
            <BackToTop  className="z-50"/>
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
                    {links.map((link, idx) => (
                        <React.Fragment key={link.href}>
                            <a
                                href={link.href}
                                className={`hover:underline hover:text-[#FF7A00] transition-colors ${
                                    location.pathname === link.href ? "text-[#FF7A00] font-semibold underline" : ""
                                }`}
                                aria-label={link.aria}
                            >
                                {link.label}
                            </a>
                            {idx < links.length - 1 && <span>|</span>}
                        </React.Fragment>
                    ))}
                </div>
                <span className="block mt-2 text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} RENOWN COMMODITY TRADING. All rights reserved.
                </span>
            </div>
        </footer>
    );
});

export default Footer;
