/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

import { api } from "../services/api";
import { downloadCsv, todayForFilename } from "../utils/csv";
import { SecondaryButton, PrimaryButton } from "../components/buttons";
import { StatCard } from "../components/StatCard";

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [userDialog, setUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: rawStats = [] } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data;
    },
  });

  const { data: rawUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users");
      return data;
    },
  });

  const users = useMemo(() => {
    return rawUsers.filter(
      (user: any) => user.role === "admin" || user.role === "employee",
    );
  }, [rawUsers]);

  const updateUserMutation = useMutation({
    mutationFn: async (user: any) => {
      if (user.id) {
        const { data } = await api.put(`/admin/users/${user.id}`, user);
        return data;
      } else {
        const { data } = await api.post("/admin/users", user);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      closeDialog();
    },
  });

  const closeDialog = () => {
    setUserDialog(false);
    setSelectedUser(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};

    if (!selectedUser?.name?.trim()) {
      errors.name = "ФИО сотрудника обязательно для заполнения";
    }

    if (!selectedUser?.email?.trim()) {
      errors.email = "Email адрес обязателен для заполнения";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedUser.email)) {
      errors.email = "Введите корректный email адрес";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = () => {
    if (validateForm()) {
      updateUserMutation.mutate(selectedUser);
    }
  };

  const handleDownloadReport = () => {
    if (!users || users.length === 0) {
      console.warn("Нет данных для скачивания");
      return;
    }

    setIsDownloading(true);
    try {
      const header = "ID;ФИО сотрудника;Email;Роль в системе;Статус\n";
      const rows = users.map((u: any) => [u.id, u.name, u.email, u.role, u.status]);

      downloadCsv(`employees_report_${todayForFilename()}.csv`, header, rows);
    } catch (error) {
      console.error("Не удалось сгенерировать CSV отчет:", error);
      // Здесь можно добавить уведомление для пользователя, например: toast.error("Ошибка при скачивании");
    } finally {
      // Блок finally сработает всегда, даже если возникла ошибка
      setIsDownloading(false);
    }
  };

  const stats = useMemo(() => {
    return [
      {
        title: "Всего обращений",
        count: rawStats ? rawStats.total_count : 0,
        icon: "pi-ticket",
        color: "bg-blue-500",
        text: "text-blue-500",
      },
      {
        title: "В работе",
        count: rawStats.by_status?.in_work ? rawStats.by_status.in_work : 0,
        icon: "pi-spin pi-spinner",
        color: "bg-amber-500",
        text: "text-amber-500",
      },
      {
        title: "Активные операторы",
        count: users.filter((u: { role: string }) => u.role === "employee")
          .length,
        icon: "pi-users",
        color: "bg-green-500",
        text: "text-green-500",
      },
    ];
  }, [rawStats, users]);

  // 🎯 ИСПРАВЛЕНО: Заменили <Tag> на чистый <span> с гарантированной поддержкой паддингов Tailwind
  const statusBodyTemplate = (rowData: any) => {
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";

    if (rowData.status === "Активен") {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (rowData.status === "В отпуске") {
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (rowData.status === "Заблокирован") {
      colorClass = "bg-red-50 text-red-700 border-red-200";
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border tracking-wide shadow-3xs ${colorClass}`}
      >
        {rowData.status}
      </span>
    );
  };

  const roleBodyTemplate = (rowData: any) => {
    const colorClass =
      rowData.role === "Администратор"
        ? "bg-purple-100 text-purple-700 font-bold"
        : "bg-gray-100 text-gray-700";
    return (
      <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
        {rowData.role}
      </span>
    );
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2 justify-end">
        <Button
          icon="pi pi-pencil"
          onClick={() => {
            setSelectedUser({ ...rowData });
            setUserDialog(true);
          }}
          pt={{
            root: {
              className: `
                p-button-text p-button-sm text-blue-600 hover:bg-blue-50
                rounded-lg transition-colors
            `,
            },
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-6 bg-gray-50/50">
      {/* Хедер страницы */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Панель администратора
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление системой мониторинга обращений, ролями и внутренней
            аналитикой
          </p>
        </div>
        <SecondaryButton
          label="Скачать отчет"
          icon="pi pi-download mr-2"
          loading={isDownloading}
          onClick={handleDownloadReport}
        />
      </div>

      {/* БЛОК АНАЛИТИКИ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* ОСНОВНОЙ РАЗДЕЛ С ТАБАМИ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 md:p-6 flex-grow">
        <TabView
          className="admin-tabview"
          pt={{
            nav: { className: "gap-3 md:gap-6 border-b-0" },
          }}
        >
          <TabPanel header="Пользователи" leftIcon="pi pi-users mr-2.5">
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Реестр сотрудников
                </h2>
                <PrimaryButton
                  label="Добавить сотрудника"
                  icon="pi pi-user-plus mr-2"
                  onClick={() => {
                    setSelectedUser({
                      name: "",
                      email: "",
                      role: "employee",
                      status: "Активен",
                    });
                    setUserDialog(true);
                  }}
                />
              </div>

              <DataTable
                value={users}
                loading={usersLoading}
                dataKey="id"
                rows={10}
                className="p-datatable-sm"
                responsiveLayout="scroll"
                emptyMessage="Пользователи не найдены"
              >
                <Column field="id" header="ID" className="w-16 text-gray-400" />
                <Column
                  field="name"
                  header="ФИО сотрудника"
                  className="font-medium text-gray-900"
                />
                <Column field="email" header="Email" />
                <Column
                  field="role"
                  header="Роль в системе"
                  body={roleBodyTemplate}
                />
                <Column
                  field="status"
                  header="Статус"
                  body={statusBodyTemplate}
                  className="w-36"
                />
                <Column body={actionsBodyTemplate} className="w-24" />
              </DataTable>
            </div>
          </TabPanel>

          <TabPanel
            header="Управление очередями"
            leftIcon="pi pi-sliders-h mr-2.5"
          >
            <div className="py-8 text-center max-w-md mx-auto flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-2">
                <i className="pi pi-sliders-h text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Маршрутизация заявок
              </h3>
              <p className="text-sm text-gray-500">
                Здесь настраиваются автоматические правила распределения
                входящих обращений по категориям и отделам.
              </p>
              <Button
                label="Настроить правила"
                pt={{
                  root: {
                    className: `
                        mt-2 px-4 py-2 rounded-xl font-medium
                        bg-purple-500 hover:bg-purple-600 border-purple-500 text-white
                        transition-colors
                    `,
                  },
                }}
              />
            </div>
          </TabPanel>
        </TabView>
      </div>

      {/* ДИАЛОГОВОЕ ОКНО */}
      <Dialog
        visible={userDialog}
        header={
          selectedUser?.id ? "Редактировать сотрудника" : "Новый сотрудник"
        }
        modal
        onHide={closeDialog}
        className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
        breakpoints={{ "640px": "92vw" }}
        headerClassName="border-b border-gray-100 p-5 text-xl font-bold text-gray-900 bg-white"
        contentClassName="p-6 pb-2 bg-white"
        pt={{
          footer: {
            className:
              "bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3 justify-end items-center",
          },
        }}
        footer={
          <>
            <SecondaryButton label="Отмена" onClick={closeDialog} />
            <PrimaryButton
              label={selectedUser?.id ? "Сохранить" : "Создать"}
              loading={updateUserMutation.isPending}
              onClick={handleSaveUser}
            />
          </>
        }
      >
        {selectedUser && (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Поле: ФИО */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-0.5">
                ФИО сотрудника <span className="text-red-500 font-bold">*</span>
              </label>
              <InputText
                value={selectedUser.name}
                placeholder="Например, Иванов Петр Сидорович"
                onChange={e => {
                  setSelectedUser({ ...selectedUser, name: e.target.value });
                  if (formErrors.name)
                    setFormErrors({ ...formErrors, name: undefined });
                }}
                className={`w-full p-3 border rounded-xl bg-gray-50/30 text-gray-900 focus:bg-white transition-all outline-hidden ${
                  formErrors.name
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-purple-500"
                }`}
              />
              {formErrors.name && (
                <span className="text-xs text-red-500 font-medium ml-1">
                  {formErrors.name}
                </span>
              )}
            </div>

            {/* Поле: Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-0.5">
                Email адрес <span className="text-red-500 font-bold">*</span>
              </label>
              <InputText
                type="email"
                value={selectedUser.email}
                placeholder="username@sibguti.ru"
                onChange={e => {
                  setSelectedUser({ ...selectedUser, email: e.target.value });
                  if (formErrors.email)
                    setFormErrors({ ...formErrors, email: undefined });
                }}
                className={`w-full p-3 border rounded-xl bg-gray-50/30 text-gray-900 focus:bg-white transition-all outline-hidden ${
                  formErrors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-purple-500"
                }`}
              />
              {formErrors.email && (
                <span className="text-xs text-red-500 font-medium ml-1">
                  {formErrors.email}
                </span>
              )}
            </div>

            {/* Поле: Роль */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Роль в системе
              </label>
              <Dropdown
                value={selectedUser.role}
                options={[
                  { label: "Администратор", value: "admin" },
                  { label: "Исполнитель", value: "employee" },
                ]}
                onChange={e =>
                  setSelectedUser({ ...selectedUser, role: e.value })
                }
                className="w-full border border-gray-300 rounded-xl bg-gray-50/30 text-gray-900 focus:border-purple-500 focus:bg-white transition-all outline-hidden"
                pt={{
                  root: { className: "p-1" },
                  input: { className: "p-2 text-sm" },
                }}
              />
            </div>

            {/* Поле: Статус */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Статус доступа
              </label>
              <Dropdown
                value={selectedUser.status}
                options={["Активен", "В отпуске", "Заблокирован"]}
                onChange={e =>
                  setSelectedUser({ ...selectedUser, status: e.value })
                }
                className="w-full border border-gray-300 rounded-xl bg-gray-50/30 text-gray-900 focus:border-purple-500 focus:bg-white transition-all outline-hidden"
                pt={{
                  root: { className: "p-1" },
                  input: { className: "p-2 text-sm" },
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
