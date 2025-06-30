import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../App"; // import useAuth
import { signup as signupApi } from "../../api/auth";

const bgimg = ""; // Replace with your image path if available

const Signup = () => {
  const navigate = useNavigate ? useNavigate() : () => {};
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const allFieldsFilled =
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.password.trim() !== "" &&
      formData.confirmPassword.trim() !== "";
    const passwordsDoMatch = formData.password === formData.confirmPassword;
    setPasswordsMatch(passwordsDoMatch);
    setIsFormValid(allFieldsFilled && passwordsDoMatch);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const { name, email, password } = formData;
      await signupApi({ name, email, password });
      login();
      setIsLoading(false);
      navigate("/");
    } catch (error) {
      setIsLoading(false);
      // Optionally handle error, e.g. show error message
      alert(
        error?.response?.data?.message ||
          "Signup failed. Please try again."
      );
    }
  };

  return (
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
            Create Account
          </h2>
          <p className="text-[#000000] text-[14px] font-normal font-poppins leading-[22px] tracking-[0.02em]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#4348BD] font-semibold tracking-[0.02em] hover:underline"
            >
              Login.
            </Link>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-base font-normal font-poppins text-[#666666] leading-6 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter name"
              className="w-full px-4 py-3 rounded border border-[#E1E6F8] focus:outline-none focus:ring-2 focus:ring-[#4348BD]/20"
            />
          </div>
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
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-base font-normal font-poppins text-[#666666] leading-6 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded border border-[#E1E6F8] focus:outline-none focus:ring-2 focus:ring-[#4348BD]/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
            </div>
            {!passwordsMatch && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full bg-[#4348BD] text-white rounded-full py-3 font-semibold hover:bg-[#3338a1] transition-colors shadow-[0px_4px_20px_0px_#4348BD33]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                <span>Signing up...</span>
              </>
            ) : (
              "Sign Up"
            )}
          </button>
 
        </form>
      </div>
    </div>
  );
};

export default Signup;