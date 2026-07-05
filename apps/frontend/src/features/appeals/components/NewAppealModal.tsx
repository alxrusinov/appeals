import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useCreateAppeal } from "../hooks/useAppeals";

type Props = { visible: boolean; onHide: () => void };

export const NewAppealModal = ({ visible, onHide }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { mutate, isPending } = useCreateAppeal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    mutate(
      { title, description },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          onHide(); // Закрываем модалку
        },
      },
    );
  };

  return (
    <Dialog
      header="Новое обращение в организацию"
      visible={visible}
      onHide={onHide}
      style={{ width: "450px" }}
      breakpoints={{ "960px": "75vw", "641px": "100vw" }}
      contentClassName="p-5"
      headerClassName="p-5 border-b"
      modal
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="font-medium text-gray-700">
            Краткое содержание (Тема)
          </label>
          <InputText
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-3 border rounded-xl text-sm box-border border-gray-300"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="desc" className="font-medium text-gray-700">
            Подробное описание проблемы
          </label>
          <InputTextarea
            id="desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            className="w-full p-3 border rounded-xl bg-gray-50/30 text-gray-900 focus:bg-white transition-all outline-hidden text-sm border-gray-300 focus:border-purple-500"
            required
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            label="Отмена"
            onClick={onHide}
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
          <Button
            type="submit"
            label="Отправить"
            loading={isPending}
            pt={{
              root: {
                className: `
                    px-5 py-2.5 rounded-xl font-medium shadow-xs
                    bg-green-500 hover:bg-green-600 border-green-500 text-white transition-colors duration-200
                    `,
              },
            }}
          />
        </div>
      </form>
    </Dialog>
  );
};
