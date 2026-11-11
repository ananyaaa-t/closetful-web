import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

/** "Continue with Google" button used on both login and signup forms.
 * Requires the Google provider to be enabled in the Supabase dashboard
 * (Authentication > Providers) — see `signInWithGoogle` for details. */
export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.1 14.7 2.2 12 2.2 6.9 2.2 2.7 6.5 2.7 11.8S6.9 21.4 12 21.4c6.9 0 9.6-4.9 9.6-7.4 0-.5 0-.9-.1-1.3H12Z"
          />
        </svg>
        Continue with Google
      </Button>
    </form>
  );
}
