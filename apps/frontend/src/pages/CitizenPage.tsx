/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";

// Импорт хуков и компонентов
import { useCitizenAppeals } from "../features/appeals/hooks/useAppeals";
import { NewAppealModal } from "../features/appeals/components/NewAppealModal";
import type { Appeal } from "../features/appeals/types";

export const CitizenPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  const { data: appeals, isLoading, isFetching } = useCitizenAppeals();

  // Строгая типизация мапперов
  const severityMap: Record<Appeal["status"], "success" | "info" | "danger"> = {
    done: "success",
    in_work: "info",
    overdue: "danger",
  };

  const labelMap: Record<Appeal["status"], string> = {
    done: "Решено",
    in_work: "В работе",
    overdue: "Просрочено ведомством",
  };

  const statusBodyTemplate = (rowData: Appeal) => {
    return (
      <Tag
        severity={severityMap[rowData.status]}
        value={labelMap[rowData.status]}
        className="uppercase text-xs tracking-wider px-3 py-1 rounded-md"
      />
    );
  };

  // Форматирование дат
  const dateStr = (dateVal: string | undefined | null) => {
    if (!dateVal) return "—";
    return new Date(dateVal).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const dateTemplate =
    (field: "created_at" | "deadline_at" | "executed_at") =>
    (rowData: Appeal) => {
      return <span className="text-gray-600">{dateStr(rowData[field])}</span>;
    };

  const actionsBodyTemplate = (rowData: Appeal) => {
    return (
      <div className="flex justify-end pr-2 box-border">
        <Button
          icon="pi pi-eye"
          label="Просмотр"
          onClick={() => {
            setSelectedAppeal(rowData);
            setDetailVisible(true);
          }}
          pt={{
            root: {
              className: `
                p-button-text p-button-sm text-green-600 hover:bg-green-50
                px-3 py-1.5 rounded-lg font-medium gap-2 transition-colors
            `,
            },
          }}
        />
      </div>
    );
  };

  // Метрики
  const totalCount = appeals?.length || 0;
  const inWorkCount = appeals?.filter(a => a.status === "in_work").length || 0;
  const doneCount = appeals?.filter(a => a.status === "done").length || 0;

  return (
    // Добавлен px-6 для боковых отступов самой страницы на больших экранах
    <div className="min-h-screen bg-gray-50/50 px-6 py-8 box-border flex flex-col w-full min-w-0">
      {/* Панель приветствия */}
      <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 box-border">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Личный кабинет гражданина
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Здесь вы можете подавать заявления и отслеживать статус их
            исполнения
          </p>
        </div>
        <Button
          label="Подать новое обращение"
          icon="pi pi-plus"
          onClick={() => setModalVisible(true)}
          pt={{
            root: {
              className: `
                    flex items-center gap-2
                    px-5 py-2.5 rounded-xl font-medium shadow-xs
                    bg-green-500 hover:bg-green-600 border-green-500 text-white transition-colors duration-200
                    `,
            },
          }}
        />
      </div>

      {/* 🎯 ЗАМЕНА СТАРАДАРТНЫХ CARD НА BULLETPROOF DIV С ПАДДИНГАМИ P-6 */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 box-border">
        <div className="bg-white p-6 shadow-xs border border-gray-200/60 rounded-2xl box-border flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">
              Всего подано обращений
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <i className="pi pi-folder text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-gray-800">
            {isLoading ? "..." : totalCount}
          </p>
        </div>

        <div className="bg-white p-6 shadow-xs border border-gray-200/60 rounded-2xl box-border flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">
              Сейчас на рассмотрении
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
              <i className="pi pi-clock text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-amber-600">
            {isLoading ? "..." : inWorkCount}
          </p>
        </div>

        <div className="bg-white p-6 shadow-xs border border-gray-200/60 rounded-2xl box-border flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">
              Успешно решено
            </span>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
              <i className="pi pi-check-circle text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-green-600">
            {isLoading ? "..." : doneCount}
          </p>
        </div>
      </div>

      {/* Основная таблица */}
      <div className="max-w-7xl w-full mx-auto bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden box-border min-w-0">
        <DataTable
          value={appeals || []}
          loading={isLoading || isFetching}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="Вы еще не отправляли обращений в организацию."
          // 🎯 УБРАН КЛАСС p-datatable-sm, КОТОРЫЙ СХЛОПЫВАЛ ВНУТРЕННИЕ ОТСТУПЫ СТРОК
          className="text-sm"
          stripedRows
          dataKey="id"
          responsiveLayout="scroll"
        >
          {/* Добавлены явные стилевые классы для заголовков и ячеек */}
          <Column
            field="id"
            header="№"
            sortable
            className="w-16 font-semibold text-gray-500 pl-4 py-4"
          />
          <Column
            field="title"
            header="Тема обращения"
            className="font-medium text-gray-800 max-w-xs truncate py-4"
          />
          <Column
            field="department_name"
            header="Целевое ведомство"
            className="py-4"
            body={(r: Appeal) =>
              r.department_name || (
                <span className="text-gray-400 italic text-xs">
                  На модерации
                </span>
              )
            }
          />
          <Column
            field="created_at"
            header="Дата подачи"
            sortable
            body={dateTemplate("created_at")}
            className="py-4"
          />
          <Column
            field="deadline_at"
            header="Ожидаемый срок"
            body={dateTemplate("deadline_at")}
            className="py-4"
          />
          <Column
            field="status"
            header="Статус"
            body={statusBodyTemplate}
            sortable
            className="w-44 py-4"
          />
          <Column body={actionsBodyTemplate} className="w-32 text-right py-4" />
        </DataTable>
      </div>

      {/* Модальное окно создания */}
      <NewAppealModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
      />

      {/* Модальное окно просмотра */}
      <Dialog
        header={`Детали обращения №${selectedAppeal?.id || ""}`}
        visible={detailVisible}
        onHide={() => {
          setDetailVisible(false);
          setSelectedAppeal(null);
        }}
        modal
        className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
        contentClassName="p-0 bg-white"
        headerClassName="border-b border-gray-100 p-5 text-xl font-bold text-gray-900 bg-white"
      >
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto px-6 py-5 box-border min-w-0 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Тема
            </span>
            <p className="text-base font-semibold text-gray-900">
              {selectedAppeal?.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Статус
              </span>
              <div>{selectedAppeal && statusBodyTemplate(selectedAppeal)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Дата подачи
              </span>
              <p className="text-gray-700 font-medium">
                {dateStr(selectedAppeal?.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Текст вашего обращения
            </span>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedAppeal?.description || "Описание отсутствует."}
            </p>
          </div>

          {selectedAppeal?.status === "done" && (
            <div className="flex flex-col gap-1 bg-green-50/60 p-4 rounded-xl border border-green-100/70">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">
                Официальный ответ организации
              </span>
              <p className="text-green-900 whitespace-pre-wrap leading-relaxed font-medium">
                {selectedAppeal.executed_at && (
                  <span className="block text-xs text-green-600/80 mb-1">
                    Решено: {dateStr(selectedAppeal.executed_at)}
                  </span>
                )}
                {(selectedAppeal as any).resolution ||
                  "Запрос успешно обработан, необходимые меры приняты."}
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
          <Button
            label="Закрыть"
            onClick={() => setDetailVisible(false)}
            pt={{
              root: {
                className: `
                    px-4 py-2.5 rounded-xl font-medium
                    bg-gray-500 hover:bg-gray-600 border-gray-500 text-white
                    transition-colors duration-200
                    `,
              },
            }}
          />
        </div>
      </Dialog>
    </div>
  );
};
