import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { PrimaryButton } from "../../../components/buttons";
import { useAuth } from "../hooks/useAuth";

export const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [localError, setLocalError] = useState("");

  const { register, isRegistering } = useAuth();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setLocalError("Пожалуйста, заполните все поля");
      return;
    }
    if (password.length < 6) {
      setLocalError("Пароль должен содержать не менее 6 символов");
      return;
    }
    if (password !== passwordConfirm) {
      setLocalError("Пароли не совпадают");
      return;
    }

    register({ full_name: fullName, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <i className="pi pi-exclamation-circle text-base flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
          ФИО
        </label>
        <InputText
          id="fullName"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full p-inputtext-lg"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Электронная почта
        </label>
        <InputText
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-inputtext-lg"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Пароль
        </label>
        <InputText
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-inputtext-lg"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="passwordConfirm" className="text-sm font-semibold text-gray-700">
          Повторите пароль
        </label>
        <InputText
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={e => setPasswordConfirm(e.target.value)}
          className="w-full p-inputtext-lg"
        />
      </div>

      <PrimaryButton
        type="submit"
        label={isRegistering ? "Регистрация..." : "Зарегистрироваться"}
        icon={isRegistering ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
        loading={isRegistering}
      />
    </form>
  );
};
