import { Button } from "primereact/button";
import type { ButtonProps } from "primereact/button";

// Общие варианты кнопок PrimeReact, чтобы не повторять одни и те же
// tailwind-классы в каждом диалоге (AdminPage/EmployeePage/CitizenPage/...).

const baseClasses = "rounded-xl font-medium transition-colors duration-200";

// Второстепенное действие: "Отмена", "Закрыть", "Скачать отчет" — серая кнопка
export const SecondaryButton = (props: ButtonProps) => (
  <Button
    {...props}
    pt={{
      root: {
        className: `px-4 py-2.5 ${baseClasses} bg-gray-500 hover:bg-gray-600 border-gray-500 text-white`,
      },
    }}
  />
);

// Основное действие: "Создать", "Сохранить", "Отправить", "Войти" — зеленая кнопка.
// disabled:* классы разом заменяют ручную pt-функцию с opt?.props?.disabled.
export const PrimaryButton = (props: ButtonProps) => (
  <Button
    {...props}
    pt={{
      root: {
        className: `px-5 py-2.5 ${baseClasses} shadow-xs bg-green-500 hover:bg-green-600 border-green-500 text-white
          disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-gray-300`,
      },
    }}
  />
);
