interface Props {
  title: string;
  count: number | string;
  icon: string; // класс иконки PrimeIcons, например "pi-inbox"
  color: string; // фон бейджа-иконки, например "bg-blue-500"
  text: string; // цвет иконки, например "text-blue-500"
}

// Карточка метрики в сетке дашборда — использовалась одинаковой разметкой
// в AdminPage и EmployeePage.
export const StatCard = ({ title, count, icon, color, text }: Props) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200">
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        {title}
      </span>
      <span className="text-3xl font-bold text-gray-900">{count}</span>
    </div>
    <div
      className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}
    >
      <i className={`pi ${icon} ${text} text-xl`} />
    </div>
  </div>
);
