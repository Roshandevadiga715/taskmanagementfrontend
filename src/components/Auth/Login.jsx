import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../App"; // import useAuth
import { login as loginApi } from "../../api/authRequest"; // <-- import login from auth

const bgimg = ""; // Replace with your image path if available

const Login = () => {
  const navigate = useNavigate ? useNavigate() : () => {};
  const location = useLocation ? useLocation() : { state: null };
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginApi(formData);
      // loginApi saves token to localStorage if present
      login();
      setIsLoading(false);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setIsLoading(false);
      alert(
        error?.response?.data?.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <>
      <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgimg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="w-full max-w-[460px] space-y-8 bg-white p-8 rounded-[20px] relative z-10">
          <div className="text-start">
            <h2 className="text-[32px] font-bold font-afacad mb-2 leading-[40px] text-[#000000]">
              Welcome Back
            </h2>
            <p className="text-[#000000] text-[14px] font-normal font-poppins leading-[22px] tracking-[0.02em]">
              New here?{" "}
              <Link
                to="/signup"
                className="text-[#4348BD] font-semibold tracking-[0.02em] hover:underline"
              >
                Create an account.
              </Link>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-base font-normal font-poppins text-[#666666] leading-6 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email"
                className="w-full px-4 py-3 rounded border border-[#E1E6F8] focus:outline-none focus:ring-2 focus:ring-[#4348BD]/20"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-base font-normal font-poppins text-[#666666] leading-6 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded border border-[#E1E6F8] focus:outline-none focus:ring-2 focus:ring-[#4348BD]/20"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4348BD] text-white rounded-full py-3 font-semibold hover:bg-[#3338a1] transition-colors shadow-[0px_4px_20px_0px_#4348BD33]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>

          </form>
        </div>
      </div>
    </>
  );
};

export default Login;