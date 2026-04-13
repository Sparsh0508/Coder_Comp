import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthForm from "../components/AuthForm";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(values);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Create your arena identity"
        subtitle="Register once, then jump straight into head-to-head coding battles."
        fields={[
          { name: "username", label: "Username", type: "text", placeholder: "arena_champion", autoComplete: "username" },
          { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "Create a strong password", autoComplete: "new-password" },
        ]}
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Create account"
        error={error}
        footer={
          <>
            Already registered?{" "}
            <Link className="font-semibold text-arena-400 hover:text-arena-500 transition-colors" to="/login">
              Log in here
            </Link>
          </>
        }
      />
    </AuthLayout>
  );
}

export default SignupPage;
