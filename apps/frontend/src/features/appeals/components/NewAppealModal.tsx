import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { SecondaryButton, PrimaryButton } from "../../../components/buttons";
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
          <SecondaryButton type="button" label="Отмена" onClick={onHide} />
          <PrimaryButton type="submit" label="Отправить" loading={isPending} />
        </div>
      </form>
    </Dialog>
  );
};
