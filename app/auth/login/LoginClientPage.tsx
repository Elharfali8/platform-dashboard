import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

const LoginClientPage = () => {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center bg-surface px-4 py-10 sm:px-6 lg:px-10">
        <LoginForm />
      </div>

      <div className="main-gradient relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center lg:px-10">
        <div className="relative z-10 w-full max-w-xl">
          <Image
            src="/images/login-hero.png"
            alt="Login Hero"
            width={600}
            height={600}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginClientPage;
