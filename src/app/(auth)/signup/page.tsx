import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your EatOmics account and start your meal subscription.",
};

export default function SignupPage() {
  return <SignupForm />;
}
