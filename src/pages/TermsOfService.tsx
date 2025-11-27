import React from "react";
import {
  FileText,
  Shield,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
//   ExternalLink,
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import ContactUsButton from "@/components/ContactUsButton";
import Footer from "@/components/Footer";

const TermsOfService: React.FC = () => {
  const sections = [
    {
      id: "overview",
      title: "Overview",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            This website is operated by{" "}
            <strong>RENOWN COMMODITY TRADING</strong>. Throughout the site, the
            terms "we", "us" and "our" refer to RENOWN COMMODITY TRADING. We
            offer this website, including all information, tools and services
            available from this site to you, the user, conditioned upon your
            acceptance of all terms, conditions, policies and notices stated
            here.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By visiting our site and/or purchasing something from us, you engage
            in our "Service" and agree to be bound by the following terms and
            conditions ("Terms of Service", "Terms"), including those additional
            terms and conditions and policies referenced herein and/or available
            by hyperlink.
          </p>
          <div className="bg-orange-50 border-l-4 border-[#FF7A00] p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> Please read these Terms of Service
              carefully before accessing or using our website. By accessing or
              using any part of the site, you agree to be bound by these Terms
              of Service.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "online-store",
      title: "Online Store Terms",
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            By agreeing to these Terms of Service, you represent that you are at
            least the age of majority in your state or province of residence, or
            that you are the age of majority in your state or province of
            residence and you have given us your consent to allow any of your
            minor dependents to use this site.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Prohibited Uses
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Any illegal or unauthorized purpose</li>
              <li>• Violating any laws in your jurisdiction</li>
              <li>• Transmitting worms, viruses or destructive code</li>
            </ul>
          </div>
          <p className="text-gray-700 leading-relaxed">
            A breach or violation of any of the Terms will result in an
            immediate termination of your Services.
          </p>
        </div>
      ),
    },
    {
      id: "general-conditions",
      title: "General Conditions",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to refuse service to anyone for any reason at
            any time. You understand that your content (not including credit
            card information), may be transferred unencrypted and involve
            transmissions over various networks and changes to conform to
            technical requirements.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              Security Notice
            </h4>
            <p className="text-sm text-green-700">
              Credit card information is always encrypted during transfer over
              networks.
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            You agree not to reproduce, duplicate, copy, sell, resell or exploit
            any portion of the Service without express written permission by us.
          </p>
        </div>
      ),
    },
    {
      id: "accuracy-information",
      title: "Accuracy, Completeness and Timeliness of Information",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We are not responsible if information made available on this site is
            not accurate, complete or current. The material on this site is
            provided for general information only and should not be relied upon
            or used as the sole basis for making decisions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Any reliance on the material on this site is at your own risk. We
            reserve the right to modify the contents of this site at any time,
            but we have no obligation to update any information on our site.
          </p>
        </div>
      ),
    },
    {
      id: "service-modifications",
      title: "Modifications to the Service and Prices",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Prices for our products are subject to change without notice. We
            reserve the right at any time to modify or discontinue the Service
            (or any part or content thereof) without notice at any time.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We shall not be liable to you or to any third-party for any
            modification, price change, suspension or discontinuance of the
            Service.
          </p>
        </div>
      ),
    },
    {
      id: "products-services",
      title: "Products or Services",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Certain products or services may be available exclusively online
            through the website. These products or services may have limited
            quantities and are subject to return or exchange only according to
            our Return Policy.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right, but are not obligated, to limit the sales of
            our products or services to any person, geographic region or
            jurisdiction. We may exercise this right on a case-by-case basis.
          </p>
        </div>
      ),
    },
    {
      id: "prohibited-uses",
      title: "Prohibited Uses",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            In addition to other prohibitions as set forth in the Terms of
            Service, you are prohibited from using the site or its content for:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Legal Violations
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Any unlawful purpose</li>
                <li>• Violating regulations or laws</li>
                <li>• Infringing intellectual property rights</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Harmful Activities
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Harassing or discriminating</li>
                <li>• Uploading malicious code</li>
                <li>• Collecting personal information</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "disclaimer",
      title: "Disclaimer of Warranties",
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Important Disclaimer
            </h4>
            <p className="text-sm text-yellow-700">
              We do not guarantee that your use of our service will be
              uninterrupted, timely, secure or error-free. The service is
              provided "as is" and "as available" without any warranties.
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            We shall not be liable for any injury, loss, claim, or damages of
            any kind, including lost profits, lost revenue, lost savings, loss
            of data, replacement costs, or any similar damages arising from your
            use of the service.
          </p>
        </div>
      ),
    },
    {
      id: "governing-law",
      title: "Governing Law",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            These Terms of Service and any separate agreements whereby we
            provide you services shall be governed by and construed in
            accordance with the laws of <strong>Nigeria</strong>.
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: <Mail className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            Questions about the Terms of Service should be sent to us through
            any of the following channels:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-[#FF7A00] mr-2" />
                <h4 className="font-semibold text-gray-800">Email</h4>
              </div>
              <a
                href="mailto:officialboookbox@gmail.com"
                className="text-[#FF7A00] hover:text-[#FF7A00]/80 transition-colors"
              >
                officialboookbox@gmail.com
              </a>
            </div>
            <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Phone className="w-5 h-5 text-[#FF7A00] mr-2" />
                <h4 className="font-semibold text-gray-800">Phone</h4>
              </div>
              <div className="space-y-1">
                <p className="text-gray-700">+234 814 245 4106</p>
                <p className="text-gray-700">+234 706 581 3394</p>
              </div>
            </div>
          </div>
          <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 text-[#FF7A00] mr-2" />
              <h4 className="font-semibold text-gray-800">Address</h4>
            </div>
            <p className="text-gray-700">
              RENOWN COMMODITY TRADING
              <br />
              Pat Coll Drive, Igando
              <br />
              Lagos 102213, Nigeria
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/80 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <div className="flex items-center text-orange-100">
            <Calendar className="w-4 h-4 mr-2" />
            <p className="text-lg">Last updated: July 22, 2025</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Accordion.Root type="single" collapsible className="w-full">
            {sections.map((section) => (
              <Accordion.Item
                key={section.id}
                value={section.id}
                className="border-b last:border-b-0"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center">
                      <div className="text-[#FF7A00] mr-3">{section.icon}</div>
                      <h2 className="text-lg font-semibold text-gray-800 group-hover:text-[#FF7A00] transition-colors">
                        {section.title}
                      </h2>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF7A00] transition-all group-data-[state=open]:rotate-90" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-6 pb-6 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
                  {section.content}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Footer Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                Changes to Terms
              </h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                We reserve the right to update, change or replace any part of
                these Terms of Service by posting updates and changes to our
                website. It is your responsibility to check this page
                periodically for changes. Your continued use of or access to our
                website following the posting of any changes constitutes
                acceptance of those changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Us Button */}
      <ContactUsButton />
      <Footer/>
    </div>
  );
};

export default TermsOfService;
