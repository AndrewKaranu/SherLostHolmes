import { SignIn } from "@clerk/nextjs";
import AuthLayout from "@/components/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout title="Identify Yourself" subtitle="Access Req. Credentials">
      <div className="flex justify-center w-full">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-transparent p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "bg-concordia-burgundy hover:bg-burgundy-dark text-parchment font-display tracking-widest uppercase rounded-sm pixel-border shadow-pixel-sm",
              formFieldInput: "bg-white/80 border-2 border-wood-dark/20 focus:border-concordia-burgundy focus:ring-0 rounded-sm font-mono text-wood-dark",
              footer: "hidden"
            }
          }}
        />
      </div>
    </AuthLayout>
  );
}
