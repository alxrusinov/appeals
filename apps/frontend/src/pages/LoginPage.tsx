import { LoginForm } from '../features/auth/components/LoginForm';

export const LoginPage = () => {
    return (
        <div className="min-h-screen w-full flex bg-gray-50 font-sans antialiased">

            {/* Левая панель: Презентационный блок (скрыт на мобильных, виден от md и выше) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-800 to-emerald-950 flex-col justify-between p-12 text-white relative overflow-hidden">

                {/* Фоновый декоративный элемент для глубины (синьорский UI-эффект) */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* Верхняя часть: Логотип */}
                <div className="flex items-center gap-3 z-10">
                    <i className="pi pi-building text-3xl text-green-400" />
                    <span className="text-xl font-black tracking-wider uppercase">Система ЖКХ</span>
                </div>

                {/* Центральная часть: Слоган и УТП проекта */}
                <div className="max-w-md my-auto z-10 animate-fadein">
                    <h2 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
                        Единый портал обработки обращений граждан
                    </h2>
                    <p className="text-green-100/80 text-lg leading-relaxed">
                        Централизованный контроль регламентных сроков, автоматическое распределение инцидентов по ведомствам и прозрачная аналитика.
                    </p>
                </div>

                {/* Нижняя часть: Подвал для комиссии */}
                <div className="text-sm text-green-300/60 z-10">
                    Дипломный проект • СибГУТИ • 2026
                </div>
            </div>

            {/* Правая панель: Форма авторизации (всегда по центру экрана) */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl md:shadow-lg md:border md:border-gray-100 animate-fadein">

                    {/* Адаптивный мобильный логотип (появляется только если экран маленький) */}
                    <div className="flex md:hidden items-center gap-2 justify-center text-green-700 mb-8">
                        <i className="pi pi-building text-3xl font-bold" />
                        <span className="text-xl font-black uppercase tracking-wider">Система ЖКХ</span>
                    </div>

                    {/* Заголовок формы */}
                    <div className="mb-6 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Вход в систему
                        </h3>
                        <p className="text-gray-500 mt-1 text-sm">
                            Используйте свои учетные данные для доступа к панели
                        </p>
                    </div>

                    {/* Наш очищенный компонент формы */}
                    <LoginForm />

                </div>
            </div>

        </div>
    );
};
