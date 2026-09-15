import { View } from "react-native";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import type { ConfirmationResult, User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { mapFirebaseError } from "../../utils/errors";

export function createRecaptchaVerifier(
  container: View,
): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, container, {
    size: "invisible",
    callback: () => {
      // Le callback est géré automatiquement par Firebase.
    },
  });
}

export async function sendPhoneCode(
  phoneNumber: string,
  verifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function verifyPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> {
  try {
    const credential = await confirmation.confirm(code);
    return credential.user;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
