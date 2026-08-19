import { Button } from "primereact/button";

export const UnauthorizedPage = () => {
  const handleGoBack = () => {
    // Если есть история переходов — возвращаем назад, иначе на главную
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleSwitchAccount = () => {
    // Физически очищаем токен для предотвращения циклического редиректа
    localStorage.removeItem("token");

    // Перенаправляем на страницу логина
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/50 p-4 box-border">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center flex flex-col items-center gap-6 box-border">
        {/* Анимированный щит безопасности */}
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-xs">
          <i
            className="pi pi-shield text-red-500 text-4xl animate-bounce"
            style={{ animationDuration: "3s" }}
          />
        </div>

        {/* Информационный текст */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Доступ ограничен
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed px-2">
            У вашей учетной записи недостаточно прав для просмотра этого
            раздела. Убедитесь, что вы авторизованы под нужной ролью.
          </p>
        </div>

        {/* Разделитель */}
        <hr className="w-full border-gray-100 my-1" />

        {/* Экшены с фиксом отступов иконок (gap-2) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button
            label="Назад"
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={handleGoBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-xs gap-2"
          />
          <Button
            label="Сменить аккаунт"
            icon="pi pi-sign-out"
            severity="danger"
            onClick={handleSwitchAccount}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium shadow-xs gap-2"
          />
        </div>
      </div>
    </div>
  );
};
