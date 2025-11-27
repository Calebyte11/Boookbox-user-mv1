import React from "react";
import BrandTitle from "@/components/BrandTitle";
import Button from "@/components/Button";
import WelcomeModal from "@/components/WelcomeModal";
import useWelcomeModal from "@/hooks/useWelcomeModal";
import splash_image from "@/assets/images/splashScreenImage.jpg";
import splash from "@/assets/images/splash-2.jpg";
import { useNavigate } from "react-router-dom";
// import AuthRedirect from "@/components/AuthRedirect";
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, closeModal } = useWelcomeModal();

  return (
    // <AuthRedirect>
    <>
      <WelcomeModal isOpen={isOpen} onClose={closeModal} />
      <section className="flex flex-col h-screen md:flex-row overflow-hidden">
      {/* Left side - Content */}
      <div className="flex flex-col mx-6 md:mx-0 z-10 md:w-1/2 md:justify-center md:items-center md:bg-[#f8f6f9]">
        <div className="md:max-w-md md:w-full md:mx-6">
          <BrandTitle
            title="BoookBox"
            description="order, gift, redeem meal tickets and more around the world"
            className="text-center mb-12 mt-[4rem] md:mt-0 flex flex-col items-center justify-center"
            titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
            descriptionClassName="text-lg text-black font-mf"
            brandImg={true}
          />
          <div className="flex flex-col gap-4">
            <Button
              className="bg-primary h-14 rounded-xl hover:bg-primary/90 transition-colors"
              handleClick={() => navigate("/auth/signup")}
            >
              <span className="text-white font-medium">Create an Account</span>
            </Button>
            <div className="text-center py-2">
              <span className="text-gray-600">Already have an Account?</span>
            </div>
            <Button
              className="border-2 border-primary h-14 rounded-xl hover:bg-primary/10 transition-colors"
              handleClick={() => navigate("/auth/login")}
            >
              <span className="text-primary font-medium">Sign In</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex md:w-1/2 md:h-screen md:items-center md:justify-center">
        <img
          src={splash_image}
          alt="Illustration"
          className="md:hidden object-contain mt-[-8rem] z-auto"
         
        />
        <img
          src={splash}
          alt="Illustration"
          className="md:w-full md:p-8 object-contain md:mt-auto z-auto md:block hidden"
         
        />
      </div>
    </section>
    </>
    // </AuthRedirect>
  );
};

export default AuthPage;
