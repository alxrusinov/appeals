import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useCreateAppeal } from '../hooks/useAppeals';

type Props = { visible: boolean; onHide: () => void };

export const NewAppealModal = ({ visible, onHide }: Props) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const { mutate, isPending } = useCreateAppeal();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        mutate({ title, description }, {
            onSuccess: () => {
                setTitle('');
                setDescription('');
                onHide(); // Закрываем модалку
            }
        });
    };

    return (
        <Dialog header="Новое обращение в организацию" visible={visible} onHide={onHide} className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="font-medium">Краткое содержание (Тема)</label>
                    <InputText id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="desc" className="font-medium">Подробное описание проблемы</label>
                    <InputTextarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" label="Отмена" severity="secondary" onClick={onHide} outlined />
                    <Button type="submit" label="Отправить" loading={isPending} />
                </div>
            </form>
        </Dialog>
    );
};
