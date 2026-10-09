// import { zodResolver } from "@hookform/resolvers/zod";
// import { ArrowRight, CarFront, Eye, EyeOff, ShieldCheck } from "lucide-react";
// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { Link, useNavigate } from "react-router-dom";
// import { z } from "zod";
// import { api } from "../../services/api";
// import { useAuthStore } from "../../store/authStore";

// const schema = z.object({
//   email: z.string().email("Enter a valid email"),
//   password: z.string().min(8, "Minimum 8 characters"),
// });

// export function LoginPage() {
//   const [visible, setVisible] = useState(false);
//   const [serverError, setServerError] = useState("");
//   const navigate = useNavigate();
//   const setSession = useAuthStore((s) => s.setSession);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm({ resolver: zodResolver(schema) });
//   const submit = async (values) => {
//     setServerError("");
//     try {
//       const session = await api.post("/auth/login", values);
//       if (!["ADMIN", "VENDOR"].includes(session.user.role))
//         throw new Error("This portal is only for vendors and administrators.");
//       setSession(session);
//       navigate("/");
//     } catch (error) {
//       setServerError(
//         error.message === "Invalid email or password"
//           ? "Email or password is incorrect. New vendors must create an account first."
//           : error.message,
//       );
//     }
//   };
//   return (
//     <main className="login-page">
//       <section className="login-visual">
//         <div className="brand brand--light">
//           <span>
//             <CarFront />
//           </span>
//           <div>
//             SmartRide<small>Move smarter</small>
//           </div>
//         </div>
//         <div className="login-copy">
//           <span className="eyebrow">
//             <ShieldCheck size={16} /> Secure operations portal
//           </span>
//           <h1>
//             Every ride.
//             <br />
//             One clear view.
//           </h1>
//           <p>
//             Manage vehicles, bookings, partners, and performance from a
//             workspace built for fast decisions.
//           </p>
//         </div>
//         <div className="visual-orb visual-orb--one" />
//         <div className="visual-orb visual-orb--two" />
//       </section>
//       <section className="login-panel">
//         <form onSubmit={handleSubmit(submit)}>
//           <div className="mobile-brand">
//             <CarFront /> SmartRide
//           </div>
//           <span className="eyebrow">Welcome back</span>
//           <h2>Sign in to your workspace</h2>
//           <p>Use your vendor or administrator account.</p>
//           <label>
//             Email address
//             <input
//               {...register("email")}
//               type="email"
//               placeholder="name@company.com"
//             />
//             {errors.email && (
//               <small className="field-error">{errors.email.message}</small>
//             )}
//           </label>
//           <label>
//             Password
//             <div className="password-field">
//               <input
//                 {...register("password")}
//                 type={visible ? "text" : "password"}
//                 placeholder="Enter your password"
//               />
//               <button type="button" onClick={() => setVisible(!visible)}>
//                 {visible ? <EyeOff /> : <Eye />}
//               </button>
//             </div>
//             {errors.password && (
//               <small className="field-error">{errors.password.message}</small>
//             )}
//           </label>
//           {serverError && <div className="form-error">{serverError}</div>}
//           <button className="primary-button" disabled={isSubmitting}>
//             {isSubmitting ? (
//               "Signing in…"
//             ) : (
//               <>
//                 Sign in <ArrowRight size={18} />
//               </>
//             )}
//           </button>
//           <small className="login-help">
//             New vendor? <Link to="/register">Create an account</Link>
//           </small>
//         </form>
//       </section>
//     </main>
//   );
// }


import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CarFront, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

export function LoginPage() {
  const [visible, setVisible] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const submit = async (values) => {
    console.log("Login values:", {
      email: values.email,
      passwordEntered: Boolean(values.password),
    });

    setServerError("");

    try {
      console.log("Calling login API: /auth/login");

      const session = await api.post("/auth/login", values);

      console.log("Login response:", session);
      console.log("User role:", session.user?.role);

      if (!["ADMIN", "VENDOR"].includes(session.user.role))
        throw new Error("This portal is only for vendors and administrators.");

      setSession(session);
      console.log("Login successful. Session saved.");

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error message:", error.message);
      console.error("HTTP status:", error.response?.status);
      console.error("Backend response:", error.response?.data);

      setServerError(
        error.message === "Invalid email or password"
          ? "Email or password is incorrect. New vendors must create an account first."
          : error.message,
      );
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand brand--light">
          <span>
            <CarFront />
          </span>
          <div>
            SmartRide<small>Move smarter</small>
          </div>
        </div>

        <div className="login-copy">
          <span className="eyebrow">
            <ShieldCheck size={16} /> Secure operations portal
          </span>
          <h1>
            Every ride.
            <br />
            One clear view.
          </h1>
          <p>
            Manage vehicles, bookings, partners, and performance from a
            workspace built for fast decisions.
          </p>
        </div>

        <div className="visual-orb visual-orb--one" />
        <div className="visual-orb visual-orb--two" />
      </section>

      <section className="login-panel">
        <form onSubmit={handleSubmit(submit)}>
          <div className="mobile-brand">
            <CarFront /> SmartRide
          </div>

          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your workspace</h2>
          <p>Use your vendor or administrator account.</p>

          <label>
            Email address
            <input
              {...register("email")}
              type="email"
              placeholder="name@company.com"
            />
            {errors.email && (
              <small className="field-error">
                {errors.email.message}
              </small>
            )}
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                {...register("password")}
                type={visible ? "text" : "password"}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && (
              <small className="field-error">
                {errors.password.message}
              </small>
            )}
          </label>

          {serverError && (
            <div className="form-error">{serverError}</div>
          )}

          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? (
              "Signing in…"
            ) : (
              <>
                Sign in <ArrowRight size={18} />
              </>
            )}
          </button>

          <small className="login-help">
            New vendor? <Link to="/register">Create an account</Link>
          </small>
        </form>
      </section>
    </main>
  );
}
