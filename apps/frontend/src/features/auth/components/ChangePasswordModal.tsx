/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../services/api";
import { SecondaryButton, PrimaryButton } from "../../../components/buttons";

type Props = { visible: boolean; onHide: () => void };

// Доступно любой авторизованной роли (см. MainLayout) — актуально в том числе
// для пользователей, заведенных администратором с временным паролем
// (см. AdminPage: временный пароль показывается один раз при создании сотрудника).
export const ChangePasswordModal = ({ visible, onHide }: Props) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [localError, setLocalError] = useState("");

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setLocalError("");
  };

  const closeAndReset = () => {
    reset();
    onHide();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
    },
    onSuccess: () => {
      alert("Пароль успешно изменен.");
      closeAndReset();
    },
    onError: (err: any) => {
      setLocalError(err.response?.data?.error || "Не удалось изменить пароль");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!oldPassword.trim() || !newPassword.trim()) {
      setLocalError("Заполните оба поля пароля");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Новый пароль должен содержать не менее 6 символов");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setLocalError("Новые пароли не совпадают");
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog
      header="Смена пароля"
      visible={visible}
      onHide={closeAndReset}
      modal
      className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
      breakpoints={{ "640px": "92vw" }}
      headerClassName="border-b border-gray-100 p-5 text-xl font-bold text-gray-900 bg-white"
      contentClassName="p-6 bg-white"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {localError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <i className="pi pi-exclamation-circle text-base flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-semibold text-gray-700">Текущий пароль</label>
          <InputText
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="w-full p-3 border rounded-xl text-sm box-border border-gray-300"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-semibold text-gray-700">Новый пароль</label>
          <InputText
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full p-3 border rounded-xl text-sm box-border border-gray-300"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-semibold text-gray-700">Повторите новый пароль</label>
          <InputText
            type="password"
            value={newPasswordConfirm}
            onChange={e => setNewPasswordConfirm(e.target.value)}
            className="w-full p-3 border rounded-xl text-sm box-border border-gray-300"
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <SecondaryButton type="button" label="Отмена" onClick={closeAndReset} />
          <PrimaryButton type="submit" label="Сохранить" loading={mutation.isPending} />
        </div>
      </form>
    </Dialog>
  );
};
