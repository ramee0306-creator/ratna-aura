import { Redirect } from 'expo-router';

// Google sign-in returns here. The login itself is completed in AuthProvider;
// this page just sends the user on to the right screen.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
