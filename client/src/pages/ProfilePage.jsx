import { useEffect, useState, useMemo } from "react";
import { Camera, Save, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

  const eloHistory = useMemo(() => {
    const currentRating = user?.rating || 1200;
    const history = [];
    let trend = currentRating - 200;
    for(let i = 1; i <= 10; i++) {
       history.push({
         match: `M${i}`,
         rating: Math.round(trend)
       });
       trend += Math.random() * 50 - 10; 
    }
    history.push({ match: 'Now', rating: currentRating });
    return history;
  }, [user?.rating]);

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
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] max-w-6xl mx-auto py-6">
      <div className="space-y-6">
        <section className="arena-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Activity size={100} />
          </div>
          <div className="text-xs uppercase tracking-[0.24em] text-paper-200/50 font-bold mb-8">Identity</div>
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-arena-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-arena-500/30 bg-black/60 relative z-10 shadow-[inset_0_0_20px_rgba(61,217,184,0.1)]">
                {values.avatarUrl ? (
                  <img src={values.avatarUrl} alt={values.username} className="h-full w-full object-cover" />
                ) : (
                  <Camera className="text-paper-200/30" size={40} />
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-arena-950 border border-arena-500/50 rounded-full flex items-center justify-center text-arena-400 font-bold text-sm shadow-xl z-20">
                 {user?.level || 1}
              </div>
            </div>
            
            <div className="mt-8 text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-paper-200/70">{values.username || "Anonymous"}</div>
            <div className="mt-1 text-sm font-mono text-arena-400">{values.email || "No email provided"}</div>
            
            <div className="mt-6 pt-6 border-t border-white/10 w-full flex justify-center gap-8">
               <div className="text-center">
                 <div className="text-[10px] uppercase tracking-widest text-paper-200/50 font-bold mb-1">Rating</div>
                 <div className="text-2xl font-black text-white">{user?.rating || 1200}</div>
               </div>
               <div className="text-center">
                 <div className="text-[10px] uppercase tracking-widest text-paper-200/50 font-bold mb-1">Matches</div>
                 <div className="text-2xl font-black text-white">{user?.totalMatches || 0}</div>
               </div>
            </div>
            
            <p className="mt-6 bg-black/30 rounded-2xl p-4 text-sm leading-relaxed text-paper-200/70 border border-white/5 w-full text-left italic">
              "{values.bio || "No bio set. Add a short bio so other players can recognize you in the arena."}"
            </p>
          </div>
        </section>

        {/* ELO Graph */}
        <section className="arena-panel p-6 relative overflow-hidden h-64 flex flex-col border-arena-500/20 shadow-[0_0_30px_rgba(61,217,184,0.05)]">
           <div className="text-xs uppercase tracking-[0.24em] text-paper-200/50 font-bold mb-2 z-10 relative flex justify-between items-center">
             <span>ELO History</span>
             <span className="text-arena-400">+{Math.round(eloHistory[eloHistory.length-1].rating - eloHistory[0].rating)}</span>
           </div>
           
           <div className="flex-1 w-full mt-2 relative z-10 -ml-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eloHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3dd9b8" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3dd9b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(7, 17, 29, 0.9)', borderColor: 'rgba(61, 217, 184, 0.3)', borderRadius: '12px' }}
                    itemStyle={{ color: '#3dd9b8', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="rating" stroke="#3dd9b8" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </section>
      </div>

      <section className="arena-panel p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-paper-200/50 font-bold">Preferences</div>
        <h1 className="mt-2 text-3xl font-black">Profile Settings</h1>
        <p className="mt-2 text-paper-200/65 text-sm">Update your public identity, contact details, and personalization settings.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="group">
            <label className="mb-2 block text-[11px] uppercase font-bold tracking-widest text-paper-200/60 group-focus-within:text-arena-400 transition-colors">Username</label>
            <input className="arena-input bg-black/40 border-white/10 focus:border-arena-500/50 focus:bg-arena-500/5" name="username" value={values.username} onChange={handleChange} minLength={3} required />
          </div>

          <div className="group">
            <label className="mb-2 block text-[11px] uppercase font-bold tracking-widest text-paper-200/60 group-focus-within:text-arena-400 transition-colors">Email Address</label>
            <input className="arena-input bg-black/40 border-white/10 focus:border-arena-500/50 focus:bg-arena-500/5 font-mono text-sm" name="email" type="email" value={values.email} onChange={handleChange} required />
          </div>

          <div className="group">
            <label className="mb-2 block text-[11px] uppercase font-bold tracking-widest text-paper-200/60 group-focus-within:text-arena-400 transition-colors">Avatar Image URL</label>
            <input className="arena-input bg-black/40 border-white/10 focus:border-arena-500/50 focus:bg-arena-500/5 text-sm" name="avatarUrl" value={values.avatarUrl} onChange={handleChange} placeholder="https://example.com/avatar.png" />
          </div>

          <div className="group">
            <label className="mb-2 block text-[11px] uppercase font-bold tracking-widest text-paper-200/60 group-focus-within:text-arena-400 transition-colors">Personal Bio</label>
            <textarea className="arena-input min-h-[140px] bg-black/40 border-white/10 focus:border-arena-500/50 focus:bg-arena-500/5 resize-none" name="bio" value={values.bio} onChange={handleChange} maxLength={240} />
            <div className="mt-2 flex justify-end text-[10px] font-mono text-paper-200/40">
              <span className={values.bio.length > 200 ? "text-flame-400" : ""}>{values.bio.length}</span>/240
            </div>
          </div>

          {message ? <div className="rounded-2xl border border-arena-500/25 bg-arena-500/10 px-5 py-4 text-sm font-bold text-arena-400 flex justify-center">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-flame-500/25 bg-flame-500/10 px-5 py-4 text-sm font-bold text-flame-300 flex justify-center">{error}</div> : null}

          <div className="pt-4 border-t border-white/5">
             <button className="arena-button-primary w-full py-4 text-lg justify-center shadow-[0_0_20px_rgba(61,217,184,0.15)] hover:shadow-[0_0_30px_rgba(61,217,184,0.3)] transition-all" type="submit" disabled={saving}>
               <Save size={20} />
               {saving ? "Deploying Changes..." : "Save Identity"}
             </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
