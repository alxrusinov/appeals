/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useAuth } from "../hooks/useAuth";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Состояние для переключения видимости пароля
  const [localError, setLocalError] = useState("");

  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");

    if (!email.trim() || !password.trim()) {
      setLocalError("Пожалуйста, заполните все поля");
      return;
    }

    login({ email, password });
  };

  const serverErrorMessage =
    (loginError as any)?.response?.data?.message || "Неверный email или пароль";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Блок отображения ошибок */}
      {(localError || loginError) && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <i className="pi pi-exclamation-circle text-base flex-shrink-0" />
          <span>{localError || serverErrorMessage}</span>
        </div>
      )}

      {/* Поле: Электронная почта */}
      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Электронная почта
        </label>
        <div className="relative w-full">
          <InputText
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-inputtext-lg"
          />
          <i className="pi pi-envelope text-gray-400 pointer-events-none text-base" />
        </div>
      </div>

      {/* Поле: Пароль */}
      <div className="flex flex-col gap-2 w-full">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-gray-700"
        >
          Пароль
        </label>
        <div className="relative w-full">
          <InputText
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-inputtext-lg"
          />
          <i
            className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"} text-gray-400 cursor-pointer text-base hover:text-gray-600 transition-colors`}
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>
      </div>

      {/* Кнопка войти */}
      <Button
        type="submit"
        label={isLoggingIn ? "Вход в систему..." : "Войти"}
        icon={isLoggingIn ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
        loading={isLoggingIn}
        pt={{
          root: {
            className: `
                    px-5 py-2.5 rounded-xl font-medium shadow-xs
                    bg-green-500 hover:bg-green-600 border-green-500 text-white transition-colors duration-200
                    `,
          },
        }}
      />
    </form>
  );
};
