import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login, consumeSessionNotice } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const notice = consumeSessionNotice();
    if (notice) {
      setError(notice);
    }
  }, [consumeSessionNotice]);

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(values);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to queue for live coding duels, chase rating, and climb the arena ladder."
        fields={[
          { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "Enter your password", autoComplete: "current-password" },
        ]}
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Login"
        error={error}
        footer={
          <>
            New to the arena?{" "}
            <Link className="font-semibold text-arena-400" to="/signup">
              Create an account
            </Link>
          </>
        }
      />
    </div>
  );
}

export default LoginPage;
