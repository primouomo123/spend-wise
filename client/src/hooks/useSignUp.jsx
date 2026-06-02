import { useState } from "react";
import axios from "axios";

const ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export default function useSignUp() {
  const [signUpError, setSignUpError] = useState(null);
  const [signUpIsLoading, setSignUpIsLoading] = useState(false);
  const [signUpUser, setSignUpUser] = useState(null);

  async function signUp(username, email, password) {
    setSignUpIsLoading(true);
    setSignUpError(null);
    setSignUpUser(null);

    try {
      const response = await axios.post(`${ENDPOINT}/signup`, {
        username,
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);

      setSignUpUser(response.data.user);

    }
    
    catch (err) {
      setSignUpError(
        err.response?.data?.error ||
        err.response?.data?.errors ||
        "An error occurred during sign up."
        );
      setSignUpUser(null);
    }
    
    finally {
      setSignUpIsLoading(false);
    }

  };

  return { signUp, signUpError, setSignUpError, signUpIsLoading, setSignUpIsLoading, signUpUser, setSignUpUser };
}