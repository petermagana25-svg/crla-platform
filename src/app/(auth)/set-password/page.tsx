import PasswordSetupForm from '@/components/auth/PasswordSetupForm';

export default function SetPasswordPage() {
  return (
    <PasswordSetupForm
      eyebrow="SECURE ACCESS"
      title="Set Your Password"
      description="Use the secure link from your email to create or update your password and continue to the CRLA platform."
      variant="invite"
    />
  );
}
