import { useEffect, useState } from "react";
import { Camera, Save } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [values, setValues] = useState({
    username: "",
    email: "",
    avatarUrl: "",
    bio: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues({
      username: user?.username || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateProfile(values);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <section className="arena-panel p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-paper-200/45">Profile Preview</div>
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-arena-900/80">
            {values.avatarUrl ? (
              <img src={values.avatarUrl} alt={values.username} className="h-full w-full object-cover" />
            ) : (
              <Camera className="text-paper-200/40" size={32} />
            )}
          </div>
          <div className="mt-4 text-2xl font-bold">{values.username || "Your username"}</div>
          <div className="mt-1 text-paper-200/60">{values.email || "your@email.com"}</div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-paper-200/65">
            {values.bio || "Add a short bio so other players can recognize you in the arena."}
          </p>
        </div>
      </section>

      <section className="arena-panel p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-paper-200/45">Edit Profile</div>
        <h1 className="mt-3 text-3xl font-bold">Profile Settings</h1>
        <p className="mt-2 text-paper-200/65">Update your username, email, avatar, and personal bio.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-paper-200/60">Username</label>
            <input className="arena-input" name="username" value={values.username} onChange={handleChange} minLength={3} required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-paper-200/60">Email</label>
            <input className="arena-input" name="email" type="email" value={values.email} onChange={handleChange} required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-paper-200/60">Avatar URL</label>
            <input className="arena-input" name="avatarUrl" value={values.avatarUrl} onChange={handleChange} placeholder="https://example.com/avatar.png" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-paper-200/60">Bio</label>
            <textarea className="arena-input min-h-32" name="bio" value={values.bio} onChange={handleChange} maxLength={240} />
            <div className="mt-2 text-xs text-paper-200/45">{values.bio.length}/240 characters</div>
          </div>

          {message ? <div className="rounded-2xl border border-arena-500/25 bg-arena-500/10 px-4 py-3 text-sm text-arena-400">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

          <button className="arena-button-primary gap-2" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
