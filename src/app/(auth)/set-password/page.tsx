import PasswordSetupForm from '@/components/auth/PasswordSetupForm';

export default function SetPasswordPage() {
  return (
    <PasswordSetupForm
      eyebrow="ACCOUNT ACTIVATION"
      title="Set Your Password"
      description="Finish your secure account setup to access the CRLA agent portal."
      variant="invite"
    />
  );
}
