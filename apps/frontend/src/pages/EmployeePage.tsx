/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { api } from "../services/api";

export const EmployeePage = () => {
  const queryClient = useQueryClient();
  const [ticketDialog, setTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Ошибки валидации (для темы, описания и решения)
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    resolution?: string;
  }>({});

  // Получение статистики через Axios инстанс
  const { data: stats = [] } = useQuery({
    queryKey: ["employeeStats"],
    queryFn: async () => {
      const { data } = await api.get("/api/employee/stats");
      return data;
    },
  });

  // Получение списка задач
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["employeeTickets"],
    queryFn: async () => {
      const { data } = await api.get("/employee/tickets");
      return data;
    },
  });

  // Мутация: ветвление на POST (создание) и PUT (редактирование)
  const saveTicketMutation = useMutation({
    mutationFn: async (ticket: any) => {
      if (ticket.id) {
        const { data } = await api.put(
          `/employee/tickets/${ticket.id}`,
          ticket,
        );
        return data;
      } else {
        const { data } = await api.post("/employee/tickets", ticket);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeTickets"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
      closeDialog();
    },
  });

  const closeDialog = () => {
    setTicketDialog(false);
    setSelectedTicket(null);
    setFormErrors({});
  };

  // Проверка обязательных полей на фронтенде перед отправкой в MSW
  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!selectedTicket?.id) {
      // Валидация создания новой задачи
      if (!selectedTicket?.title?.trim()) {
        errors.title = "Тема обращения обязательна для заполнения";
      }
      if (!selectedTicket?.description?.trim()) {
        errors.description = "Описание проблемы обязательно для заполнения";
      }
    } else {
      // Валидация закрытия существующей задачи
      if (
        selectedTicket.status === "Решено" &&
        !selectedTicket.resolution?.trim()
      ) {
        errors.resolution = "Необходимо указать решение для закрытия обращения";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTicket = () => {
    if (validateForm()) {
      saveTicketMutation.mutate(selectedTicket);
    }
  };

  // Скачивание CSV отчета, сгенерированного воркером MSW
  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get("/employee/report", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `my_tasks_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Не удалось скачать отчет по задачам:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const statusBodyTemplate = (rowData: any) => {
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";

    if (rowData.status === "Новое") {
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (rowData.status === "В работе") {
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (rowData.status === "Решено") {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border tracking-wide shadow-xs ${colorClass}`}
      >
        {rowData.status}
      </span>
    );
  };

  const priorityBodyTemplate = (rowData: any) => {
    let colorClass = "bg-gray-100 text-gray-600";
    if (rowData.priority === "Высокий")
      colorClass = "bg-red-100 text-red-700 font-bold";
    if (rowData.priority === "Средний")
      colorClass = "bg-orange-100 text-orange-700";

    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>
        {rowData.priority}
      </span>
    );
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2 justify-end">
        <Button
          icon="pi pi-eye"
          label="Открыть"
          className="p-button-text p-button-sm text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg font-medium gap-2"
          onClick={() => {
            setSelectedTicket({ ...rowData });
            setTicketDialog(true);
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-6 bg-gray-50/50">
      {/* Шапка рабочего пространства */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Рабочее пространство
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление назначенными обращениями, обработка инцидентов и фиксация
            решений
          </p>
        </div>
        <Button
          label="Скачать отчет"
          icon="pi pi-download mr-2"
          severity="secondary"
          loading={isDownloading}
          onClick={handleDownloadReport}
          className="shadow-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        />
      </div>

      {/* Метрики / Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat: any, idx: number) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <span className="text-3xl font-bold text-gray-900">
                {stat.count}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}
            >
              <i className={`pi ${stat.icon} ${stat.text} text-xl`} />
            </div>
          </div>
        ))}
      </div>

      {/* Основной контент и Таблица */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 md:p-6 flex-grow">
        <TabView
          className="admin-tabview"
          pt={{ nav: { className: "gap-3 md:gap-6 border-b-0" } }}
        >
          <TabPanel header="Мои задачи" leftIcon="pi pi-inbox mr-2.5">
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Обращения в работе
                </h2>
                <Button
                  label="Создать обращение"
                  icon="pi pi-plus-circle mr-2"
                  severity="success"
                  onClick={() => {
                    setSelectedTicket({
                      title: "",
                      category: "Техническая поддержка",
                      priority: "Средний",
                      description: "",
                      resolution: "",
                    });
                    setTicketDialog(true);
                  }}
                />
              </div>

              <DataTable
                value={tickets}
                loading={ticketsLoading}
                dataKey="id"
                rows={10}
                className="p-datatable-sm"
                responsiveLayout="scroll"
                emptyMessage="У вас нет назначенных обращений"
              >
                <Column field="id" header="№" className="w-16 text-gray-400" />
                <Column
                  field="title"
                  header="Тема обращения"
                  className="font-medium text-gray-900 max-w-xs truncate"
                />
                <Column
                  field="category"
                  header="Категория"
                  className="text-gray-600"
                />
                <Column
                  field="priority"
                  header="Приоритет"
                  body={priorityBodyTemplate}
                  className="w-28"
                />
                <Column
                  field="createdAt"
                  header="Дата поступления"
                  className="text-gray-500 w-44"
                />
                <Column
                  field="status"
                  header="Статус"
                  body={statusBodyTemplate}
                  className="w-36"
                />
                <Column body={actionsBodyTemplate} className="w-32" />
              </DataTable>
            </div>
          </TabPanel>
        </TabView>
      </div>

      {/* Единое модальное окно (Создание / Просмотр-Редактирование) */}
      <Dialog
        visible={ticketDialog}
        header={
          selectedTicket?.id
            ? `Обращение №${selectedTicket.id}`
            : "Новое внутреннее обращение"
        }
        modal
        onHide={closeDialog}
        className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
        breakpoints={{ "640px": "95vw" }}
        headerClassName="border-b border-gray-100 p-5 text-xl font-bold text-gray-900 bg-white"
        contentClassName="p-0 bg-white"
        pt={{
          footer: {
            className:
              "bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3 justify-end items-center",
          },
        }}
        footer={
          <>
            <Button
              label="Отмена"
              severity="secondary"
              text
              onClick={closeDialog}
              className="hover:bg-gray-200/50 text-gray-600 font-medium rounded-xl px-4 py-2.5"
            />
            <Button
              label={selectedTicket?.id ? "Сохранить" : "Создать"}
              severity="success"
              loading={saveTicketMutation.isPending}
              onClick={handleSaveTicket}
              className="px-5 py-2.5 rounded-xl font-medium shadow-xs"
            />
          </>
        }
      >
        <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto px-6 py-4 box-border">
          {selectedTicket && (
            <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto px-6 py-4 box-border min-w-0">
              {/* РЕЖИМ А: Форма отправки новой задачи */}
              {!selectedTicket.id ? (
                <>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Тема инцидента
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <InputText
                      value={selectedTicket.title}
                      placeholder="Краткое описание сути проблемы"
                      onChange={e => {
                        setSelectedTicket({
                          ...selectedTicket,
                          title: e.target.value,
                        });
                        if (formErrors.title)
                          setFormErrors({ ...formErrors, title: undefined });
                      }}
                      className={`w-full p-3 border rounded-xl text-sm box-border ${
                        formErrors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formErrors.title && (
                      <span className="text-xs text-red-500 font-medium ml-1">
                        {formErrors.title}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Категория
                      </label>
                      <Dropdown
                        value={selectedTicket.category}
                        options={[
                          "Техническая поддержка",
                          "Обслуживание техники",
                          "Учетные записи",
                        ]}
                        onChange={e =>
                          setSelectedTicket({
                            ...selectedTicket,
                            category: e.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl h-[46px] flex items-center box-border"
                        panelClassName="text-sm  p-2 mt-1"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Приоритет
                      </label>
                      <Dropdown
                        value={selectedTicket.priority}
                        options={["Низкий", "Средний", "Высокий"]}
                        onChange={e =>
                          setSelectedTicket({
                            ...selectedTicket,
                            priority: e.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl h-[46px] flex items-center box-border"
                        panelClassName="text-sm  p-2 mt-1"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Подробное описание задачи{" "}
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <InputTextarea
                      value={selectedTicket.description}
                      rows={4}
                      placeholder="Укажите детали, номера кабинетов или шаги для воспроизведения проблемы..."
                      onChange={e => {
                        setSelectedTicket({
                          ...selectedTicket,
                          description: e.target.value,
                        });
                        if (formErrors.description)
                          setFormErrors({
                            ...formErrors,
                            description: undefined,
                          });
                      }}
                      className={`w-full p-3 border rounded-xl bg-gray-50/30 text-gray-900 focus:bg-white transition-all outline-hidden text-sm ${
                        formErrors.description
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-purple-500"
                      }`}
                    />
                    {formErrors.description && (
                      <span className="text-xs text-red-500 font-medium ml-1">
                        {formErrors.description}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* РЕЖИМ Б: Карточка работы с текущей задачей */
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                      <span>Автор: {selectedTicket.author}</span>
                      <span>{selectedTicket.createdAt}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {selectedTicket.title}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line mt-1">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Текущий статус
                    </label>
                    <Dropdown
                      value={selectedTicket.status}
                      options={["Новое", "В работе", "Решено"]}
                      onChange={e => {
                        setSelectedTicket({
                          ...selectedTicket,
                          status: e.value,
                        });
                        if (formErrors.resolution)
                          setFormErrors({
                            ...formErrors,
                            resolution: undefined,
                          });
                      }}
                      className="w-full border border-gray-300 rounded-xl h-[46px] flex items-center box-border"
                      panelClassName="text-sm p-2 mt-1"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ход решения / Заключение
                      {selectedTicket.status === "Решено" && (
                        <span className="text-red-500 font-bold"> *</span>
                      )}
                    </label>
                    <InputTextarea
                      value={selectedTicket.resolution || ""}
                      rows={4}
                      placeholder="Опишите выполненные действия..."
                      onChange={e => {
                        setSelectedTicket({
                          ...selectedTicket,
                          resolution: e.target.value,
                        });
                        if (formErrors.resolution)
                          setFormErrors({
                            ...formErrors,
                            resolution: undefined,
                          });
                      }}
                      className={`w-full p-3 border rounded-xl bg-gray-50/30 text-gray-900 focus:bg-white transition-all outline-hidden text-sm ${
                        formErrors.resolution
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-purple-500"
                      }`}
                    />
                    {formErrors.resolution && (
                      <span className="text-xs text-red-500 font-medium ml-1">
                        {formErrors.resolution}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
