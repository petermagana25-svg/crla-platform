import PasswordSetupForm from '@/components/auth/PasswordSetupForm';

export default function ResetPasswordPage() {
  return (
    <PasswordSetupForm
      eyebrow="PASSWORD RESET"
      title="Choose a New Password"
      description="Use the secure link from your email to update your password and sign back in."
      variant="recovery"
    />
  );
}
