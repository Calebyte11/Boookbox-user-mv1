import React from "react";
import { Calendar } from "lucide-react";
import ContactUsButton from "@/components/ContactUsButton";
import Footer from "@/components/Footer"
const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/80 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <h1 className="text-4xl font-bold">About Us</h1>
          </div>
          <div className="flex items-center text-orange-100">
            <Calendar className="w-4 h-4 mr-2" />
            <p className="text-lg">
              Everything you need to know about Boookbox
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            About Boookbox
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Boookbox is a brand product of Renown Commodity Trading (BN 8370555)
            duly registered with the corporate affairs commission of the
            Federal Republic of Nigeria. Fully designed and built as a PWA for
            cross platform accessibility, the app supports real-time
            notification of end user data in a secure web and mobile
            environment.
          </p>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Products and Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
            The Boookbox 4.0 PWA is our flagship product for social gifting and our current services include:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-6">
            <li>Meal ordering services for individuals, corporate bodies, and groups</li>
            <li>Meal sponsorship/gifting services to individuals, corporate bodies, and groups</li>
            <li>Meal delivery services</li>
            <li>Meal ticket customization services</li>
            <li>Social gifting promotional services</li>
            </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Creating an Account & System Requirements
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Onboarding on Boookbox is accessible from the URL{" "}
            <a
              href="https://boookbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-800 transition-colors"
            >
              boookbox.com 
            </a> for regular users and  <a
              href="https://restaurants.boookbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-800 transition-colors"
            >
              restaurants.boookbox.com 
            </a> for Kitchens/restaurants 
            {" "} and only requires a stable internet connection, a valid business email address and accurate location data on the application/platform. The app runs comfortably on web, tab and mobile interfaces across android, iOS devices as an installable app.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Security & Package Management
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Passworded accounts are the only permissible accounts allowed for
            restaurants/Kitchen registrations. Selling on Boookbox is both
            exciting and fun-filled; the system allows you to upload different
            meal packages of choice with preferred captions and unit selling
            rates.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Order Management & Processing
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Once onboarded, your kitchen/restaurants are discoverable by users
            globally as an active Kitchen where people can purchase and gift to
            recipients of choice. Our platform is embedded with a mobile scanner
            in addition to a ticket validation function to help you process and
            clear tickets before delivering meals.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Payment Processing
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            You are required to upload banking/payment details once you are
            signed up. Payments are processed by our payment partners (Paystack,
            Flutterwave) and are done as T+1 (a day after the transaction with
            the exception of weekends and public holidays that are not counted
            as working days by our payment partners. Payments during these
            periods are processed on the next working day promptly.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Service Charges & Refunds
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Boookbox charges are a minute of what you earn on every sale. Our
            current service rates are:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-6">
            <li>100 In Naira for transactions below 5000 in naira</li>
            <li>200 in Naira for transactions between 5000-9999</li>
            <li>An Additional 100 for every 5000 naira</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-6">
            When a ticket is not claimed due to unavailability of packages
            within the validity period of the ticket, the customer shall be
            refunded their payments excluding the Boookbox service charges. In
            cases where customers are at fault, kitchens are paid their full
            remuneration.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Contracts & Policies
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We do not execute contracts with Kitchens and do not require such
            from any Kitchen. Kindly refer to our {" "}
            <a
              href="https://boookbox.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-800 transition-colors"
            >
              Terms of Service 
            </a> {" "}
            and{" "}
            <a
              href="https://boookbox.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-800 transition-colors"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Contact Us Button */}
      <ContactUsButton />
      <Footer/>
    </div>
  );
};

export default AboutUs;
